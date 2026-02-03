# Walkthrough: King

> **Difficulty:** Medium
> **Skills:** Denial of service, Failed transfers
> **Objective:** Become the king AND prevent anyone else from reclaiming the throne.

---

## Overview

This is a "King of the Hill" game. Whoever sends more than the current prize becomes the new king, and the old king receives their prize back. The vulnerability is that the contract **requires** the transfer to the old king to succeed — if it fails, the entire transaction reverts. By becoming king with a contract that rejects incoming transfers, you permanently lock the throne.

---

## Prerequisites

- Connected wallet on Paseo Asset Hub testnet with some PAS tokens
- Browser developer console open (F12)
- A deployed instance of this level (click "Get Instance")

---

## Step 1: Analyze the Contract

Look at `claim_throne()`:

```rust
pub fn claim_throne(&mut self) {
    let caller = self.env().caller();
    let value = self.env().transferred_value().low_u128();

    assert!(
        value >= self.prize || caller == self.owner,
        "Must send at least the prize amount"
    );

    // If king is a contract that rejects transfers... GAME OVER
    if self.env().transfer(self.king,
        ink::primitives::U256::from(self.prize)).is_err() {
        panic!("Transfer to previous king failed");
    }

    self.king = caller;
    self.prize = value;
}
```

The critical line is the `panic!` when the transfer fails. If the old king cannot receive funds, **nobody** can become the new king because every attempt to `claim_throne()` will revert.

---

## Step 2: Identify the Vulnerability

The contract makes an assumption: "transfers to the previous king will always succeed." This is false. A contract can reject incoming transfers by:
- Not having a receive/fallback function
- Having a receive function that always reverts
- Running out of gas during the receive call

If you become king via a contract that rejects payments, the game is permanently stuck.

---

## Step 3: Execute the Exploit

**3a. Check the current king and prize:**

```javascript
await contract.getKing()
await contract.getPrize()
```

**3b. Claim the throne by sending at least the prize amount:**

```javascript
await contract.claimThrone({ value: toUnit(0.01) })
```

**3c. Verify you're the king:**

```javascript
await contract.getKing()
// Should return your address
```

The key to **preventing** anyone from reclaiming the throne is that the exploit needs to be executed from a contract address that rejects transfers. In the context of this CTF, claiming the throne from your wallet and then having the factory fail to reclaim it during validation demonstrates the vulnerability.

---

## Step 4: Submit

Click **Submit Instance**. The factory will attempt to reclaim the throne — if it fails (because the transfer to you reverts or due to the DoS condition), the level is validated as complete.

---

## Why This Works

The contract follows a "push" payment pattern: it actively sends funds to the previous king during the state transition. If that push fails, the entire operation fails. This creates a denial-of-service vector where a malicious king can prevent all future state transitions.

The fundamental issue is **coupling state updates with external calls that can fail**. The contract should never let an external call's success or failure determine whether core state can be updated.

---

## How to Prevent This

**The Pull-over-Push Pattern:**

```rust
#[ink(storage)]
pub struct King {
    king: Address,
    prize: Balance,
    pending_withdrawals: Mapping<Address, Balance>,
}

#[ink(message, payable)]
pub fn claim_throne(&mut self) {
    let value = self.env().transferred_value().low_u128();
    assert!(value >= self.prize);

    // DON'T send — just record what's owed
    let old_king = self.king;
    let old_prize = self.prize;
    self.pending_withdrawals.insert(old_king, &old_prize);

    // Update state (always succeeds)
    self.king = self.env().caller();
    self.prize = value;
}

// Let old kings withdraw at their own leisure
#[ink(message)]
pub fn withdraw(&mut self) {
    let caller = self.env().caller();
    let amount = self.pending_withdrawals.get(caller).unwrap_or(0);
    assert!(amount > 0, "Nothing to withdraw");
    self.pending_withdrawals.insert(caller, &0);
    self.env().transfer(caller,
        ink::primitives::U256::from(amount)).expect("Transfer failed");
}
```

- Separate the state update from the payment
- Never let an external call's success block critical functionality
- Let users pull their funds instead of pushing to them
