#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod fallback {
    use ink::storage::Mapping;

    /// level-2 Fallback/Ownership Vulnerability
    ///
    /// Learning: Understand fallback functions and ownership exploits
    ///
    /// Goal:
    /// 1. Claim ownership of the contract
    /// 2. Withdraw all funds
    #[ink(storage)]
    pub struct Fallback {
        /// Contract owner
        owner: ink::primitives::Address,
        /// Contributions by each address
        contributions: Mapping<ink::primitives::Address, Balance>,
        /// Whether the level has been cleared
        cleared: bool,
    }

    #[ink(event)]
    pub struct OwnershipTransferred {
        #[ink(topic)]
        previous_owner: ink::primitives::Address,
        #[ink(topic)]
        new_owner: ink::primitives::Address,
    }

    impl Fallback {
        /// Constructor - sets initial owner with large contribution
        #[ink(constructor)]
        pub fn new() -> Self {
            let caller = Self::env().caller();
            let mut contributions = Mapping::new();

            // Owner starts with 1000 tokens contribution (makes it "impossible" to outcontribute)
            contributions.insert(caller, &1000_000_000_000_000u128);

            Self {
                owner: caller,
                contributions,
                cleared: false,
            }
        }

        /// Contribute to the contract
        /// Vulnerability: You can become owner if your contribution > current owner's
        /// But owner has 1000 tokens, so this path is impractical...
        #[ink(message, payable)]
        pub fn contribute(&mut self) {
            let caller = self.env().caller();
            let value = self.env().transferred_value().low_u128();

            // Must contribute less than 0.001 tokens (1_000_000_000 in 12 decimals)
            assert!(value < 1_000_000_000, "Contribution too large");

            // Add to contributions
            let current = self.contributions.get(caller).unwrap_or(0);
            self.contributions.insert(caller, &(current + value));

            // If contribution exceeds owner's, become owner
            // (This is practically impossible since owner has 1000 tokens)
            let owner_contribution = self.contributions.get(self.owner).unwrap_or(0);
            if self.contributions.get(caller).unwrap_or(0) > owner_contribution {
                let old_owner = self.owner;
                self.owner = caller;

                self.env().emit_event(OwnershipTransferred {
                    previous_owner: old_owner,
                    new_owner: caller,
                });
            }
        }

        /// THE VULNERABILITY: Fallback function that changes ownership!
        /// If you have ANY contribution and send value directly, you become owner
        #[ink(message, payable)]
        pub fn fallback(&mut self) {
            let caller = self.env().caller();
            let value = self.env().transferred_value().low_u128();

            // Must send some value AND have made a contribution
            assert!(value > 0, "Must send value");
            assert!(self.contributions.get(caller).unwrap_or(0) > 0, "Must have contributed first");

            // Exploit: Change owner!
            let old_owner = self.owner;
            self.owner = caller;

            self.env().emit_event(OwnershipTransferred {
                previous_owner: old_owner,
                new_owner: caller,
            });
        }

        /// Withdraw all funds (only owner)
        #[ink(message)]
        pub fn withdraw(&mut self) {
            assert!(self.env().caller() == self.owner, "Only owner can withdraw");

            let balance = self.env().balance();
            // Keep minimum existential deposit
            let amount = balance.saturating_sub(ink::primitives::U256::from(1));

            if amount > ink::primitives::U256::from(0) {
                // Mark as cleared when funds are withdrawn
                self.cleared = true;

                // Transfer to owner
                self.env().transfer(self.owner, amount).expect("Transfer failed");
            }
        }

        /// Get caller's contribution
        #[ink(message)]
        pub fn get_contribution(&self) -> Balance {
            self.contributions.get(self.env().caller()).unwrap_or(0)
        }

        /// Get current owner
        #[ink(message)]
        pub fn get_owner(&self) -> ink::primitives::Address {
            self.owner
        }

        /// Get contract balance
        #[ink(message)]
        pub fn get_balance(&self) -> Balance {
            self.env().balance().low_u128()
        }

        /// Check if cleared (owner changed AND balance withdrawn)
        #[ink(message)]
        pub fn get_cleared(&self) -> bool {
            self.cleared
        }
    }
}
