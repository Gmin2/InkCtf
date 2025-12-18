# Level 6: Vault

Unlock the vault to pass the level!

---

## Objective

Call `unlock()` with the correct password to open the vault.

---

## Things that might help

- There's no getter function for the password...
- But where is the password actually stored?
- ALL contract storage exists on the blockchain
- The blockchain is a public, transparent ledger
- Tools exist to read raw storage slots

---

## The Challenge

The contract has a `password` field but no getter function. The developer thought this would keep it "private."

Is data ever truly private on a blockchain?

---

## Hints

<details>
<summary>Hint 1</summary>

In ink!/Substrate, marking a field as private in Rust only affects compile-time access. At runtime, all storage is on-chain and readable.

</details>

<details>
<summary>Hint 2</summary>

You can read contract storage directly using RPC calls like `contracts_getStorage` or through block explorers that show raw storage.

</details>

<details>
<summary>Hint 3</summary>

The storage layout in ink! contracts is deterministic. The `password` field is stored at a specific storage key. You can:

1. Use Subscan or Contracts UI to inspect storage
2. Use `@polkadot/api` to call `api.rpc.contracts.getStorage(address, key)`
3. Calculate the storage key based on ink!'s storage layout

Once you have the password string, call `unlock(password)` to win!

</details>
