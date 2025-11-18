#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod ink_spector {
    use ink::env::call::{build_call, ExecutionInput, Selector};
    use ink::storage::Mapping;

    /// Coordinator contract for InkSpector CTF game
    #[ink(storage)]
    pub struct InkSpector {
        /// Contract owner
        owner: ink::Address,
        /// Statistics contract address
        statistics: Option<AccountId>,
        /// Registered level factories (level_address => is_registered)
        registered_levels: Mapping<AccountId, bool>,
        /// Emitted instances mapping (instance => EmittedInstanceData)
        emitted_instances: Mapping<AccountId, EmittedInstanceData>,
    }

    /// Tracks data for each emitted instance
    #[derive(Debug, Clone, scale::Encode, scale::Decode)]
    #[cfg_attr(
        feature = "std",
        derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
    )]
    pub struct EmittedInstanceData {
        /// The player who created this instance
        player: AccountId,
        /// The level factory that created this instance
        level: AccountId,
        /// Whether the level has been completed
        completed: bool,
    }

    /// Events emitted by InkSpector
    #[ink(event)]
    pub struct LevelInstanceCreated {
        #[ink(topic)]
        player: AccountId,
        #[ink(topic)]
        instance: AccountId,
        #[ink(topic)]
        level: AccountId,
    }

    #[ink(event)]
    pub struct LevelCompleted {
        #[ink(topic)]
        player: AccountId,
        #[ink(topic)]
        instance: AccountId,
        #[ink(topic)]
        level: AccountId,
    }

    /// Errors that can occur in InkSpector operations
    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum InkSpectorError {
        /// Caller is not the owner
        Unauthorized,
        /// Level doesn't exist or is not registered
        LevelNotRegistered,
        /// Instance doesn't belong to the caller
        InstanceNotOwned,
        /// Level has already been completed
        AlreadyCompleted,
        /// Failed to create instance
        InstanceCreationFailed,
        /// Failed to validate instance
        ValidationFailed,
    }

    impl InkSpector {
        /// Creates a new InkSpector coordinator
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {
                owner: Self::env().caller(),
                statistics: None,
                registered_levels: Mapping::new(),
                emitted_instances: Mapping::new(),
            }
        }

        /// Modifier to check if caller is owner
        fn only_owner(&self) -> Result<(), InkSpectorError> {
            if self.env().caller() != self.owner {
                return Err(InkSpectorError::Unauthorized);
            }
            Ok(())
        }

        /// Set the statistics contract address (owner only)
        #[ink(message)]
        pub fn set_statistics(&mut self, statistics_addr: AccountId) -> Result<(), InkSpectorError> {
            self.only_owner()?;
            self.statistics = Some(statistics_addr);
            Ok(())
        }

        /// Register a new level factory (owner only)
        #[ink(message)]
        pub fn register_level(&mut self, level: AccountId) -> Result<(), InkSpectorError> {
            self.only_owner()?;
            self.registered_levels.insert(level, &true);

            // Call statistics contract to save new level
            if let Some(stats_addr) = self.statistics {
                let _ = self.call_statistics_save_level(stats_addr, level);
            }

            Ok(())
        }

        /// Create a new level instance for the caller
        #[ink(message, payable)]
        pub fn create_level_instance(&mut self, level: AccountId) -> Result<AccountId, InkSpectorError> {
            // Ensure level is registered
            if !self.registered_levels.get(level).unwrap_or(false) {
                return Err(InkSpectorError::LevelNotRegistered);
            }

            let player = self.env().caller();

            // Convert player Address to AccountId for cross-contract call
            let player_account_id = self.address_to_account_id(player);

            // Call the level factory to create an instance
            let instance = self.call_level_create_instance(level, player_account_id)
                .map_err(|_| InkSpectorError::InstanceCreationFailed)?;

            // Store emitted instance relationship
            let instance_data = EmittedInstanceData {
                player: player_account_id,
                level,
                completed: false,
            };
            self.emitted_instances.insert(instance, &instance_data);

            // Call statistics contract
            if let Some(stats_addr) = self.statistics {
                let _ = self.call_statistics_create_instance(stats_addr, instance, level, player_account_id);
            }

            // Emit event
            self.env().emit_event(LevelInstanceCreated {
                player: player_account_id,
                instance,
                level,
            });

            Ok(instance)
        }

        /// Submit a level instance for validation
        #[ink(message)]
        pub fn submit_level_instance(&mut self, instance: AccountId) -> Result<bool, InkSpectorError> {
            let caller = self.env().caller();
            let caller_account_id = self.address_to_account_id(caller);

            // Get instance data
            let mut data = self.emitted_instances.get(instance)
                .ok_or(InkSpectorError::InstanceNotOwned)?;

            // Verify ownership
            if data.player != caller_account_id {
                return Err(InkSpectorError::InstanceNotOwned);
            }

            // Verify not already completed
            if data.completed {
                return Err(InkSpectorError::AlreadyCompleted);
            }

            // Call the level factory to validate
            let is_valid = self.call_level_validate_instance(data.level, instance, data.player)
                .map_err(|_| InkSpectorError::ValidationFailed)?;

            if is_valid {
                // Mark as completed
                data.completed = true;
                self.emitted_instances.insert(instance, &data);

                // Call statistics - submit success
                if let Some(stats_addr) = self.statistics {
                    let _ = self.call_statistics_submit_success(stats_addr, instance, data.level, data.player);
                }

                // Emit event
                self.env().emit_event(LevelCompleted {
                    player: data.player,
                    instance,
                    level: data.level,
                });

                Ok(true)
            } else {
                // Call statistics - submit failure
                if let Some(stats_addr) = self.statistics {
                    let _ = self.call_statistics_submit_failure(stats_addr, instance, data.level, data.player);
                }

                Ok(false)
            }
        }

        /// Check if a level is registered
        #[ink(message)]
        pub fn is_level_registered(&self, level: AccountId) -> bool {
            self.registered_levels.get(level).unwrap_or(false)
        }

        /// Get instance data
        #[ink(message)]
        pub fn get_instance_data(&self, instance: AccountId) -> Option<EmittedInstanceData> {
            self.emitted_instances.get(instance)
        }

        /// Get the contract owner
        #[ink(message)]
        pub fn get_owner(&self) -> ink::Address {
            self.owner
        }

        /// Convert Address (H160) to AccountId (32 bytes)
        fn address_to_account_id(&self, addr: ink::Address) -> AccountId {
            let addr_slice: &[u8] = addr.as_ref();
            let mut account_bytes = [0u8; 32];
            account_bytes[12..32].copy_from_slice(addr_slice);
            AccountId::from(account_bytes)
        }

        /// Convert AccountId (32 bytes) to Address (H160 - 20 bytes)
        fn account_id_to_address(&self, account_id: AccountId) -> ink::Address {
            let account_bytes: &[u8; 32] = account_id.as_ref();
            let mut addr_bytes = [0u8; 20];
            addr_bytes.copy_from_slice(&account_bytes[12..32]);
            ink::Address::from(addr_bytes)
        }

        /// Call Level::create_instance on a level factory
        fn call_level_create_instance(&mut self, level: AccountId, player: AccountId) -> Result<AccountId, ()> {
            // Build cross-contract call
            // Use trait selector: Level::create_instance
            let level_addr = self.account_id_to_address(level);
            let call = build_call::<<Self as ink::env::ContractEnv>::Env>()
                .call(level_addr)
                .transferred_value(self.env().transferred_value())
                .exec_input(
                    ExecutionInput::new(Selector::new(ink::selector_bytes!("Level::create_instance")))
                        .push_arg(player)
                )
                .returns::<Result<AccountId, traits::LevelError>>()
                .params();

            self.env()
                .invoke_contract(&call)
                .map_err(|_| ())?
                .map_err(|_| ())?
                .map_err(|_| ())
        }

        /// Call Level::validate_instance on a level factory
        fn call_level_validate_instance(&self, level: AccountId, instance: AccountId, player: AccountId) -> Result<bool, ()> {
            let level_addr = self.account_id_to_address(level);
            let call = build_call::<<Self as ink::env::ContractEnv>::Env>()
                .call(level_addr)
                .exec_input(
                    ExecutionInput::new(Selector::new(ink::selector_bytes!("Level::validate_instance")))
                        .push_arg(instance)
                        .push_arg(player)
                )
                .returns::<bool>()
                .params();

            self.env()
                .invoke_contract(&call)
                .map_err(|_| ())?
                .map_err(|_| ())
        }

        /// Call Statistics::save_new_level
        fn call_statistics_save_level(&mut self, stats: AccountId, level: AccountId) -> Result<(), ()> {
            let stats_addr = self.account_id_to_address(stats);
            let call = build_call::<<Self as ink::env::ContractEnv>::Env>()
                .call(stats_addr)
                .exec_input(
                    ExecutionInput::new(Selector::new(ink::selector_bytes!("save_new_level")))
                        .push_arg(level)
                )
                .returns::<Result<(), ()>>()
                .params();

            self.env()
                .invoke_contract(&call)
                .map_err(|_| ())?  // Handle EnvError
                .map_err(|_| ())?  // Handle LangError
                .map_err(|_| ())   // Handle contracts Result
        }

        /// Call Statistics::create_new_instance
        fn call_statistics_create_instance(&mut self, stats: AccountId, instance: AccountId, level: AccountId, player: AccountId) -> Result<(), ()> {
            let stats_addr = self.account_id_to_address(stats);
            let call = build_call::<<Self as ink::env::ContractEnv>::Env>()
                .call(stats_addr)
                .exec_input(
                    ExecutionInput::new(Selector::new(ink::selector_bytes!("create_new_instance")))
                        .push_arg(instance)
                        .push_arg(level)
                        .push_arg(player)
                )
                .returns::<Result<(), ()>>()
                .params();

            self.env()
                .invoke_contract(&call)
                .map_err(|_| ())?  // Handle EnvError
                .map_err(|_| ())?  // Handle LangError
                .map_err(|_| ())   // Handle contracts Result
        }

        /// Call Statistics::submit_success
        fn call_statistics_submit_success(&mut self, stats: AccountId, instance: AccountId, level: AccountId, player: AccountId) -> Result<(), ()> {
            let stats_addr = self.account_id_to_address(stats);
            let call = build_call::<<Self as ink::env::ContractEnv>::Env>()
                .call(stats_addr)
                .exec_input(
                    ExecutionInput::new(Selector::new(ink::selector_bytes!("submit_success")))
                        .push_arg(instance)
                        .push_arg(level)
                        .push_arg(player)
                )
                .returns::<Result<(), ()>>()
                .params();

            self.env()
                .invoke_contract(&call)
                .map_err(|_| ())?  // Handle EnvError
                .map_err(|_| ())?  // Handle LangError
                .map_err(|_| ())   // Handle contracts Result
        }

        /// Call Statistics::submit_failure
        fn call_statistics_submit_failure(&mut self, stats: AccountId, instance: AccountId, level: AccountId, player: AccountId) -> Result<(), ()> {
            let stats_addr = self.account_id_to_address(stats);
            let call = build_call::<<Self as ink::env::ContractEnv>::Env>()
                .call(stats_addr)
                .exec_input(
                    ExecutionInput::new(Selector::new(ink::selector_bytes!("submit_failure")))
                        .push_arg(instance)
                        .push_arg(level)
                        .push_arg(player)
                )
                .returns::<Result<(), ()>>()
                .params();

            self.env()
                .invoke_contract(&call)
                .map_err(|_| ())?  // Handle EnvError
                .map_err(|_| ())?  // Handle LangError
                .map_err(|_| ())   // Handle contracts Result
        }
    }
}
