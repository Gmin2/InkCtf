# Level 4: Coin Flip

This is a coin flipping game where you need to build up your winning streak by guessing the outcome of a coin flip.

---

## Objective

Guess the correct outcome 10 times in a row to beat this level.

---

## Things that might help

- Blockchain data is deterministic and publicly visible
- Miners/validators know block data before it's finalized
- "Random" values derived from block data aren't random at all
- You can predict the outcome if you know the algorithm

---

## The Game

- Call `flip(guess)` with `true` or `false`
- If you guess correctly, your consecutive wins increase
- If you guess wrong, your streak resets to 0
- Reach 10 consecutive wins to beat the level

Seems like 50/50 odds... but is it really random?

---

## Hints

<details>
<summary>Hint 1</summary>

Look at how the contract determines the coin flip result. What data does it use?

</details>

<details>
<summary>Hint 2</summary>

The contract uses `block_number % 2` to determine the outcome. Block numbers are public and predictable!

</details>

<details>
<summary>Hint 3</summary>

Create an attacker contract that:
1. Reads the current block number
2. Calculates `block_number % 2` (same logic as the victim)
3. Calls `flip()` with the pre-calculated answer
4. Repeat 10 times (once per block)

You can't lose because you already know the answer!

</details>
