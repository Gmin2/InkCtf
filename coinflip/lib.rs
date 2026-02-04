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

    #[cfg(test)]
    mod tests {
        use super::*;

        fn advance_block() {
            ink::env::test::advance_block::<ink::env::DefaultEnvironment>();
        }

        #[ink::test]
        fn new_starts_at_zero_wins() {
            let contract = Coinflip::new();
            assert_eq!(contract.get_consecutive_wins(), 0);
            assert_eq!(contract.get_last_block_number(), 0);
        }

        #[ink::test]
        fn correct_guess_increments_wins() {
            let mut contract = Coinflip::new();
            // Block 0 is even -> side = false
            // We need to be at block 1 (odd) to guess true, or block 2 (even) to guess false
            advance_block(); // now at block 1, odd -> side = true
            let result = contract.flip(true);
            assert!(result);
            assert_eq!(contract.get_consecutive_wins(), 1);
        }

        #[ink::test]
        fn wrong_guess_resets_wins() {
            let mut contract = Coinflip::new();
            advance_block(); // block 1, odd -> side = true
            let result = contract.flip(false); // wrong guess
            assert!(!result);
            assert_eq!(contract.get_consecutive_wins(), 0);
        }

        #[ink::test]
        #[should_panic(expected = "Cannot flip twice in same block")]
        fn cannot_flip_twice_same_block() {
            let mut contract = Coinflip::new();
            advance_block(); // block 1
            contract.flip(true);
            contract.flip(true); // same block -> panics
        }

        #[ink::test]
        fn consecutive_correct_guesses_accumulate() {
            let mut contract = Coinflip::new();

            // Exploit: predict outcome from block number parity
            for _ in 0..5 {
                advance_block();
                let block_number = contract.env().block_number();
                let expected_side = (block_number % 2) == 1;
                let result = contract.flip(expected_side);
                assert!(result);
            }
            assert_eq!(contract.get_consecutive_wins(), 5);
        }

        #[ink::test]
        fn wrong_guess_after_streak_resets_to_zero() {
            let mut contract = Coinflip::new();

            // Build up 3 wins
            for _ in 0..3 {
                advance_block();
                let block_number = contract.env().block_number();
                let expected_side = (block_number % 2) == 1;
                contract.flip(expected_side);
            }
            assert_eq!(contract.get_consecutive_wins(), 3);

            // Now guess wrong
            advance_block();
            let block_number = contract.env().block_number();
            let expected_side = (block_number % 2) == 1;
            contract.flip(!expected_side); // intentionally wrong
            assert_eq!(contract.get_consecutive_wins(), 0);
        }

        #[ink::test]
        fn predictable_randomness_exploit_wins_10() {
            let mut contract = Coinflip::new();

            for _ in 0..10 {
                advance_block();
                let block_number = contract.env().block_number();
                let predicted = (block_number % 2) == 1;
                assert!(contract.flip(predicted));
            }
            assert_eq!(contract.get_consecutive_wins(), 10);
        }

        #[ink::test]
        fn last_block_number_updated_after_flip() {
            let mut contract = Coinflip::new();
            advance_block();
            let block = contract.env().block_number();
            contract.flip(true);
            assert_eq!(contract.get_last_block_number(), block);
        }
    }
}
