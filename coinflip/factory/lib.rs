#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod coinflip_factory {
    use ink::env::call::{build_create, ExecutionInput, Selector};
    use ink::primitives::H256;
    use ink::ToAddr;
    use coinflip::CoinflipRef;
    use traits::{Level, LevelError};

    #[ink(storage)]
    pub struct CoinflipFactory {
        /// Code hash of the Coinflip Contract (upload separately)
        coinflip_code_hash: Hash,
    }

    impl CoinflipFactory {
        /// Constructor - stores the coinflip contract code hash
        #[ink(constructor)]
        pub fn new(coinflip_code_hash: Hash) -> Self {
            Self { coinflip_code_hash }
        }

        /// Get the stored code hash
        #[ink(message)]
        pub fn get_code_hash(&self) -> Hash {
            self.coinflip_code_hash
        }
    }

    impl Level for CoinflipFactory {
        /// Deploy a new coinflip contract instance for a player
        #[ink(message, payable)]
        fn create_instance(&mut self, player: AccountId) -> Result<AccountId, LevelError> {
            // Convert Hash ([u8; 32]) to H256
            let code_hash_bytes: [u8; 32] = self.coinflip_code_hash.into();
            let code_hash_h256 = H256::from(code_hash_bytes);

            // Create salt from player AccountId
            let salt: [u8; 32] = *player.as_ref();

            // Build creation parameters
            let create_params = build_create::<CoinflipRef>()
                .code_hash(code_hash_h256)
                .endowment(self.env().transferred_value())
                .exec_input(
                    ExecutionInput::new(Selector::new(ink::selector_bytes!("new")))
                )
                .salt_bytes(Some(salt))
                .returns::<CoinflipRef>()
                .params();

            // Instantiate the contract
            let coinflip_ref = self
                .env()
                .instantiate_contract(&create_params)
                .map_err(|_| LevelError::InstantiationFailed)?
                .map_err(|_| LevelError::InstantiationFailed)?;

            let instance_address: ink::Address = coinflip_ref.to_addr();

            // Convert Address (H160 - 20 bytes) to AccountId (32 bytes)
            // Pad the 20-byte address to 32 bytes
            let addr_slice: &[u8] = instance_address.as_ref();
            let mut account_bytes = [0u8; 32];
            account_bytes[12..32].copy_from_slice(addr_slice);
            let account_id = AccountId::from(account_bytes);

            Ok(account_id)
        }

        /// Validates if player completed the level
        /// Level is cleared when player wins 10 consecutive flips
        #[ink(message)]
        fn validate_instance(&self, instance: AccountId, _player: AccountId) -> bool {
            // Convert AccountId to Address
            // AccountId is 32 bytes, Address (H160) is 20 bytes
            // Take the last 20 bytes of AccountId
            let account_bytes: &[u8; 32] = instance.as_ref();
            let mut addr_bytes = [0u8; 20];
            addr_bytes.copy_from_slice(&account_bytes[12..32]);
            let instance_addr = ink::Address::from(addr_bytes);

            // Convert Address to CoinflipRef
            let coinflip_ref: CoinflipRef = ink::env::call::FromAddr::from_addr(instance_addr);

            // Check if player has 10 consecutive wins
            coinflip_ref.get_consecutive_wins() >= 10
        }
    }
}
