# Fallback

This contract has an owner with a massive contribution. Can you find a way to claim ownership?

---

## Objective

1. Claim ownership of the contract
2. Drain all its funds

---

## What You'll Learn

- Understanding ownership patterns in smart contracts
- How fallback functions work
- The importance of access control

---

## Contract Analysis

Look at the contract carefully and ask yourself:
- Who is the current owner?
- How can ownership be transferred?
- What does the `fallback()` function do?
- Are there any conditions you can exploit?

---

## Useful Commands

```javascript
// Check the current owner
await contract.getOwner()

// Check your contribution
await contract.getContribution()

// Make a contribution (must be < 0.001)
await contract.contribute({ value: toUnit(0.0001) })

// Call the fallback function with value
await contract.fallback({ value: toUnit(0.0001) })

// Withdraw funds (owner only)
await contract.withdraw()
```

---

<details>
<summary>💡 Hint 1</summary>

You need to become the owner before you can withdraw. There are **two ways** to become owner.

</details>

<details>
<summary>💡 Hint 2</summary>

The `contribute()` function requires you to have MORE contributions than the current owner (1000 tokens!) - that's nearly impossible with the < 0.001 limit per call.

</details>

<details>
<summary>💡 Hint 3</summary>

The `fallback()` function has a much easier condition - you just need **any** contribution > 0!

</details>

<details>
<summary>💡 Solution Outline</summary>

1. Make a small contribution via `contribute()`
2. Call `fallback()` with some value - instant ownership!
3. Call `withdraw()` to drain the funds

</details>
