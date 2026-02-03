# Walkthrough: Re-entrancy

> **Difficulty:** Hard
> **Skills:** Reentrancy attacks, Check-effects-interactions pattern
> **Objective:** Drain all funds from the contract.

---

## Overview

This is the most famous vulnerability in smart contract history. The contract is a simple donation bank: users can donate to addresses and withdraw their balance. The critical flaw is that `withdraw()` sends funds **before** updating the caller's balance, allowing an attacker contract to re-enter and withdraw repeatedly before the balance is set to zero.

This is the same class of vulnerability that enabled **The DAO hack** in 2016, which resulted in the theft of ~$60 million in ETH and the Ethereum hard fork.

---

## Prerequisites

- Connected wallet on Paseo Asset Hub testnet with some PAS tokens
- Browser developer console open (F12)
- A deployed instance of this level (click "Get Instance")

---

## Step 1: Analyze the Contract

Look at the `withdraw()` function carefully:

```rust
pub fn withdraw(&mut self, amount: Balance) {
    let caller = self.env().caller();
    let balance = self.balances.get(caller).unwrap_or(0);

    if balance >= amount {
        // DANGER: External call BEFORE state update
        if self.env().transfer(caller,
            ink::primitives::U256::from(amount)).is_ok() {
            // Too late! Attacker already re-entered
            self.balances.insert(caller, &(balance - amount));
        }
    }
}
```

The order of operations is:
1. Check balance (correct)
2. Transfer funds (external call - **too early!**)
3. Update balance (too late)

---

## Step 2: Understand the Attack

When the contract transfers funds to a caller, if that caller is a **contract with a receive function**, the receiving contract gets to execute code during the transfer. That code can call `withdraw()` again — and since the balance hasn't been updated yet, the check still passes.

```
Attacker          Target Contract
   |                    |
   |--- withdraw() ---->|
   |                    |-- check balance: OK
   |                    |-- transfer funds -->|
   |<-- receive funds --|                     |
   |                    |                     |
   |--- withdraw() ---->| (re-enter!)         |
   |                    |-- check balance: OK  |
   |                    |   (still old value!) |
   |                    |-- transfer again -->|
   |<-- more funds -----|                     |
   |    ...repeat...    |                     |
```

---

## Step 3: Execute the Exploit

For this level, you can exploit it directly from the browser console without deploying an attacker contract (the platform handles the reentrancy mechanics).

**3a. Check the contract's balance:**

```javascript
await contract.getBalance()
```

**3b. Donate some funds to yourself:**

```javascript
await contract.donate(player, { value: toUnit(0.001) })
```

**3c. Check your recorded balance:**

```javascript
await contract.balanceOf(player)
```

**3d. Withdraw your balance (the re-entrancy occurs here):**

```javascript
await contract.withdraw(toWei(0.001))
```

**3e. Check the contract balance again:**

```javascript
await contract.getBalance()
// Should be 0 or significantly reduced
```

---

## Step 4: Submit

Click the **Submit Instance** button once the contract is drained.

---

## Why This Works

The vulnerability exists because of the **order of operations**. The contract performs an external call (transfer) before updating its internal state (balance). During that external call, the attacker gets execution control and can call back into the contract, which still sees the old (pre-update) state.

This violates the **Checks-Effects-Interactions** pattern, which dictates:
1. **Checks** — Validate all conditions
2. **Effects** — Update all state
3. **Interactions** — Make external calls

---

## How to Prevent This

**Fix 1: Checks-Effects-Interactions (CEI)**

```rust
pub fn withdraw_safe(&mut self, amount: Balance) {
    let caller = self.env().caller();
    let balance = self.balances.get(caller).unwrap_or(0);

    // 1. CHECKS
    if balance >= amount {
        // 2. EFFECTS (update state FIRST)
        self.balances.insert(caller, &(balance - amount));

        // 3. INTERACTIONS (external calls LAST)
        self.env().transfer(caller,
            ink::primitives::U256::from(amount)).expect("Transfer failed");
    }
}
```

**Fix 2: Reentrancy Guard**

```rust
#[ink(storage)]
pub struct Reentrance {
    balances: Mapping<Address, Balance>,
    locked: bool,  // Mutex
}

pub fn withdraw(&mut self, amount: Balance) {
    assert!(!self.locked, "ReentrancyGuard: reentrant call");
    self.locked = true;

    // ... withdraw logic ...

    self.locked = false;
}
```

**Fix 3: Pull over Push**

Instead of sending funds directly, let users withdraw themselves. This eliminates the external call during the critical state update.
