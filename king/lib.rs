#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod king {

    /// Level 5: King (DoS Attack)
    ///
    /// Learning: Understand Denial of Service attacks via external calls
    ///
    /// Goal:
    /// 1. Become king
    /// 2. Prevent anyone else from becoming king (even the factory trying to reclaim)
    ///
    /// Vulnerability: Contract sends funds to previous king. If king rejects,
    /// the entire transaction reverts, causing a permanent DoS!
    #[ink(storage)]
    pub struct King {
        /// Current king address
        king: ink::primitives::Address,
        /// Prize amount (minimum to become king)
        prize: Balance,
        /// Original owner (can always become king)
        owner: ink::primitives::Address,
    }

    impl King {
        /// Constructor - initializes with owner as king
        #[ink(constructor, payable)]
        pub fn new() -> Self {
            let caller = Self::env().caller();
            let value = Self::env().transferred_value().low_u128();

            Self {
                owner: caller,
                king: caller,
                prize: value,
            }
        }

        /// THE VULNERABILITY: Claim the throne by sending more than current prize
        /// Sends prize to previous king - if king is a contract that rejects transfers,
        /// this function will always revert, permanently locking the throne!
        #[ink(message, payable)]
        pub fn claim_throne(&mut self) {
            let caller = self.env().caller();
            let value = self.env().transferred_value().low_u128();

            // Must send at least the current prize, unless you're the owner
            assert!(
                value >= self.prize || caller == self.owner,
                "Must send at least the prize amount"
            );

            // VULNERABILITY: Try to send prize to previous king
            // If king is a malicious contract that rejects transfers, this reverts!
            if self.env().transfer(self.king, ink::primitives::U256::from(self.prize)).is_err() {
                // If transfer fails, the entire transaction reverts
                // This means nobody can become king if current king rejects transfers!
                panic!("Transfer to previous king failed");
            }

            // Update king and prize
            self.king = caller;
            self.prize = value;
        }

        /// Get current king
        #[ink(message)]
        pub fn get_king(&self) -> ink::primitives::Address {
            self.king
        }

        /// Get current prize
        #[ink(message)]
        pub fn get_prize(&self) -> Balance {
            self.prize
        }

        /// Get owner
        #[ink(message)]
        pub fn get_owner(&self) -> ink::primitives::Address {
            self.owner
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
        fn constructor_sets_owner_and_king() {
            let accounts = default_accounts();
            set_caller(accounts.alice);
            set_value_transferred(100);
            let contract = King::new();
            assert_eq!(contract.get_king(), accounts.alice);
            assert_eq!(contract.get_owner(), accounts.alice);
            assert_eq!(contract.get_prize(), 100);
        }

        #[ink::test]
        fn constructor_zero_prize() {
            let accounts = default_accounts();
            set_caller(accounts.alice);
            set_value_transferred(0);
            let contract = King::new();
            assert_eq!(contract.get_prize(), 0);
            assert_eq!(contract.get_king(), accounts.alice);
        }

        #[ink::test]
        #[should_panic(expected = "Must send at least the prize amount")]
        fn claim_throne_rejects_insufficient_value() {
            let accounts = default_accounts();
            set_caller(accounts.alice);
            set_value_transferred(1000);
            let mut contract = King::new();

            // Bob sends less than the prize
            set_caller(accounts.bob);
            set_value_transferred(500);
            contract.claim_throne();
        }

        #[ink::test]
        fn owner_can_claim_without_meeting_prize() {
            let accounts = default_accounts();
            set_caller(accounts.alice);
            set_value_transferred(1000);
            let mut contract = King::new();

            // Owner can claim with 0 value
            set_value_transferred(0);
            contract.claim_throne();
            assert_eq!(contract.get_king(), accounts.alice);
        }

        #[ink::test]
        fn get_king_returns_current_king() {
            let accounts = default_accounts();
            set_caller(accounts.alice);
            set_value_transferred(0);
            let contract = King::new();
            assert_eq!(contract.get_king(), accounts.alice);
        }

        #[ink::test]
        fn get_owner_returns_original_owner() {
            let accounts = default_accounts();
            set_caller(accounts.alice);
            set_value_transferred(0);
            let contract = King::new();
            assert_eq!(contract.get_owner(), accounts.alice);
        }
    }
}
