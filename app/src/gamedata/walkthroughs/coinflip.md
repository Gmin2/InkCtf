# Walkthrough: Coin Flip

> **Difficulty:** Medium
> **Skills:** Pseudo-randomness, Block properties
> **Objective:** Win 10 consecutive coin flips.

---

## Overview

This contract implements a coin flip game where you must guess the outcome correctly 10 times in a row. The "randomness" comes from `block_number % 2` — which is completely predictable since block numbers are sequential and public. If you know the current block number, you know the answer.

---

## Prerequisites

- Connected wallet on Paseo Asset Hub testnet
- Browser developer console open (F12)
- A deployed instance of this level (click "Get Instance")

---

## Step 1: Analyze the Contract

Look at the `flip()` function:

```rust
pub fn flip(&mut self, guess: bool) -> bool {
    let block_number = self.env().block_number();

    assert!(
        self.last_block_number != block_number,
        "Cannot flip twice in same block"
    );
    self.last_block_number = block_number;

    // "Randomness" = block_number % 2 (PREDICTABLE!)
    let side = (block_number % 2) == 1;

    if side == guess {
        self.consecutive_wins += 1;
        true
    } else {
        self.consecutive_wins = 0;
        false
    }
}
```

Key observations:
- The "random" side is `(block_number % 2) == 1`
- Odd block numbers = `true`
- Even block numbers = `false`
- You can only flip once per block

---

## Step 2: Identify the Vulnerability

Block numbers are:
- **Public** — anyone can read them
- **Sequential** — they increment by 1 each block
- **Predictable** — you know the next block number before it's produced

So the "coin flip" is not random at all. You can compute the correct guess before calling `flip()`.

---

## Step 3: Execute the Exploit

You need to call `flip()` with the correct guess 10 times, each on a different block.

**3a. Check your current winning streak:**

```javascript
await contract.getConsecutiveWins()
```

**3b. Get the current block number and compute the correct guess:**

```javascript
// Get current block number
const blockNumber = await getBlockNumber()

// The answer: odd = true, even = false
const correctGuess = (blockNumber % 2) === 1
```

**3c. Submit your guess:**

```javascript
await contract.flip(correctGuess)
```

**3d. Repeat for 10 consecutive wins.** You need to wait for a new block between each flip. Check your streak:

```javascript
await contract.getConsecutiveWins()
```

<details>
<summary>Quick method: batch flips</summary>

Since you know the pattern (odd=true, even=false), you can predict which guess to use for the next several blocks. Just make sure each call lands in its expected block. Wait for each transaction to finalize before sending the next.

```javascript
// Repeat this 10 times, waiting for each tx to confirm:
const bn = await getBlockNumber()
await contract.flip((bn % 2) === 1)
await contract.getConsecutiveWins() // Check progress
```

</details>

---

## Step 4: Submit

Once `getConsecutiveWins()` returns 10, click **Submit Instance**.

---

## Why This Works

Blockchain data is deterministic by design. Every validator must agree on the same block number, timestamp, and hash — meaning all of these values are known to everyone. Using any on-chain data as a source of randomness is inherently insecure because:

1. **Block numbers** are sequential and predictable
2. **Block hashes** are known to miners/validators before finalization
3. **Timestamps** can be manipulated by block producers within allowed ranges

---

## How to Prevent This

**Option 1: Commit-Reveal Scheme**
```rust
// Phase 1: Player commits a hash
pub fn commit(&mut self, hash: [u8; 32]) {
    self.commits.insert(self.env().caller(), &hash);
}

// Phase 2: Player reveals, randomness comes from both parties
pub fn reveal(&mut self, value: u64, salt: [u8; 32]) {
    let hash = self.env().hash_encoded::<Keccak256>(&(value, salt));
    assert_eq!(hash, self.commits.get(&caller).unwrap());
    // Combine with contract's own entropy
}
```

**Option 2: VRF (Verifiable Random Functions)**

Use a Substrate randomness pallet or external oracle (like Chainlink VRF) that provides cryptographically verifiable random numbers that cannot be predicted or manipulated.

**Option 3: External Oracle**

Request randomness from an off-chain oracle service. The oracle generates random values and provides a cryptographic proof that the value wasn't tampered with.
