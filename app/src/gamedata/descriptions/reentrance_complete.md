# Re-entrancy - Completed! 🎉

You've successfully drained the contract! This is one of the most famous vulnerabilities in smart contract history.

---

## What You Learned

The contract had a classic **reentrancy vulnerability**:

```rust
fn withdraw(&mut self, amount: Balance) {
    let balance = self.balances.get(caller).unwrap_or(0);

    if balance >= amount {
        // ❌ DANGER: External call BEFORE state update
        self.env().transfer(caller, amount)?;

        // ❌ TOO LATE: Attacker already re-entered!
        self.balances.insert(caller, &(balance - amount));
    }
}
```

---

## The Attack Flow

```
Attacker          Target Contract
   |                    |
   |--- withdraw() ---->|
   |                    |-- check balance ✓
   |                    |-- transfer funds -->|
   |<-- receive funds --|                     |
   |                    |                     |
   |--- withdraw() ---->| (re-enter!)         |
   |                    |-- check balance ✓   |
   |                    |   (still shows old!)|
   |                    |-- transfer again -->|
   |<-- more funds -----|                     |
   |    ...repeat...    |                     |
```

---

## The DAO Hack

This exact vulnerability was exploited in **The DAO hack** (2016):

- **Amount Stolen** — ~$60 million in ETH
- **Result** — Ethereum hard fork
- **Legacy** — Birth of Ethereum Classic

---

## The Fix: Checks-Effects-Interactions

```rust
fn withdraw_safe(&mut self, amount: Balance) {
    let balance = self.balances.get(caller).unwrap_or(0);

    // 1. CHECKS
    if balance >= amount {
        // 2. EFFECTS (update state FIRST)
        self.balances.insert(caller, &(balance - amount));

        // 3. INTERACTIONS (external calls LAST)
        self.env().transfer(caller, amount)?;
    }
}
```

---

## Additional Protections

- **Reentrancy Guard** — Mutex lock preventing recursive calls
- **Pull over Push** — Let users withdraw instead of pushing funds
- **Gas Limits** — Limit gas for transfers (not fully reliable)

---

## Next Steps

Try the **King** level to learn about denial of service attacks!
