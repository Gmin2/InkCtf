import { Difficulty } from './types';
import type { Level } from './types';

// Contract addresses on Paseo Asset Hub testnet
export const CONTRACT_ADDRESSES = {
  statistics: '0x40c68bb385e9AD1d19D1FA5ABc86BE0f1464099b',
  factories: {
    instance: '0x9ae57Cf7f28651FB3AB5d86524D0049362D29C8E',
    fallback: '0x93fF27d4d3ad03D3aa596b75dEdb9c94a94D1F13',
    reentrance: '0x165e19c3D5b9Cf24395AF1E2286c73410F3be712',
    coinflip: '0x8fde0C3f9c11bee2F66F0E82415834fe67f25aAa',
    king: '0x5b5c27597917857d2869f2ffe61F8606DBe4a5db',
    vault: '0x14279D8C03c9feAaFe36229a634505EF231c4476',
  },
  codeHashes: {
    instance: '0xd8b60704c36f928777a7f33c5c222beb1c1000eca8a4a1f4088dc8e29c495580',
    fallback: '0xfd47475d49abc7bcc8b5e39b4d7fd66537d844665805d7b9544e91cf2e6c9e28',
    reentrance: '0xf4dec3b5da389f71a7329ffd236321caaeccac224d0ff94646f4589ae106fb25',
    coinflip: '0x82051d3847c7b748a6d5edb3c156d1155ff31a084989e9fee0f7b33094e2bcb2',
    king: '0x61e5ec54b7481fb3562df6d44c29d3604da9fc5f4d876e6a44d945cc90133d6b',
    vault: '0x4f99e8a789f82e69e30bce1ada23bd42a47c454dccb96ffbbf6edbb4bc4d5199',
  },
};

export const NETWORK = {
  name: 'Paseo Asset Hub',
  rpc: 'wss://testnet-passet-hub.polkadot.io',
  explorer: 'https://passet-hub.subscan.io',
};

