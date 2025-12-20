# Re-entrancy

A simple donation bank. Users can donate to addresses and withdraw their balance.

---

## Objective

Drain **all funds** from the contract.

---

## What You'll Learn

- The reentrancy vulnerability pattern
- Why the order of operations matters
- The Checks-Effects-Interactions pattern

---

## Contract Analysis

Study the `withdraw()` function carefully:

| Question | Look For |
|----------|----------|
| When does it check your balance? | Before or after transfer? |
| When does it update your balance? | Before or after transfer? |
| When does it send funds? | What order? |

**Critical:** What happens if you call `withdraw()` again *during* the transfer?

---

## Useful Commands

```javascript
// Donate to yourself
await contract.donate(player, { value: toUnit(0.1) })

// Check your balance in the contract
await contract.balanceOf(player)

// Withdraw your funds
await contract.withdraw(toUnit(0.1))

// Check contract's total balance
await getBalance(instance)
```

---

<details>
<summary>💡 Hint 1</summary>

Look at the order of operations in `withdraw()`:
1. Check balance
2. Transfer funds
3. Update balance

What's wrong with this order?

</details>

<details>
<summary>💡 Hint 2</summary>

When the contract sends you funds, your contract can **execute code** before `withdraw()` finishes.

What if that code calls `withdraw()` again?

</details>

<details>
<summary>💡 Hint 3</summary>

You need to deploy an **attacker contract** that:
1. Donates some funds
2. Calls withdraw
3. In its receive function, calls withdraw again (if balance remains)

</details>

<details>
<summary>💡 Attack Contract Pseudocode</summary>

```rust
fn attack() {
    // 1. Donate to ourselves
    target.donate(self.address, value);
    // 2. Start the drain
    target.withdraw(value);
}

fn receive() {
    // 3. Re-enter while balance still shows funds!
    if target.balance() >= value {
        target.withdraw(value);
    }
}
```

</details>
