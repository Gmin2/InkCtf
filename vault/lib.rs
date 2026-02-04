#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod vault {
    use ink::prelude::string::String;

    /// Level 6: Vault (Storage Privacy)
    ///
    /// Learning: Understand that ALL blockchain storage is PUBLIC
    ///
    /// Goal:
    /// 1. Unlock the vault by finding the "private" password
    ///
    /// Vulnerability: Contract stores password in "private" storage
    /// But there's no such thing as private data on a blockchain!
    /// All storage can be read directly, even without getter functions.
    #[ink(storage)]
    pub struct Vault {
        /// Whether the vault is locked (public)
        locked: bool,
        /// The "secret" password (no getter, but still PUBLIC on blockchain!)
        password: String,
    }

    impl Vault {
        /// Constructor - initializes with a "secret" password
        #[ink(constructor)]
        pub fn new(password: String) -> Self {
            Self {
                locked: true,
                password,
            }
        }

        /// THE VULNERABILITY: Unlock the vault with correct password
        /// Players think the password is hidden because there's no getter
        /// But ALL storage is public on blockchain - can be read directly!
        #[ink(message)]
        pub fn unlock(&mut self, password: String) {
            if self.password == password {
                self.locked = false;
            }
        }

        /// Check if vault is locked
        #[ink(message)]
        pub fn is_locked(&self) -> bool {
            self.locked
        }

        // NOTE: No getter for password! Players might think it's "private"
        // But blockchain storage is ALWAYS public!
        // Players can read the password directly from contract storage
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        #[ink::test]
        fn new_creates_locked_vault() {
            let vault = Vault::new(String::from("secret123"));
            assert!(vault.is_locked());
        }

        #[ink::test]
        fn unlock_with_correct_password() {
            let mut vault = Vault::new(String::from("secret123"));
            vault.unlock(String::from("secret123"));
            assert!(!vault.is_locked());
        }

        #[ink::test]
        fn unlock_with_wrong_password_stays_locked() {
            let mut vault = Vault::new(String::from("secret123"));
            vault.unlock(String::from("wrong"));
            assert!(vault.is_locked());
        }

        #[ink::test]
        fn unlock_with_empty_password_stays_locked() {
            let mut vault = Vault::new(String::from("secret123"));
            vault.unlock(String::from(""));
            assert!(vault.is_locked());
        }

        #[ink::test]
        fn empty_password_vault_can_be_unlocked() {
            let mut vault = Vault::new(String::from(""));
            vault.unlock(String::from(""));
            assert!(!vault.is_locked());
        }

        #[ink::test]
        fn multiple_wrong_attempts_then_correct() {
            let mut vault = Vault::new(String::from("pass"));
            vault.unlock(String::from("wrong1"));
            vault.unlock(String::from("wrong2"));
            assert!(vault.is_locked());
            vault.unlock(String::from("pass"));
            assert!(!vault.is_locked());
        }

        #[ink::test]
        fn unlock_is_idempotent() {
            let mut vault = Vault::new(String::from("pass"));
            vault.unlock(String::from("pass"));
            assert!(!vault.is_locked());
            // Unlocking again should still be unlocked
            vault.unlock(String::from("pass"));
            assert!(!vault.is_locked());
        }
    }
}
