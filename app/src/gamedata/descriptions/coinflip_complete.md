# Coin Flip - Completed! 🎉

You've beaten the odds! Or rather, you've shown that there were no real odds to beat.

---

## What You Learned

The contract used **block number** to generate "random" outcomes:

```rust
// "Randomness" = block_number % 2 (PREDICTABLE!)
let side = (block_number % 2) == 1;
```

Since block numbers are public and sequential, you could predict every flip!

---

## The Vulnerability

| Block Number | Result |
|--------------|--------|
| Odd (1, 3, 5...) | `true` |
| Even (2, 4, 6...) | `false` |

---

## Key Takeaways

- **Block data is not random** - miners/validators know it, and it's public after the block
- **Never use block hash/timestamp/number for randomness** in adversarial settings
- **Commit-reveal schemes** can help but have their own tradeoffs
- **VRF (Verifiable Random Functions)** provide cryptographically secure randomness

---

## Secure Randomness Alternatives

For Polkadot/Substrate chains:

| Method | Description |
|--------|-------------|
| **Randomness Pallet** | Built-in VRF-based randomness |
| **External Oracles** | Chainlink VRF or similar |
| **Commit-Reveal** | Players commit hash, then reveal |

---

## Next Steps

Try the **Reentrance** level to learn about one of the most infamous smart contract vulnerabilities!
