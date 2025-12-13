import { Difficulty } from './types';
import type { Level } from './types';

export const LEVELS: Level[] = [
  {
    id: '1',
    title: 'Hello Squink!',
    difficulty: Difficulty.EASY,
    description: 'Welcome to ink!Spector Gadget. Your first mission is to understand how basic storage works in ink!. This contract tracks a secret message.',
    objective: 'Call the `claim_victory` function with the correct secret value hidden in the contract state.',
    sourceCode: `#[ink::contract]\nmod hello_squink {\n    #[ink(storage)]\n    pub struct HelloSquink {\n        secret: u32,\n        owner: AccountId,\n    }\n\n    impl HelloSquink {\n        #[ink(constructor)]\n        pub fn new() -> Self {\n            Self { \n                secret: 1337,\n                owner: Self::env().caller(),\n            }\n        }\n\n        #[ink(message)]\n        pub fn claim_victory(&self, value: u32) -> bool {\n            if value == self.secret {\n                return true;\n            }\n            false\n        }\n    }\n}`,
    initialState: { secret: 1337, owner: '5GrwvaEF...W' },
    contractAddress: '5F3sa...Squink'
  },
  {
    id: '2',
    title: 'The Reentrancy Trap',
    difficulty: Difficulty.MEDIUM,
    description: 'A classic vulnerability. This contract manages a simple bank where users can deposit and withdraw funds.',
    objective: 'The contract has a balance of 1000 tokens. Your goal is to drain the entire vault balance using a recursive call exploit.',
    sourceCode: `#[ink::contract]\nmod reentrancy_bank {\n    use ink::storage::Mapping;\n\n    #[ink(storage)]\n    pub struct ReentrancyBank {\n        balances: Mapping<AccountId, Balance>,\n    }\n\n    impl ReentrancyBank {\n        #[ink(constructor)]\n        pub fn new() -> Self {\n            Self { balances: Mapping::default() }\n        }\n\n        #[ink(message, payable)]\n        pub fn deposit(&mut self) {\n            let caller = self.env().caller();\n            let amount = self.env().transferred_value();\n            let current = self.balances.get(caller).unwrap_or(0);\n            self.balances.insert(caller, &(current + amount));\n        }\n\n        #[ink(message)]\n        pub fn withdraw(&mut self) {\n            let caller = self.env().caller();\n            let balance = self.balances.get(caller).unwrap_or(0);\n            \n            if balance > 0 {\n                if self.env().transfer(caller, balance).is_ok() {\n                     self.balances.insert(caller, &0);\n                }\n            }\n        }\n    }\n}`,
    initialState: { vaultBalance: 1000, userBalance: 0 },
    contractAddress: '5D7ea...Bank'
  },
  {
    id: '3',
    title: 'Storage Collision',
    difficulty: Difficulty.HARD,
    description: 'Complex storage patterns can lead to accidental overwrites if layout keys are not handled correctly.',
    objective: 'Overwrite the contract owner address by manipulating the storage layout through the low-level API.',
    sourceCode: `#[ink::contract]\nmod storage_clash {\n    #[ink(storage)]\n    pub struct Clash {\n        owner: AccountId,\n        values: Mapping<u32, Vec<u8>>,\n    }\n    // Low-level storage logic implementation...\n}`,
    initialState: { owner: '5GrwvaEF...W' },
    contractAddress: '5H9ba...Proxy'
  },
  {
    id: '4',
    title: 'Arithmetic Wraps',
    difficulty: Difficulty.EASY,
    description: 'In some environments, integer overflows can cause unexpected behavior in balance calculations.',
    objective: 'Cause a subtraction overflow to trick the contract into thinking you have a near-infinite balance.',
    sourceCode: `#[ink(message)]\npub fn update_score(&mut self, points: u32) {\n    self.total_score -= points;\n}`,
    initialState: { score: 10 },
    contractAddress: '5C8ba...Calc'
  },
  {
    id: '5',
    title: 'Logic Flaw: Governance',
    difficulty: Difficulty.HARD,
    description: 'A governance contract where voting power is calculated. There might be a flaw in the proposal execution logic.',
    objective: 'Bypass the quorum requirement and execute a malicious proposal that changes the contract code hash.',
    sourceCode: `#[ink::contract]\nmod gov_fail {\n    // Voting and Quorum logic...\n}`,
    initialState: { quorum: 51, totalVotes: 100 },
    contractAddress: '5K2ba...Gov'
  },
  {
    id: '6',
    title: 'The Final Guardian',
    difficulty: Difficulty.EXTREME,
    description: 'The ultimate test. A multi-signature vault with a hidden logic flaw in the signature verification process.',
    objective: 'Recover the private key or exploit the verification loop to withdraw all funds without multisig approval.',
    sourceCode: `#[ink::contract]\nmod final_guard {\n    // Multisig and Crypto logic...\n}`,
    initialState: { vaultBalance: 100000 },
    contractAddress: '5X9ba...Final'
  }
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
  )
};
