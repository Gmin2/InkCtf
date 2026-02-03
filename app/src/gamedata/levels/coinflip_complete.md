# Level Complete: Coin Flip

Well done! You've demonstrated why blockchain data should never be used for randomness.

---

## What You Learned

You discovered that **block data is deterministic, not random**. The contract tried to create randomness using:

```rust
let side = (block_number % 2) == 1;
```

But block numbers are:
- Publicly visible before transactions execute
- Predictable (just +1 from the previous block)
- Calculable by any contract in the same transaction

---

## Why Block Data Isn't Random

- **`block_number`** — Sequential and predictable
- **`block_timestamp`** — Validators can manipulate within bounds
- **`block_hash`** — Known before transaction execution
- **Transaction data** — Attacker controls their own tx data

**Any value derivable from on-chain data can be predicted by an attacker.**

---

## Secure Randomness Patterns

### 1. Commit-Reveal Scheme

```rust
// Phase 1: Players commit hash of their choice
pub fn commit(&mut self, commitment: Hash) {
    self.commitments.insert(caller, commitment);
}

// Phase 2: Players reveal their choice
pub fn reveal(&mut self, choice: u32, salt: u32) {
    let expected = hash(choice, salt);
    assert!(self.commitments.get(caller) == expected);
    // Now combine all revealed values for randomness
}
```

### 2. Verifiable Random Functions (VRF)

Use an oracle service that provides cryptographically verifiable randomness:
- Chainlink VRF (Ethereum)
- Substrate's Randomness Pallet
- drand distributed randomness beacon

### 3. Future Block Data (with delay)

```rust
// Request randomness - will use future block hash
pub fn request_random(&mut self) {
    self.request_block = self.env().block_number() + 10;
}

// Fulfill after 10 blocks - hash wasn't known at request time
pub fn fulfill(&mut self) {
    assert!(self.env().block_number() > self.request_block);
    let seed = self.env().block_hash(self.request_block);
    // Use seed for randomness
}
```

---

## Key Takeaways

1. **Never use block data directly for randomness** - It's all predictable
2. **Assume attackers can see everything** - Including "future" values in same block
3. **Use proven randomness solutions** - VRF, commit-reveal, or delayed reveals
4. **Consider the stakes** - Low-value games might accept weaker randomness

---

## Real World Impact

Predictable randomness has been exploited in:
- Lottery contracts (attackers win every time)
- NFT minting (sniping rare traits)
- Gaming contracts (guaranteed wins)
- Raffle systems (frontrunning winners)

Millions of dollars have been lost to "random" outcomes that weren't random at all.

---

Next challenge: **King** - Learn how external call failures can permanently break a contract!
