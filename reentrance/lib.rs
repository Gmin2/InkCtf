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
}
