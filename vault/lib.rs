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
}
