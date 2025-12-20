# Instance

Welcome to ink!CTF! This is your first challenge.

---

## Objective

Call `authenticate()` with the correct password to clear the level.

---

## What You'll Learn

- How to read ink! smart contract source code
- Understanding contract storage and constructors
- Using the browser console to interact with contracts

---

## Getting Started

1. Click **Get Instance** to deploy your personal instance of this level
2. Look at the contract source code on the right
3. Open your browser's developer console (F12 → Console tab)
4. Type `help()` to see available commands
5. Find the password and call `await contract.authenticate("password")`
6. When you think you've solved it, click **Submit Instance**

---

## Useful Commands

```javascript
// Authenticate with a password
await contract.authenticate("your_guess")

// Check if level is cleared
await contract.getCleared()

// Get balance
await getBalance()
```

---

<details>
<summary>💡 Hint 1</summary>

The password is set when the contract is constructed. Check the constructor!

</details>

<details>
<summary>💡 Hint 2</summary>

"Private" variables in smart contracts aren't actually private on the blockchain. All storage is publicly readable.

</details>

<details>
<summary>💡 Hint 3</summary>

Look at the `get_password()` function in the source code...

</details>
