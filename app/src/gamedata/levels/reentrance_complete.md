# Level Complete: Re-entrancy

Outstanding! You've exploited one of the most famous vulnerabilities in smart contract history.

---

## What You Learned

You discovered the **re-entrancy attack** - when a contract calls an external address, that address can call back into the original contract before the first execution completes.

The vulnerable pattern:
```rust
pub fn withdraw(&mut self, amount: Balance) {
    if balance >= amount {
        // 1. TRANSFER (external call - attacker can re-enter here!)
        self.env().transfer(caller, amount);
        // 2. UPDATE (too late - attacker already withdrew again!)
        self.balances.insert(caller, &(balance - amount));
    }
}
```

---

## The Checks-Effects-Interactions Pattern

To prevent re-entrancy, always follow this order:

1. **CHECKS** - Validate all conditions
2. **EFFECTS** - Update all state
3. **INTERACTIONS** - Make external calls LAST

```rust
// SECURE: Checks-Effects-Interactions
pub fn withdraw(&mut self, amount: Balance) {
    let balance = self.balances.get(caller).unwrap_or(0);

    // 1. CHECKS
    assert!(balance >= amount, "Insufficient balance");

    // 2. EFFECTS (update state BEFORE external call)
    self.balances.insert(caller, &(balance - amount));

    // 3. INTERACTIONS (external call LAST)
    self.env().transfer(caller, amount);
}
```

---

## Key Takeaways

1. **External calls are dangerous** - Any transfer can trigger arbitrary code execution
2. **Update state before external calls** - Never leave state inconsistent during calls
3. **Consider using reentrancy guards** - Mutex-style locks prevent recursive calls
4. **Assume all recipients are malicious** - Even "user" addresses could be contracts

---

## Reentrancy Guard Pattern

```rust
#[ink(storage)]
pub struct SecureVault {
    locked: bool,
    balances: Mapping<Address, Balance>,
}

#[ink(message)]
pub fn withdraw(&mut self, amount: Balance) {
    // Reentrancy guard
    assert!(!self.locked, "Reentrancy detected");
    self.locked = true;

    // ... withdrawal logic ...

    self.locked = false;
}
```

---

## The DAO Hack

The most famous re-entrancy attack was **The DAO Hack** in 2016:
- $60 million stolen from a decentralized investment fund
- Led to the Ethereum/Ethereum Classic hard fork
- Changed smart contract security practices forever

This exact vulnerability pattern was responsible. The fix? Just 15 lines of code following Checks-Effects-Interactions.

[Read more: 15 Lines of Code That Could Have Prevented The DAO Hack](https://blog.openzeppelin.com/15-lines-of-code-that-could-have-prevented-thedao-hack-782499e00942)

---

Next up: **Coin Flip** - Learn why you should never trust blockchain data for randomness!
