#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod king_factory {
    use ink::env::call::{build_create, ExecutionInput, Selector};
    use ink::primitives::H256;
    use ink::ToAddr;
    use king::KingRef;
    use traits::{Level, LevelError};

    #[ink(storage)]
    pub struct KingFactory {
        /// Code hash of the King Contract (upload separately)
        king_code_hash: Hash,
    }

    impl KingFactory {
        /// Constructor - stores the king contract code hash
        #[ink(constructor)]
        pub fn new(king_code_hash: Hash) -> Self {
            Self { king_code_hash }
        }

        /// Get the stored code hash
        #[ink(message)]
        pub fn get_code_hash(&self) -> Hash {
            self.king_code_hash
        }

        /// Fallback to receive funds (needed for validation attempt)
        #[ink(message, payable)]
        pub fn receive(&mut self) {
            // Factory can receive funds
        }
    }

    impl Level for KingFactory {
        /// Deploy a new king contract instance for a player
        #[ink(message, payable)]
        fn create_instance(&mut self, player: AccountId) -> Result<AccountId, LevelError> {
            // Convert Hash ([u8; 32]) to H256
            let code_hash_bytes: [u8; 32] = self.king_code_hash.into();
            let code_hash_h256 = H256::from(code_hash_bytes);

            // Create salt from player AccountId
            let salt: [u8; 32] = *player.as_ref();

            // Build creation parameters with initial prize value
            let create_params = build_create::<KingRef>()
                .code_hash(code_hash_h256)
                .endowment(self.env().transferred_value()) // Pass value as initial prize
                .exec_input(
                    ExecutionInput::new(Selector::new(ink::selector_bytes!("new")))
                )
                .salt_bytes(Some(salt))
                .returns::<KingRef>()
                .params();

            // Instantiate the contract
            let king_ref = self
                .env()
                .instantiate_contract(&create_params)
                .map_err(|_| LevelError::InstantiationFailed)?
                .map_err(|_| LevelError::InstantiationFailed)?;

            let instance_address: ink::Address = king_ref.to_addr();

            // Convert Address (H160 - 20 bytes) to AccountId (32 bytes)
            // Pad the 20-byte address to 32 bytes
            let addr_slice: &[u8] = instance_address.as_ref();
            let mut account_bytes = [0u8; 32];
            account_bytes[12..32].copy_from_slice(addr_slice);
            let account_id = AccountId::from(account_bytes);

            Ok(account_id)
        }

        /// Validates if player completed the level
        /// Level is cleared when factory tries to reclaim throne but FAILS
        /// (player has created a DoS condition preventing anyone from becoming king)
        #[ink(message)]
        fn validate_instance(&self, instance: AccountId, _player: AccountId) -> bool {
            // Convert AccountId to Address
            let account_bytes: &[u8; 32] = instance.as_ref();
            let mut addr_bytes = [0u8; 20];
            addr_bytes.copy_from_slice(&account_bytes[12..32]);
            let instance_addr = ink::Address::from(addr_bytes);

            // Convert Address to KingRef
            let king_ref: KingRef = ink::env::call::FromAddr::from_addr(instance_addr);

            // Get current king
            let current_king = king_ref.get_king();

            // Convert factory's address to check if we're the king
            let factory_addr = self.env().account_id();
            let factory_addr_bytes: &[u8; 32] = factory_addr.as_ref();
            let mut factory_h160 = [0u8; 20];
            factory_h160.copy_from_slice(&factory_addr_bytes[12..32]);
            let factory_address = ink::Address::from(factory_h160);

            // Level is completed if factory is NOT the king
            // (meaning player has successfully prevented factory from reclaiming throne)
            current_king != factory_address
        }
    }
}
