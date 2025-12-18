# Level Complete: Fallback

Excellent work! You've exploited a flawed ownership transfer mechanism.

---

## What You Learned

You discovered that **multiple code paths to critical operations are dangerous**. The contract had two ways to become owner:

1. **The "intended" way**: Contribute more than the current owner (practically impossible)
2. **The backdoor**: Call `fallback()` with any value after making a tiny contribution

The developer probably added the fallback function for convenience, not realizing it completely bypassed the security model.

---

## Key Takeaways

1. **Single source of truth** - Critical state changes (like ownership) should have ONE controlled path
2. **Fallback functions are dangerous** - They often get overlooked in security reviews
3. **Defense in depth** - Don't rely on a single check; validate at every entry point

---

## The Vulnerability

```rust
// The "secure" path - practically impossible
pub fn contribute(&mut self) {
    // Can only contribute < 0.001 tokens at a time
    // Owner has 1000 tokens - would take forever!
}

// The backdoor - trivially exploitable!
pub fn fallback(&mut self) {
    // Only requires: value > 0 AND contribution > 0
    // Make tiny contribution, then call this = instant owner!
    self.owner = caller;
}
```

---

## Secure Pattern

```rust
// GOOD: Single, controlled ownership transfer
#[ink(message)]
pub fn transfer_ownership(&mut self, new_owner: Address) {
    assert!(self.env().caller() == self.owner, "Only owner");
    self.owner = new_owner;
}

// If you need a fallback, don't let it modify critical state!
#[ink(message, payable, selector = _)]
pub fn fallback(&mut self) {
    // Only accept funds, never modify ownership
    self.total_received += self.env().transferred_value();
}
```

---

## Real World Parallels

This pattern mirrors real exploits where:
- Admin functions had weak access controls
- "Convenience" functions bypassed security checks
- Legacy code paths remained exploitable

The DAO hack famously exploited unexpected code paths. Always map out ALL ways to reach critical operations!

---

Ready for a harder challenge? **Re-entrancy** awaits - one of the most famous vulnerability classes in smart contract history!