export const LEVELS: Level[] = [
  {
    id: 'instance',
    title: 'Instance',
    difficulty: Difficulty.EASY,
    description: 'Welcome to ink!Spector Gadget! Your first mission is simple - authenticate with the correct password. But where could it be hidden?',
    objective: 'Call `authenticate()` with the correct password to clear the level.',
    sourceCode: `#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod instance {
    use ink::prelude::string::String;

    #[ink(storage)]
    pub struct Instance {
        password: String,
        cleared: bool,
    }

    impl Instance {
        #[ink(constructor)]
        pub fn new(password: String) -> Self {
            Self {
                password,
                cleared: false,
            }
        }

        /// Check if a password is correct and mark as cleared
        #[ink(message)]
        pub fn authenticate(&mut self, passkey: String) {
            if passkey == self.password {
                self.cleared = true;
            }
        }

        /// Check if level is completed
        #[ink(message)]
        pub fn get_cleared(&self) -> bool {
            self.cleared
        }

        /// Get the password (PUBLIC - this is the vulnerability!)
        #[ink(message)]
        pub fn get_password(&self) -> String {
            self.password.clone()
        }
    }
}`,
    initialState: { password: '???', cleared: false },
    contractAddress: CONTRACT_ADDRESSES.factories.instance,
    hint: 'The password is stored in the contract. Where could it be hiding?',
    skills: ['Reading contract storage', 'Understanding constructors'],
  },
  {
    id: 'fallback',
    title: 'Fallback',
    difficulty: Difficulty.MEDIUM,
    description: 'This contract has an owner with a massive contribution. Can you find a way to claim ownership and drain the funds?',
    objective: '1) Claim ownership of the contract. 2) Reduce its balance to 0.',
    sourceCode: `#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod fallback {
    use ink::storage::Mapping;

    #[ink(storage)]
    pub struct Fallback {
        owner: ink::primitives::Address,
        contributions: Mapping<ink::primitives::Address, Balance>,
        cleared: bool,
    }

    impl Fallback {
        #[ink(constructor)]
        pub fn new() -> Self {
            let caller = Self::env().caller();
            let mut contributions = Mapping::new();
            // Owner starts with 1000 tokens - impossible to outcontribute!
            contributions.insert(caller, &1000_000_000_000_000u128);
            Self { owner: caller, contributions, cleared: false }
        }

        /// Contribute - but limited to < 0.001 tokens per call
        #[ink(message, payable)]
        pub fn contribute(&mut self) {
            let caller = self.env().caller();
            let value = self.env().transferred_value().low_u128();
            assert!(value < 1_000_000_000, "Contribution too large");

            let current = self.contributions.get(caller).unwrap_or(0);
            self.contributions.insert(caller, &(current + value));

            // Become owner if you outcontribute (practically impossible)
            if self.contributions.get(caller).unwrap_or(0)
               > self.contributions.get(self.owner).unwrap_or(0) {
                self.owner = caller;
            }
        }

        /// THE VULNERABILITY: Backdoor to ownership!
        #[ink(message, payable)]
        pub fn fallback(&mut self) {
            let caller = self.env().caller();
            let value = self.env().transferred_value().low_u128();
            assert!(value > 0, "Must send value");
            assert!(self.contributions.get(caller).unwrap_or(0) > 0,
                    "Must have contributed first");
            // Instant ownership!
            self.owner = caller;
        }

        /// Withdraw all funds (only owner)
        #[ink(message)]
        pub fn withdraw(&mut self) {
            assert!(self.env().caller() == self.owner, "Only owner");
            let balance = self.env().balance();
            let amount = balance.saturating_sub(ink::primitives::U256::from(1));
            if amount > ink::primitives::U256::from(0) {
                self.cleared = true;
                self.env().transfer(self.owner, amount).expect("Transfer failed");
            }
        }

        #[ink(message)]
        pub fn get_owner(&self) -> ink::primitives::Address { self.owner }

        #[ink(message)]
        pub fn get_cleared(&self) -> bool { self.cleared }
    }
}`,
    initialState: { owner: 'factory', balance: 1000, yourContribution: 0 },
    contractAddress: CONTRACT_ADDRESSES.factories.fallback,
    hint: "Look at how ownership can be transferred. What's special about the fallback function?",
    skills: ['Fallback functions', 'Ownership patterns'],
  },
  {
    id: 'reentrance',
    title: 'Re-entrancy',
    difficulty: Difficulty.HARD,
    description: 'A simple donation bank. Users can donate to addresses and withdraw their balance. The contract has some funds - can you take them all?',
    objective: 'Drain all funds from the contract.',
    sourceCode: `#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod reentrance {
    use ink::storage::Mapping;

    #[ink(storage)]
    pub struct Reentrance {
        balances: Mapping<ink::primitives::Address, Balance>,
    }

    impl Reentrance {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self { balances: Mapping::new() }
        }

        /// Donate to an address
        #[ink(message, payable)]
        pub fn donate(&mut self, to: ink::primitives::Address) {
            let value = self.env().transferred_value().low_u128();
            let current = self.balances.get(to).unwrap_or(0);
            self.balances.insert(to, &(current + value));
        }

        #[ink(message)]
        pub fn balance_of(&self, who: ink::primitives::Address) -> Balance {
            self.balances.get(who).unwrap_or(0)
        }

        /// THE VULNERABILITY: Transfer BEFORE balance update!
        #[ink(message)]
        pub fn withdraw(&mut self, amount: Balance) {
            let caller = self.env().caller();
            let balance = self.balances.get(caller).unwrap_or(0);

            if balance >= amount {
                // DANGER: External call BEFORE state update
                if self.env().transfer(caller,
                    ink::primitives::U256::from(amount)).is_ok() {
                    // Too late! Attacker already re-entered
                    self.balances.insert(caller, &(balance - amount));
                }
            }
        }

        #[ink(message)]
        pub fn get_balance(&self) -> Balance {
            self.env().balance().low_u128()
        }
    }
}`,
    initialState: { contractBalance: 1000, yourBalance: 0 },
    contractAddress: CONTRACT_ADDRESSES.factories.reentrance,
    hint: 'What happens if you call withdraw before the balance is updated?',
    skills: ['Reentrancy attacks', 'Check-effects-interactions pattern'],
  },
  {
    id: 'coinflip',
    title: 'Coin Flip',
    difficulty: Difficulty.MEDIUM,
    description: 'A coin flipping game. Guess correctly to increase your winning streak. Can you win 10 times in a row?',
    objective: 'Win 10 consecutive coin flips.',
    sourceCode: `#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod coinflip {

    #[ink(storage)]
    pub struct Coinflip {
        consecutive_wins: u32,
        last_block_number: u32,
    }

    impl Coinflip {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {
                consecutive_wins: 0,
                last_block_number: 0,
            }
        }

        /// THE VULNERABILITY: "Random" from block number!
        #[ink(message)]
        pub fn flip(&mut self, guess: bool) -> bool {
            let block_number = self.env().block_number();

            assert!(
                self.last_block_number != block_number,
                "Cannot flip twice in same block"
            );
            self.last_block_number = block_number;

            // "Randomness" = block_number % 2 (PREDICTABLE!)
            let side = (block_number % 2) == 1;

            if side == guess {
                self.consecutive_wins += 1;
                true
            } else {
                self.consecutive_wins = 0;
                false
            }
        }

        #[ink(message)]
        pub fn get_consecutive_wins(&self) -> u32 {
            self.consecutive_wins
        }
    }
}`,
    initialState: { consecutiveWins: 0, target: 10 },
    contractAddress: CONTRACT_ADDRESSES.factories.coinflip,
    hint: "Blockchain randomness isn't truly random. Can you predict the outcome?",
    skills: ['Pseudo-randomness', 'Block properties'],
  },
  {
    id: 'king',
    title: 'King',
    difficulty: Difficulty.MEDIUM,
    description: 'Whoever sends more than the current prize becomes the new king. The old king gets paid. Simple... right?',
    objective: 'Become the king AND prevent anyone else (including the factory) from reclaiming the throne.',
    sourceCode: `#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod king {

    #[ink(storage)]
    pub struct King {
        king: ink::primitives::Address,
        prize: Balance,
        owner: ink::primitives::Address,
    }

    impl King {
        #[ink(constructor, payable)]
        pub fn new() -> Self {
            let caller = Self::env().caller();
            let value = Self::env().transferred_value().low_u128();
            Self { owner: caller, king: caller, prize: value }
        }

        /// THE VULNERABILITY: Reverts if transfer to old king fails!
        #[ink(message, payable)]
        pub fn claim_throne(&mut self) {
            let caller = self.env().caller();
            let value = self.env().transferred_value().low_u128();

            assert!(
                value >= self.prize || caller == self.owner,
                "Must send at least the prize amount"
            );

            // If king is a contract that rejects transfers... GAME OVER
            if self.env().transfer(self.king,
                ink::primitives::U256::from(self.prize)).is_err() {
                panic!("Transfer to previous king failed");
            }

            self.king = caller;
            self.prize = value;
        }

        #[ink(message)]
        pub fn get_king(&self) -> ink::primitives::Address { self.king }

        #[ink(message)]
        pub fn get_prize(&self) -> Balance { self.prize }
    }
}`,
    initialState: { king: 'factory', prize: 100 },
    contractAddress: CONTRACT_ADDRESSES.factories.king,
    hint: 'What if the previous king refuses to accept their prize?',
    skills: ['Denial of service', 'Failed transfers'],
  },
  {
    id: 'vault',
    title: 'Vault',
    difficulty: Difficulty.EASY,
    description: 'A secure vault protected by a password. There is no getter for the password... so it must be safe, right?',
    objective: 'Unlock the vault by finding and using the "hidden" password.',
    sourceCode: `#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod vault {
    use ink::prelude::string::String;

    #[ink(storage)]
    pub struct Vault {
        locked: bool,
        password: String,  // No getter... but is it really private?
    }

    impl Vault {
        #[ink(constructor)]
        pub fn new(password: String) -> Self {
            Self {
                locked: true,
                password,
            }
        }

        /// Unlock with correct password
        #[ink(message)]
        pub fn unlock(&mut self, password: String) {
            if self.password == password {
                self.locked = false;
            }
        }

        #[ink(message)]
        pub fn is_locked(&self) -> bool {
            self.locked
        }

        // NOTE: No get_password() function!
        // Developers think this means the password is "private"
        // But ALL storage is public on the blockchain...
    }
}`,
    initialState: { locked: true, password: '???' },
    contractAddress: CONTRACT_ADDRESSES.factories.vault,
    hint: "Private doesn't mean secret on the blockchain.",
    skills: ['Storage layout', 'Reading private variables'],
  },
];

export const ICONS = {
  Terminal: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
  ),
  Lock: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
  ),
  Code: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
  ),
  Zap: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
  ),
  AlertTriangle: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
  ),
  CheckCircle: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
  ),
  Shield: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
  ),
  Skull: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><path d="M8 20v2h8v-2"/><path d="M12.5 17l-.5-1-.5 1h1z"/><path d="M16 20a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20"/></svg>
  ),
};

// Helper to get difficulty color
export const getDifficultyColor = (difficulty: string): string => {
  switch (difficulty) {
    case Difficulty.EASY:
      return '#22c55e'; // green
    case Difficulty.MEDIUM:
      return '#eab308'; // yellow
    case Difficulty.HARD:
      return '#ef4444'; // red
    case Difficulty.EXTREME:
      return '#a855f7'; // purple
    default:
      return '#6b7280'; // gray
  }
};

// Helper to get level by ID
export const getLevelById = (id: string): Level | undefined => {
  return LEVELS.find(level => level.id === id);
};
