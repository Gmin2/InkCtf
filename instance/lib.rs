#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod instance {
    use ink::prelude::string::String;

    #[ink(storage)]
    pub struct Instance {
        password: String,
        cleared: bool,
    }

    impl Instance {
        /// Constructor initialize with a password
        #[ink(constructor)]
        pub fn new(password: String) -> Self {
            Self {
                password,
                cleared: false,
            }
        }

        /// Check if a password is correct and mark as cleared
        #[ink(message)]
        pub fn authenticate(&mut self, passkey: String) {
            if passkey == self.password {
                self.cleared = true;
            }
        }

        /// Check if level is completed
        #[ink(message)]
        pub fn get_cleared(&self) -> bool {
            self.cleared
        }

        /// Get the password (this method is PUBLIC - this is the vulnerability)
        #[ink(message)]
        pub fn get_password(&self) -> String {
            self.password.clone()
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        #[ink::test]
        fn test_authentication_wrong_passwod() {
            let mut instance = Instance::new(String::from("sercet"));
            assert!(!instance.get_cleared());

            instance.authenticate(String::from("wrong"));
            assert!(!instance.get_cleared())
        }

        #[ink::test]
        fn test_authentication_correct_password() {
            let mut instance = Instance::new(String::from("sercet"));

            instance.authenticate(String::from("sercet"));
            assert!(instance.get_cleared());
        }

        #[ink::test]
        fn test_password_is_public() {
            let instance = Instance::new(String::from("super_encrypted"));
            assert_eq!(instance.get_password(), String::from("super_encrypted"));
        }
    }
}
