# Level 5: King

The contract below represents a very simple game: whoever sends it an amount larger than the current prize becomes the new king. On such an event, the overthrown king gets paid the new prize.

---

## Objective

1. Become the king
2. Make sure no one else can claim the throne (not even the owner trying to reclaim it)

When you submit your instance, the factory will try to reclaim kingship. If it fails, you win!

---

## Things that might help

- What happens when a transfer fails in ink!?
- Can you make a transfer always fail?
- Contracts can reject incoming funds
- The `claim_throne` function has a critical assumption...

---

## The Rules

- Send more than the current `prize` to become king
- When you become king, the old king receives the prize
- The owner can always reclaim kingship

But what if the old king... refuses the money?

---

## Hints

<details>
<summary>Hint 1</summary>

Look at what happens when someone tries to claim the throne. The contract tries to transfer funds to the previous king.

</details>

<details>
<summary>Hint 2</summary>

If the transfer to the previous king fails, the entire `claim_throne` transaction reverts. No one can become the new king!

</details>

<details>
<summary>Hint 3</summary>

Create a malicious contract that:
1. Calls `claim_throne()` with enough funds to become king
2. Does NOT accept incoming transfers (no payable functions, or explicitly revert)

Now when anyone tries to claim the throne, the transfer to your contract fails, and they can never become king. The throne is permanently yours!

</details>
