#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod reentrance {
    use ink::storage::Mapping;

    /// Level 3: Reentrancy Vulnerability
    ///
    /// Learning: Understand reentrancy attacks and checks-effects-interactions pattern
    ///
    /// Goal:
    /// 1. Drain all funds from the contract
    #[ink(storage)]
    pub struct Reentrance {
        /// Balances mapping for each address
        balances: Mapping<ink::primitives::Address, Balance>,
    }

    impl Reentrance {
        /// Constructor
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {
                balances: Mapping::new(),
            }
        }

        /// Donate to an address (adds to their balance)
        #[ink(message, payable)]
        pub fn donate(&mut self, to: ink::primitives::Address) {
            let value = self.env().transferred_value().low_u128();
            let current = self.balances.get(to).unwrap_or(0);
            self.balances.insert(to, &(current + value));
        }

        /// Get balance of an address
        #[ink(message)]
        pub fn balance_of(&self, who: ink::primitives::Address) -> Balance {
            self.balances.get(who).unwrap_or(0)
        }

        /// THE VULNERABILITY: Withdraw funds (sends BEFORE updating balance!)
        /// This allows reentrancy - attacker can call withdraw again before balance is updated
        #[ink(message)]
        pub fn withdraw(&mut self, amount: Balance) {
            let caller = self.env().caller();
            let balance = self.balances.get(caller).unwrap_or(0);

            // Check if caller has enough balance
            if balance >= amount {
                // VULNERABILITY: Transfer funds BEFORE updating balance
                // This allows the recipient to re-enter and withdraw again
                if self.env().transfer(caller, ink::primitives::U256::from(amount)).is_ok() {
                    // Balance updated AFTER transfer - too late!
                    self.balances.insert(caller, &(balance - amount));
                }
            }
        }

        /// Get contract balance
        #[ink(message)]
        pub fn get_balance(&self) -> Balance {
            self.env().balance().low_u128()
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        fn default_accounts() -> ink::env::test::DefaultAccounts<ink::env::DefaultEnvironment> {
            ink::env::test::default_accounts::<ink::env::DefaultEnvironment>()
        }

        fn set_caller(caller: ink::primitives::Address) {
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(caller);
        }

        fn set_value_transferred(value: u128) {
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(value);
        }

        #[ink::test]
        fn new_creates_empty_contract() {
            let contract = Reentrance::new();
            let accounts = default_accounts();
            assert_eq!(contract.balance_of(accounts.alice), 0);
        }

        #[ink::test]
        fn donate_records_balance() {
            let accounts = default_accounts();
            set_caller(accounts.alice);
            let mut contract = Reentrance::new();

            set_value_transferred(1000);
            contract.donate(accounts.bob);
            assert_eq!(contract.balance_of(accounts.bob), 1000);
        }

        #[ink::test]
        fn donate_accumulates() {
            let accounts = default_accounts();
            set_caller(accounts.alice);
            let mut contract = Reentrance::new();

            set_value_transferred(500);
            contract.donate(accounts.bob);
            set_value_transferred(300);
            contract.donate(accounts.bob);
            assert_eq!(contract.balance_of(accounts.bob), 800);
        }

        #[ink::test]
        fn withdraw_zero_balance_does_nothing() {
            let accounts = default_accounts();
            set_caller(accounts.bob);
            let mut contract = Reentrance::new();

            // Withdraw with no balance - should not panic
            contract.withdraw(100);
            assert_eq!(contract.balance_of(accounts.bob), 0);
        }

        #[ink::test]
        fn withdraw_more_than_balance_does_nothing() {
            let accounts = default_accounts();
            set_caller(accounts.alice);
            let mut contract = Reentrance::new();

            set_value_transferred(500);
            contract.donate(accounts.bob);

            // Bob tries to withdraw more than deposited
            set_caller(accounts.bob);
            set_value_transferred(0);
            contract.withdraw(1000);
            // Balance should remain unchanged since amount > balance
            assert_eq!(contract.balance_of(accounts.bob), 500);
        }

        #[ink::test]
        fn balance_of_unknown_address_is_zero() {
            let accounts = default_accounts();
            let contract = Reentrance::new();
            assert_eq!(contract.balance_of(accounts.charlie), 0);
        }

        #[ink::test]
        fn donate_to_self_works() {
            let accounts = default_accounts();
            set_caller(accounts.alice);
            let mut contract = Reentrance::new();

            set_value_transferred(100);
            contract.donate(accounts.alice);
            assert_eq!(contract.balance_of(accounts.alice), 100);
        }
    }
}
