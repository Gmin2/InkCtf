# Level 2: Fallback

Look carefully at the contract's code below.

---

## Objective

You will beat this level if:

1. You claim ownership of the contract
2. You reduce its balance to 0

---

## Things that might help

- How to send tokens when interacting with a contract
- Understanding `#[ink(message, payable)]` functions
- The difference between regular functions and fallback behavior
- Look at ALL paths to becoming owner, not just the obvious one

---

## Contract State

- The owner starts with a massive contribution (1000 tokens)
- The `contribute()` function limits contributions to < 0.001 tokens
- It would take millions of transactions to outcontribute the owner...
- Or would it? Is there another way?

---

## Hints

<details>
<summary>Hint 1</summary>

There are TWO ways to become owner in this contract. One is practically impossible (outcontributing 1000 tokens). What's the other way?

</details>

<details>
<summary>Hint 2</summary>

Look at the `fallback()` function. What are its requirements to change ownership?

</details>

<details>
<summary>Hint 3</summary>

The attack path:
1. First, make a small contribution via `contribute()` (any amount works)
2. Then call `fallback()` with some value attached
3. You're now the owner! Call `withdraw()` to drain the funds

</details>
