# Level 1: Instance

Welcome to ink!Spector Gadget! This is your first challenge.

Look carefully at the contract's code below.

---

## Objective

You will beat this level if you call `authenticate()` with the correct password.

---

## Things that might help

- Look at ALL the public functions in the contract
- In ink!, any function marked with `#[ink(message)]` is callable by anyone
- Think about what information is truly "hidden" on a blockchain
- Use the contract explorer to interact with the contract

---

## Hints

<details>
<summary>Hint 1</summary>

The contract has a password stored in its storage. How is this password set?

</details>

<details>
<summary>Hint 2</summary>

Look at all the `#[ink(message)]` functions. Is there one that might reveal sensitive information?

</details>

<details>
<summary>Hint 3</summary>

The `get_password()` function is public! Call it to retrieve the password, then use it to authenticate.

</details>
