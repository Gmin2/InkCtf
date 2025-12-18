# Level Complete: King

Excellent! You've permanently broken the contract with a Denial of Service attack.

---

## What You Learned

You discovered the **DoS via Failed External Call** vulnerability. The contract assumed that transferring funds to the previous king would always succeed:

```rust
// VULNERABLE: If this fails, nobody can ever become king!
if self.env().transfer(self.king, prize).is_err() {
    panic!("Transfer to previous king failed");
}

// These lines never execute if transfer fails
self.king = caller;
self.prize = value;
```

By making yourself king with a contract that rejects transfers, you've permanently broken the game.

---

## The Attack Pattern

```rust
// Malicious "King" contract
#[ink::contract]
mod malicious_king {
    #[ink(storage)]
    pub struct MaliciousKing {
        target: Address,
    }

    impl MaliciousKing {
        #[ink(constructor)]
        pub fn new(target: Address) -> Self {
            Self { target }
        }

        #[ink(message, payable)]
        pub fn attack(&mut self) {
            // Become king by calling claim_throne
            // After this, any transfer to us will fail!
        }

        // NO receive/fallback function = rejects all transfers
        // Or explicitly:
        // #[ink(message, payable, selector = _)]
        // pub fn reject(&self) { panic!("No funds accepted"); }
    }
}
```

---

## Why This Works

1. You become king via a contract that rejects transfers
2. Someone tries to claim the throne
3. Contract tries to pay you the prize
4. Your contract rejects the payment
5. The entire transaction reverts
6. The throne remains locked forever

---

## Secure Patterns

### Pull Over Push

Instead of sending funds directly, let users withdraw:

```rust
// SECURE: Pull pattern
#[ink(storage)]
pub struct SecureKing {
    king: Address,
    prize: Balance,
    pending_withdrawals: Mapping<Address, Balance>,
}

#[ink(message, payable)]
pub fn claim_throne(&mut self) {
    let old_king = self.king;
    let old_prize = self.prize;

    // Update state first (no external calls!)
    self.king = caller;
    self.prize = value;

    // Record withdrawal for old king (they claim it later)
    let pending = self.pending_withdrawals.get(old_king).unwrap_or(0);
    self.pending_withdrawals.insert(old_king, &(pending + old_prize));
}

#[ink(message)]
pub fn withdraw(&mut self) {
    let amount = self.pending_withdrawals.get(caller).unwrap_or(0);
    self.pending_withdrawals.insert(caller, &0);
    self.env().transfer(caller, amount); // If this fails, only caller is affected
}
```

### Handle Transfer Failures Gracefully

```rust
// ACCEPTABLE: Don't revert on failed transfer
if self.env().transfer(old_king, prize).is_err() {
    // Log the failure, but continue
    // Maybe store funds for later claim
    self.unclaimed.insert(old_king, prize);
}
// Game continues regardless
self.king = caller;
```

---

## Key Takeaways

1. **Never assume transfers succeed** - Recipients can reject funds
2. **Prefer pull over push** - Let users withdraw instead of pushing funds
3. **Don't let external failures block core logic** - Handle errors gracefully
4. **State changes shouldn't depend on external calls** - Update state before calling out

---

## Real World Impact

This pattern has affected:
- Auction contracts (highest bidder can block refunds)
- Staking systems (locked funds if withdrawal fails)
- Games with prize distributions
- Any contract that pays multiple parties in sequence

---

Final challenge: **Vault** - Return to basics and learn why "private" doesn't mean what you think it means on a blockchain!
