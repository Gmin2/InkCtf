# Level 3: Re-entrancy

The goal of this level is for you to steal all the funds from the contract.

---

## Objective

Drain the contract's entire balance.

---

## Things that might help

- Untrusted contracts can execute code where you least expect it
- When a contract sends funds, the recipient can execute code
- The order of operations matters: check, effect, interact
- Sometimes the best way to attack a contract is with another contract

---

## How Donations Work

This contract acts as a simple bank:
- `donate(address)` - Add funds to someone's balance
- `withdraw(amount)` - Withdraw your balance
- `balance_of(address)` - Check any address's balance

The contract starts with some funds. Your mission: take them all.

---

## Hints

<details>
<summary>Hint 1</summary>

Look at the order of operations in `withdraw()`. What happens first - the transfer or the balance update?

</details>

<details>
<summary>Hint 2</summary>

When the contract transfers funds to you, your contract can execute code. What if that code... calls withdraw again?

</details>

<details>
<summary>Hint 3</summary>

Create an attacker contract that:
1. Donates some funds to itself
2. Calls `withdraw()`
3. In its receive/fallback, calls `withdraw()` again before the balance is updated
4. Repeat until the contract is drained!

The balance check passes every time because it hasn't been updated yet.

</details>
