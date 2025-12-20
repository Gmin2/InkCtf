# Vault

A secure vault protected by a password. There's no getter for the password... so it must be safe, right?

---

## Objective

Unlock the vault by finding the "hidden" password.

---

## What You'll Learn

- How blockchain storage works
- Reading "private" variables from storage
- Understanding storage layout

---

## Contract Analysis

The vault has:
- A `locked` boolean
- A `password` string (with **no getter function**)

```rust
#[ink(storage)]
pub struct Vault {
    locked: bool,
    password: String,  // No getter... but is it really private?
}

// NOTE: No get_password() function!
```

---

## Useful Commands

```javascript
// Check if vault is locked
await contract.isLocked()

// Try to unlock with a password
await contract.unlock("your_guess")

// Get your balance
await getBalance()
```

---

## Reading Storage Directly

In Substrate/ink!, you can read any storage using RPC:

```javascript
// Using Polkadot.js Apps:
// Developer → Chain State → contracts → contractStorage

// Or via API:
await api.rpc.state.getStorage(contractAddress, storageKey)
```

---

<details>
<summary>💡 Hint 1</summary>

"Private" only means other **contracts** can't call a getter. It doesn't hide the data!

</details>

<details>
<summary>💡 Hint 2</summary>

All blockchain data is stored publicly. Anyone can read any storage slot.

</details>

<details>
<summary>💡 Hint 3</summary>

Use a block explorer or Polkadot.js Apps to inspect the contract's storage directly.

Look for the storage key that contains the password string.

</details>

<details>
<summary>💡 Tools to Use</summary>

1. **Polkadot.js Apps** → Developer → Chain State
2. **Block Explorer** → Contract Storage tab
3. **Direct RPC** → `state_getStorage`

The password is stored in plain text in the contract's storage!

</details>
