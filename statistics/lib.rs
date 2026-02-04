#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod statistics {
    use ink::prelude::vec::Vec;
    use ink::storage::Mapping;

    /// Stores statistics and analytics for the InkSpector game
    /// Uses ink::Address (H160, 20 bytes) for all addresses in pallet-revive
    #[ink(storage)]
    pub struct Statistics {
        /// Contract owner (InkSpector coordinator)
        owner: ink::Address,
        /// Tracks all registered levels (factory addresses)
        registered_levels: Mapping<ink::Address, bool>,
        /// Tracks instances created: (player, level) -> Vec<instance>
        player_instances: Mapping<(ink::Address, ink::Address), Vec<ink::Address>>,
        /// Tracks successful completions: (player, level) -> count
        success_count: Mapping<(ink::Address, ink::Address), u32>,
        /// Tracks failed submissions: (player, level) -> count
        failure_count: Mapping<(ink::Address, ink::Address), u32>,
        /// Total instances created per level
        total_instances: Mapping<ink::Address, u32>,
    }

    /// Events emitted by the Statistics contract
    #[ink(event)]
    pub struct NewLevelRegistered {
        #[ink(topic)]
        level: ink::Address,
    }

    #[ink(event)]
    pub struct InstanceCreated {
        #[ink(topic)]
        player: ink::Address,
        #[ink(topic)]
        level: ink::Address,
        instance: ink::Address,
    }

    #[ink(event)]
    pub struct SubmissionSuccess {
        #[ink(topic)]
        player: ink::Address,
        #[ink(topic)]
        level: ink::Address,
        instance: ink::Address,
    }

    #[ink(event)]
    pub struct SubmissionFailure {
        #[ink(topic)]
        player: ink::Address,
        #[ink(topic)]
        level: ink::Address,
        instance: ink::Address,
    }

    /// Errors that can occur in Statistics operations
    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum StatisticsError {
        /// Caller is not authorized
        Unauthorized,
    }

    impl Statistics {
        /// Creates a new Statistics contract
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {
                owner: Self::env().caller(),
                registered_levels: Mapping::new(),
                player_instances: Mapping::new(),
                success_count: Mapping::new(),
                failure_count: Mapping::new(),
                total_instances: Mapping::new(),
            }
        }

        /// Modifier to check if caller is owner
        fn only_owner(&self) -> Result<(), StatisticsError> {
            let caller = self.env().caller();
            if caller != self.owner {
                return Err(StatisticsError::Unauthorized);
            }
            Ok(())
        }

        /// Saves a new level (factory) to the statistics
        #[ink(message)]
        pub fn save_new_level(&mut self, level: ink::Address) -> Result<(), StatisticsError> {
            self.only_owner()?;
            self.registered_levels.insert(level, &true);
            self.total_instances.insert(level, &0);

            self.env().emit_event(NewLevelRegistered { level });
            Ok(())
        }

        /// Check if a level is registered
        #[ink(message)]
        pub fn is_level_registered(&self, level: ink::Address) -> bool {
            self.registered_levels.get(level).unwrap_or(false)
        }

        /// Records a new instance creation
        #[ink(message)]
        pub fn create_new_instance(
            &mut self,
            instance: ink::Address,
            level: ink::Address,
            player: ink::Address,
        ) -> Result<(), StatisticsError> {
            self.only_owner()?;

            // Update total instances for this level
            let current_total = self.total_instances.get(level).unwrap_or(0);
            self.total_instances.insert(level, &(current_total + 1));

            // Track player instances
            let key = (player, level);
            let mut instances = self.player_instances.get(&key).unwrap_or_default();
            instances.push(instance);
            self.player_instances.insert(&key, &instances);

            self.env().emit_event(InstanceCreated {
                player,
                level,
                instance,
            });
            Ok(())
        }

        /// Records a successful submission
        #[ink(message)]
        pub fn submit_success(
            &mut self,
            instance: ink::Address,
            level: ink::Address,
            player: ink::Address,
        ) -> Result<(), StatisticsError> {
            self.only_owner()?;

            let key = (player, level);
            let current_count = self.success_count.get(&key).unwrap_or(0);
            self.success_count.insert(&key, &(current_count + 1));

            self.env().emit_event(SubmissionSuccess {
                player,
                level,
                instance,
            });
            Ok(())
        }

        /// Records a failed submission
        #[ink(message)]
        pub fn submit_failure(
            &mut self,
            instance: ink::Address,
            level: ink::Address,
            player: ink::Address,
        ) -> Result<(), StatisticsError> {
            self.only_owner()?;

            let key = (player, level);
            let current_count = self.failure_count.get(&key).unwrap_or(0);
            self.failure_count.insert(&key, &(current_count + 1));

            self.env().emit_event(SubmissionFailure {
                player,
                level,
                instance,
            });
            Ok(())
        }

        /// Get total instances created for a level
        #[ink(message)]
        pub fn get_total_instances(&self, level: ink::Address) -> u32 {
            self.total_instances.get(level).unwrap_or(0)
        }

        /// Get success count for a player on a level
        #[ink(message)]
        pub fn get_success_count(&self, player: ink::Address, level: ink::Address) -> u32 {
            self.success_count.get(&(player, level)).unwrap_or(0)
        }

        /// Get failure count for a player on a level
        #[ink(message)]
        pub fn get_failure_count(&self, player: ink::Address, level: ink::Address) -> u32 {
            self.failure_count.get(&(player, level)).unwrap_or(0)
        }

        /// Get instances created by a player for a level
        #[ink(message)]
        pub fn get_player_instances(&self, player: ink::Address, level: ink::Address) -> Vec<ink::Address> {
            self.player_instances.get(&(player, level)).unwrap_or_default()
        }

        /// Get the contract owner
        #[ink(message)]
        pub fn get_owner(&self) -> ink::Address {
            self.owner
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        fn default_accounts() -> ink::env::test::DefaultAccounts<ink::env::DefaultEnvironment> {
            ink::env::test::default_accounts::<ink::env::DefaultEnvironment>()
        }

        fn set_caller(caller: ink::Address) {
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(caller);
        }

        #[ink::test]
        fn constructor_sets_owner() {
            let accounts = default_accounts();
            set_caller(accounts.alice);
            let contract = Statistics::new();
            assert_eq!(contract.get_owner(), accounts.alice);
        }

        #[ink::test]
        fn save_new_level_by_owner() {
            let accounts = default_accounts();
            set_caller(accounts.alice);
            let mut contract = Statistics::new();

            let result = contract.save_new_level(accounts.bob);
            assert!(result.is_ok());
            assert!(contract.is_level_registered(accounts.bob));
            assert_eq!(contract.get_total_instances(accounts.bob), 0);
        }

        #[ink::test]
        fn save_new_level_rejects_non_owner() {
            let accounts = default_accounts();
            set_caller(accounts.alice);
            let mut contract = Statistics::new();

            set_caller(accounts.bob);
            let result = contract.save_new_level(accounts.charlie);
            assert_eq!(result, Err(StatisticsError::Unauthorized));
        }

        #[ink::test]
        fn is_level_registered_returns_false_for_unknown() {
            let accounts = default_accounts();
            set_caller(accounts.alice);
            let contract = Statistics::new();
            assert!(!contract.is_level_registered(accounts.bob));
        }

        #[ink::test]
        fn create_new_instance_by_owner() {
            let accounts = default_accounts();
            set_caller(accounts.alice);
            let mut contract = Statistics::new();

            contract.save_new_level(accounts.bob).unwrap();

            let result = contract.create_new_instance(accounts.charlie, accounts.bob, accounts.dave);
            assert!(result.is_ok());
            assert_eq!(contract.get_total_instances(accounts.bob), 1);

            let instances = contract.get_player_instances(accounts.dave, accounts.bob);
            assert_eq!(instances.len(), 1);
            assert_eq!(instances[0], accounts.charlie);
        }

        #[ink::test]
        fn create_new_instance_rejects_non_owner() {
            let accounts = default_accounts();
            set_caller(accounts.alice);
            let mut contract = Statistics::new();

            set_caller(accounts.bob);
            let result = contract.create_new_instance(accounts.charlie, accounts.bob, accounts.dave);
            assert_eq!(result, Err(StatisticsError::Unauthorized));
        }

        #[ink::test]
        fn submit_success_increments_count() {
            let accounts = default_accounts();
            set_caller(accounts.alice);
            let mut contract = Statistics::new();

            assert_eq!(contract.get_success_count(accounts.bob, accounts.charlie), 0);

            contract.submit_success(accounts.dave, accounts.charlie, accounts.bob).unwrap();
            assert_eq!(contract.get_success_count(accounts.bob, accounts.charlie), 1);

            contract.submit_success(accounts.dave, accounts.charlie, accounts.bob).unwrap();
            assert_eq!(contract.get_success_count(accounts.bob, accounts.charlie), 2);
        }

        #[ink::test]
        fn submit_failure_increments_count() {
            let accounts = default_accounts();
            set_caller(accounts.alice);
            let mut contract = Statistics::new();

            assert_eq!(contract.get_failure_count(accounts.bob, accounts.charlie), 0);

            contract.submit_failure(accounts.dave, accounts.charlie, accounts.bob).unwrap();
            assert_eq!(contract.get_failure_count(accounts.bob, accounts.charlie), 1);
        }

        #[ink::test]
        fn submit_success_rejects_non_owner() {
            let accounts = default_accounts();
            set_caller(accounts.alice);
            let mut contract = Statistics::new();

            set_caller(accounts.bob);
            let result = contract.submit_success(accounts.charlie, accounts.dave, accounts.bob);
            assert_eq!(result, Err(StatisticsError::Unauthorized));
        }

        #[ink::test]
        fn submit_failure_rejects_non_owner() {
            let accounts = default_accounts();
            set_caller(accounts.alice);
            let mut contract = Statistics::new();

            set_caller(accounts.bob);
            let result = contract.submit_failure(accounts.charlie, accounts.dave, accounts.bob);
            assert_eq!(result, Err(StatisticsError::Unauthorized));
        }

        #[ink::test]
        fn multiple_instances_tracked_per_player_level() {
            let accounts = default_accounts();
            set_caller(accounts.alice);
            let mut contract = Statistics::new();

            contract.save_new_level(accounts.bob).unwrap();
            contract.create_new_instance(accounts.charlie, accounts.bob, accounts.dave).unwrap();
            contract.create_new_instance(accounts.eve, accounts.bob, accounts.dave).unwrap();

            let instances = contract.get_player_instances(accounts.dave, accounts.bob);
            assert_eq!(instances.len(), 2);
            assert_eq!(contract.get_total_instances(accounts.bob), 2);
        }

        #[ink::test]
        fn get_player_instances_empty_for_unknown() {
            let accounts = default_accounts();
            set_caller(accounts.alice);
            let contract = Statistics::new();
            let instances = contract.get_player_instances(accounts.bob, accounts.charlie);
            assert!(instances.is_empty());
        }
    }
}
