# Coin Flip

A coin flipping game. Guess correctly to increase your winning streak.

---

## Objective

Win **10 consecutive** coin flips.

---

## What You'll Learn

- Why blockchain "randomness" isn't truly random
- How to predict outcomes based on block data
- The importance of secure random number generation

---

## Contract Analysis

Examine how the contract generates its "random" coin flip:
- What data is used to determine the outcome?
- Is this data predictable?
- Can you know the result before making your guess?

---

## Useful Commands

```javascript
// Make a guess (true = heads, false = tails)
await contract.flip(true)
await contract.flip(false)

// Check current block number
await getBlockNumber()

// Check your consecutive wins
await contract.getConsecutiveWins()
```

---

<details>
<summary>💡 Hint 1</summary>

Look at how the contract determines the coin flip result. What input does it use?

</details>

<details>
<summary>💡 Hint 2</summary>

The contract uses `block_number % 2` to determine the flip. Block numbers are public and predictable!

</details>

<details>
<summary>💡 Hint 3</summary>

If block number is **odd**, result is `true`. If **even**, result is `false`.

Simply check the current block number and guess accordingly!

</details>

<details>
<summary>💡 Advanced: Attack Contract</summary>

For a more reliable solution, deploy an attacker contract that:
1. Reads the current block number
2. Calculates the expected result
3. Calls `flip()` with the correct guess

This ensures atomic execution in the same block.

</details>
