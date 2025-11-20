#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod fallback_factory {
    use ink::env::call::{build_create, ExecutionInput, Selector};
    use ink::primitives::{H256, U256};
    use ink::ToAddr;
    use fallback::FallbackRef;
    use traits::{Level, LevelError};

    #[ink(storage)]
    pub struct FallbackFactory {
        /// Code hash of the Fallback Contract (upload separately)
        fallback_code_hash: Hash,
    }

    impl FallbackFactory {
        /// Constructor - stores the fallback contract code hash
        #[ink(constructor)]
        pub fn new(fallback_code_hash: Hash) -> Self {
            Self { fallback_code_hash }
        }

        /// Get the stored code hash
        #[ink(message)]
        pub fn get_code_hash(&self) -> Hash {
            self.fallback_code_hash
        }
    }

    impl Level for FallbackFactory {
        /// Deploy a new fallback contract instance for a player
        #[ink(message, payable)]
        fn create_instance(&mut self, player: AccountId) -> Result<AccountId, LevelError> {
            // Convert Hash ([u8; 32]) to H256
            let code_hash_bytes: [u8; 32] = self.fallback_code_hash.into();
            let code_hash_h256 = H256::from(code_hash_bytes);

            // Create salt from player AccountId
            let salt: [u8; 32] = *player.as_ref();

            // Build creation parameters
            // Use transferred value to fund the instance
            let endowment = self.env().transferred_value();
            let create_params = build_create::<FallbackRef>()
                .code_hash(code_hash_h256)
                .endowment(endowment) // Pass through the value sent to factory
                .exec_input(
                    ExecutionInput::new(Selector::new(ink::selector_bytes!("new")))
                )
                .salt_bytes(Some(salt))
                .returns::<FallbackRef>()
                .params();

            // Instantiate the contract
            let fallback_ref = self
                .env()
                .instantiate_contract(&create_params)
                .map_err(|_| LevelError::InstantiationFailed)?
                .map_err(|_| LevelError::InstantiationFailed)?;

            let instance_address: ink::Address = fallback_ref.to_addr();

            // Convert Address (H160 - 20 bytes) to AccountId (32 bytes)
            // Pad the 20-byte address to 32 bytes
            let addr_slice: &[u8] = instance_address.as_ref();
            let mut account_bytes = [0u8; 32];
            account_bytes[12..32].copy_from_slice(addr_slice);
            let account_id = AccountId::from(account_bytes);

            Ok(account_id)
        }

        /// Validates if player completed the level
        /// Level is cleared when player becomes owner and withdraws funds
        #[ink(message)]
        fn validate_instance(&self, instance: AccountId, _player: AccountId) -> bool {
            // Convert AccountId to Address
            // Take the last 20 bytes of AccountId
            let account_bytes: &[u8; 32] = instance.as_ref();
            let mut addr_bytes = [0u8; 20];
            addr_bytes.copy_from_slice(&account_bytes[12..32]);
            let instance_addr = ink::Address::from(addr_bytes);

            // Convert Address to FallbackRef
            let fallback_ref: FallbackRef = ink::env::call::FromAddr::from_addr(instance_addr);

            // Check if cleared (owner changed and balance withdrawn)
            fallback_ref.get_cleared()
        }
    }
}
