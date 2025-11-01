#![cfg_attr(not(feature = "std"), no_std)]

use ink::primitives::AccountId;

/// Shared trait that all level factories must implement
#[ink::trait_definition]
pub trait Level {
    /// Deploy a new instance for a player
    /// Returns the AccountId of the deployed instance
    #[ink(message, payable)]
    fn create_instance(&mut self, player: AccountId) -> Result<AccountId, LevelError>;

    /// Validate if player completed the level
    /// Checks the instance contract state
    #[ink(message)]
    fn validate_instance(&self, instance: AccountId, player: AccountId) -> bool;
}

/// Errors that can occur during level operations
#[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
#[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
pub enum LevelError {
    /// Failed to instantiate the contract
    InstantiationFailed,
    /// Player doesn't have enough funds
    InsufficientFunds,
}
