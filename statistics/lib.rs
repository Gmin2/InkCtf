#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod statistics {
    use ink::prelude::vec::Vec;
    use ink::storage::Mapping;

    /// Stores statistics and analytics for the InkSpector game
    #[ink(storage)]
    pub struct Statistics {
        /// Contract owner (InkSpector coordinator) - stored as Address (H160)
        owner: ink::Address,
        /// Tracks all registered levels
        registered_levels: Mapping<AccountId, bool>,
        /// Tracks instances created: (player, level) -> Vec<instance>
        player_instances: Mapping<(AccountId, AccountId), Vec<AccountId>>,
        /// Tracks successful completions: (player, level) -> count
        success_count: Mapping<(AccountId, AccountId), u32>,
        /// Tracks failed submissions: (player, level) -> count
        failure_count: Mapping<(AccountId, AccountId), u32>,
        /// Total instances created per level
        total_instances: Mapping<AccountId, u32>,
    }

    /// Events emitted by the Statistics contract
    #[ink(event)]
    pub struct NewLevelRegistered {
        #[ink(topic)]
        level: AccountId,
    }

    #[ink(event)]
    pub struct InstanceCreated {
        #[ink(topic)]
        player: AccountId,
        #[ink(topic)]
        level: AccountId,
        instance: AccountId,
    }

    #[ink(event)]
    pub struct SubmissionSuccess {
        #[ink(topic)]
        player: AccountId,
        #[ink(topic)]
        level: AccountId,
        instance: AccountId,
    }

    #[ink(event)]
    pub struct SubmissionFailure {
        #[ink(topic)]
        player: AccountId,
        #[ink(topic)]
        level: AccountId,
        instance: AccountId,
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

        /// Saves a new level to the statistics
        #[ink(message)]
        pub fn save_new_level(&mut self, level: AccountId) -> Result<(), StatisticsError> {
            self.only_owner()?;
            self.registered_levels.insert(level, &true);
            self.total_instances.insert(level, &0);

            self.env().emit_event(NewLevelRegistered { level });
            Ok(())
        }

        /// Records a new instance creation
        #[ink(message)]
        pub fn create_new_instance(
            &mut self,
            instance: AccountId,
            level: AccountId,
            player: AccountId,
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
            instance: AccountId,
            level: AccountId,
            player: AccountId,
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
            instance: AccountId,
            level: AccountId,
            player: AccountId,
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
        pub fn get_total_instances(&self, level: AccountId) -> u32 {
            self.total_instances.get(level).unwrap_or(0)
        }

        /// Get success count for a player on a level
        #[ink(message)]
        pub fn get_success_count(&self, player: AccountId, level: AccountId) -> u32 {
            self.success_count.get(&(player, level)).unwrap_or(0)
        }

        /// Get failure count for a player on a level
        #[ink(message)]
        pub fn get_failure_count(&self, player: AccountId, level: AccountId) -> u32 {
            self.failure_count.get(&(player, level)).unwrap_or(0)
        }

        /// Get instances created by a player for a level
        #[ink(message)]
        pub fn get_player_instances(&self, player: AccountId, level: AccountId) -> Vec<AccountId> {
            self.player_instances.get(&(player, level)).unwrap_or_default()
        }
    }
}
