# King

A "King of the Hill" game. Whoever sends the most becomes the new King!

---

## Objective

1. Become the King
2. **Prevent anyone else from ever claiming the throne**

---

## What You'll Learn

- Denial of Service (DoS) attack patterns
- Why external calls can fail
- The dangers of relying on successful transfers

---

## Game Rules

| Rule | Description |
|------|-------------|
| Claim Throne | Send more than the current prize |
| Previous King | Receives your payment |
| Owner | Can reclaim throne anytime |

---

## Useful Commands

```javascript
// Check current king
await contract.getKing()

// Check current prize amount
await contract.getPrize()

// Claim the throne (send more than prize)
await contract.claimThrone({ value: toUnit(1) })
```

---

<details>
<summary>💡 Hint 1</summary>

What happens if the previous King **can't receive** their prize?

</details>

<details>
<summary>💡 Hint 2</summary>

A contract can **refuse** to accept incoming transfers by not having a receive/fallback function, or by reverting in it.

</details>

<details>
<summary>💡 Hint 3</summary>

If the transfer to the old King fails, the **entire transaction reverts**. No new King can be crowned!

</details>

<details>
<summary>💡 Attack Strategy</summary>

Deploy a contract that:
1. Calls `claimThrone()` to become King
2. Has **no receive function** (or one that always reverts)

Now when anyone tries to dethrone you:
1. Contract tries to pay you
2. Your contract rejects payment
3. Transaction reverts
4. You remain King forever!

</details>
