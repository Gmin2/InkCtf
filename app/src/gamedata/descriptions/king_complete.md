# King - Completed! 🎉

You're the eternal King! No one can ever dethrone you.

---

## What You Learned

The contract required successfully paying the previous King before accepting a new one:

```rust
fn claim_throne(&mut self) {
    let value = self.env().transferred_value();

    assert!(value >= self.prize, "Must send at least the prize");

    // ❌ If this fails, everything reverts!
    if self.env().transfer(self.king, self.prize).is_err() {
        panic!("Transfer to previous king failed");
    }

    self.king = caller;
    self.prize = value;
}
```

---

## The Attack

Your malicious contract:

```rust
// Can claim throne
fn become_king(&mut self) {
    target.claim_throne({ value: prize + 1 });
}

// But CANNOT receive funds - no receive function!
// Any transfer to this contract will FAIL
```

---

## What Happens Now

| Step | Action | Result |
|------|--------|--------|
| 1 | Someone calls `claimThrone()` | ✓ Passes value check |
| 2 | Contract tries to pay you | ❌ Transfer fails |
| 3 | Transaction reverts | ❌ No new King |
| 4 | You remain King | 👑 Forever! |

---

## Key Takeaways

- **Never assume external calls will succeed**
- External calls can fail for many reasons:
  - Receiving contract rejects payment
  - Out of gas
  - Receiving contract doesn't exist
- **Don't let external call failures block critical functionality**

---

## The Fix: Pull over Push

```rust
fn claim_throne(&mut self) {
    assert!(value >= self.prize);

    // Don't send - just record what's owed
    self.pending_withdrawals.insert(self.king, self.prize);

    self.king = caller;
    self.prize = value;
}

// Let old kings withdraw themselves
fn withdraw(&mut self) {
    let amount = self.pending_withdrawals.get(caller);
    self.pending_withdrawals.insert(caller, 0);
    self.env().transfer(caller, amount)?;
}
```

---

## Next Steps

Ready for the **Vault** level? Learn more about reading "private" blockchain data!
