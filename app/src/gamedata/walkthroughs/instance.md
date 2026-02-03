# Walkthrough: Instance

> **Difficulty:** Easy
> **Skills:** Reading contract storage, Understanding constructors
> **Objective:** Call `authenticate()` with the correct password to clear the level.

---

## Overview

This is your first ink!CTF level. The contract stores a password and requires you to call `authenticate()` with the correct value. The vulnerability here is straightforward: the developer accidentally exposed a public getter for the "secret" password.

This teaches the most fundamental lesson in smart contract security: **never assume data is hidden just because you don't want people to see it.**

---

## Prerequisites

- Connected wallet on Paseo Asset Hub testnet
- Browser developer console open (F12)
- A deployed instance of this level (click "Get Instance" on the level page)

---

## Step 1: Read the Contract Source

Look at the contract source code in the Code Mirror panel. Pay attention to the public functions (marked with `#[ink(message)]`):

```rust
/// Get the password (PUBLIC - this is the vulnerability!)
#[ink(message)]
pub fn get_password(&self) -> String {
    self.password.clone()
}
```

The contract has three public functions:
1. `authenticate(passkey)` - checks a password and sets `cleared = true`
2. `get_cleared()` - returns whether the level is cleared
3. `get_password()` - **returns the password directly!**

---

## Step 2: Identify the Vulnerability

The developer created a getter function `get_password()` that returns the stored password. This is marked with `#[ink(message)]`, making it callable by anyone. There is no access control — no ownership check, no restriction at all.

---

## Step 3: Execute the Exploit

Open your browser console (F12) and type `help()` to see the available commands. Then:

**3a. Read the password:**

```javascript
await contract.getPassword()
```

This returns the password string. Copy it.

**3b. Authenticate with the password:**

```javascript
await contract.authenticate("the_password_you_got")
```

**3c. Verify it worked:**

```javascript
await contract.getCleared()
// Should return: true
```

---

## Step 4: Submit

Click the **Submit Instance** button in the UI. The factory contract will verify that `cleared == true` on your instance.

---

## Why This Works

The contract treats the password as a secret, but exposes it through a public function. In smart contracts, every `#[ink(message)]` function is callable by any account or contract on the network. There is no concept of "internal-only" public functions.

Even without `get_password()`, the password would still be readable from on-chain storage (as you'll learn in the Vault level). But having an explicit getter makes it trivially easy.

---

## How to Prevent This

```rust
#[ink(storage)]
pub struct Instance {
    password_hash: [u8; 32],  // Store hash, not plaintext
    cleared: bool,
}

#[ink(message)]
pub fn authenticate(&mut self, passkey: String) {
    let hash = self.env().hash_bytes::<Keccak256>(passkey.as_bytes());
    if hash == self.password_hash {
        self.cleared = true;
    }
}

// No getter for the password or its hash!
```

- Store password hashes instead of plaintext
- Remove unnecessary getter functions
- Review every `#[ink(message)]` to ensure it should be public
