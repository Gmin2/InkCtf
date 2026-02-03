# Walkthrough: Vault

> **Difficulty:** Easy
> **Skills:** Storage layout, Reading private variables
> **Objective:** Unlock the vault by finding and using the "hidden" password.

---

## Overview

The Vault contract stores a password and uses it to gate an `unlock()` function. Unlike the Instance level, there is **no getter function** for the password — the developer believed this makes the password hidden. It doesn't. All blockchain storage is publicly readable regardless of whether the contract exposes getter functions.

This level teaches a critical lesson: **the `private` keyword and the absence of getters only affect contract-level visibility, not on-chain data visibility.**

---

## Prerequisites

- Connected wallet on Paseo Asset Hub testnet
- Browser developer console open (F12)
- A deployed instance of this level (click "Get Instance")

---

## Step 1: Analyze the Contract

```rust
#[ink(storage)]
pub struct Vault {
    locked: bool,
    password: String,  // No getter... but is it really private?
}

impl Vault {
    pub fn new(password: String) -> Self {
        Self { locked: true, password }
    }

    pub fn unlock(&mut self, password: String) {
        if self.password == password {
            self.locked = false;
        }
    }

    pub fn is_locked(&self) -> bool {
        self.locked
    }

    // NOTE: No get_password() function!
}
```

The contract has only two public methods: `unlock()` and `is_locked()`. There is no way to read the password through the contract's API.

---

## Step 2: Understand Why "Private" Isn't Private

Blockchain storage is a public database. Every piece of state stored by a contract exists in publicly queryable storage slots. The ways to read it include:

1. **Block explorers** — Subscan, Polkadot.js Apps
2. **RPC calls** — `state_getStorage` lets you read any storage slot directly
3. **Node queries** — Anyone running a node can read all contract storage

The Rust `pub`/private visibility modifiers only control which other **contracts** can call a function. They have zero effect on whether humans or off-chain tools can read the underlying data.

---

## Step 3: Execute the Exploit

**3a. Confirm the vault is locked:**

```javascript
await contract.isLocked()
// Returns: true
```

**3b. Read the password from storage:**

The password was set during contract construction. You can find it by examining the contract's storage directly. In the browser console:

```javascript
// The platform provides helper functions to read storage
// The password is stored in the contract's storage slots
await contract.getStorageAt(1)  // Read storage slot 1
```

Alternatively, you can find the password by:
- Checking the constructor transaction data on a block explorer
- Using the Polkadot.js Apps UI to query contract storage
- Reading the deployment transaction's input data

**3c. Unlock the vault with the discovered password:**

```javascript
await contract.unlock("the_password_you_found")
```

**3d. Verify it's unlocked:**

```javascript
await contract.isLocked()
// Returns: false
```

---

## Step 4: Submit

Click **Submit Instance** to complete the level.

---

## Why This Works

Smart contracts run on a **public, transparent ledger**. Every transaction, every state change, every byte of storage is recorded and accessible to anyone. The contract's interface (its public functions) is just a convenience layer — it doesn't control data access at the storage level.

Think of it like a building with locked doors but glass walls. The doors (public functions) control entry, but everyone can see through the walls (read storage directly).

---

## How to Prevent This

**Never store secrets on-chain in any form.** Instead:

**Option 1: Hash-based verification**
```rust
#[ink(storage)]
pub struct Vault {
    locked: bool,
    password_hash: [u8; 32],  // Store HASH, not plaintext
}

pub fn unlock(&mut self, password: String) {
    let hash = self.env().hash_bytes::<Keccak256>(password.as_bytes());
    if hash == self.password_hash {
        self.locked = false;
    }
}
```

Even the hash should be treated carefully — if the password has low entropy, the hash can be brute-forced.

**Option 2: Commit-reveal**

Require users to commit a hash first, then reveal the value later. This prevents front-running but still doesn't hide data permanently.

**Option 3: Off-chain secrets**

Keep sensitive data off-chain entirely. Use the blockchain only for verification (e.g., verify a zero-knowledge proof that proves knowledge of the secret without revealing it).

---

## Key Rule

> If you put it on a blockchain, assume the entire world can read it. Design accordingly.
