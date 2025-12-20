# Fallback - Completed! 🎉

Excellent work! You've successfully taken over the contract and drained its funds.

---

## What You Learned

The contract had a vulnerability in its **fallback function**. The intended ownership transfer required contributing more than the owner, but the fallback function provided a shortcut.

---

## The Vulnerability

```rust
/// THE VULNERABILITY: Backdoor to ownership!
#[ink(message, payable)]
pub fn fallback(&mut self) {
    let caller = self.env().caller();
    let value = self.env().transferred_value();

    assert!(value > 0, "Must send value");
    assert!(self.contributions.get(caller).unwrap_or(0) > 0,
            "Must have contributed first");

    // Instant ownership with just ANY contribution!
    self.owner = caller;
}
```

---

## The Attack Flow

| Step | Action | Result |
|------|--------|--------|
| 1 | `contribute({ value: toUnit(0.0001) })` | You're now a contributor |
| 2 | `fallback({ value: toUnit(0.0001) })` | You're now the owner! |
| 3 | `withdraw()` | Funds drained |

---

## Key Takeaways

- **Fallback functions need careful access control** - they're triggered by any incoming transfer
- **Logic in fallback functions should be minimal** - complex logic can introduce vulnerabilities
- **Always validate assumptions** - the code assumed contributors would follow the "proper" path

---

## Real World Impact

Similar vulnerabilities have been exploited in:
- Governance contracts with flawed voting mechanisms
- Token contracts with unprotected fallback handlers
- Multi-sig wallets with ownership loopholes

---

## Next Steps

Ready for the **Coinflip** level? Learn about the dangers of on-chain randomness!
