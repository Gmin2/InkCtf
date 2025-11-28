#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod coinflip {

    /// Level 4: CoinFlip (Randomness Vulnerability)
    ///
    /// Learning: Understand why blockchain data should not be used for randomness
    ///
    /// Goal:
    /// 1. Win 10 consecutive coin flips
    ///
    /// Vulnerability: Uses block number for "randomness" which is predictable!
    #[ink(storage)]
    pub struct Coinflip {
        /// Number of consecutive wins
        consecutive_wins: u32,
        /// Last block number used (prevents same-block calls)
        last_block_number: u32,
    }

    impl Coinflip {
        /// Constructor
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {
                consecutive_wins: 0,
                last_block_number: 0,
            }
        }

        /// THE VULNERABILITY: Flip a coin using "random" block number
        /// Player guesses true/false. If correct, consecutive wins increase.
        /// If wrong, consecutive wins reset to 0.
        ///
        /// The "randomness" comes from block number which is PUBLIC and PREDICTABLE!
        /// Attacker can calculate the result beforehand and always guess correctly.
        #[ink(message)]
        pub fn flip(&mut self, guess: bool) -> bool {
            let block_number = self.env().block_number();

            // Prevent multiple calls in same block
            assert!(
                self.last_block_number != block_number,
                "Cannot flip twice in same block"
            );

            self.last_block_number = block_number;

            // "Generate randomness" from block number (PREDICTABLE!)
            // Use block number modulo 2 to get true/false
            // Even block = false, Odd block = true
            let side = (block_number % 2) == 1;

            // Check if guess matches the "random" result
            if side == guess {
                self.consecutive_wins += 1;
                true
            } else {
                self.consecutive_wins = 0;
                false
            }
        }

        /// Get current consecutive wins
        #[ink(message)]
        pub fn get_consecutive_wins(&self) -> u32 {
            self.consecutive_wins
        }

        /// Get last block number used
        #[ink(message)]
        pub fn get_last_block_number(&self) -> u32 {
            self.last_block_number
        }
    }
}
