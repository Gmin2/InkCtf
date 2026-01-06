# ink!Spector Gadget

A gamified Capture-The-Flag platform for learning ink! smart contract security. Exploit vulnerable contracts deployed on Paseo Asset Hub testnet to understand common vulnerabilities and secure coding patterns.

**Live Demo:** [ctfs.ink](https://ctfs.ink)

---

## Overview

ink!Spector Gadget is an interactive security training platform inspired by Ethernaut. Each level presents a vulnerable ink! smart contract that you must exploit to complete. The platform deploys unique contract instances per player, validates exploits on-chain, and tracks progress.

### Architecture

```
Frontend (React)  -->  Paseo Asset Hub Testnet
                              |
                       InkSpector Coordinator
                              |
                    +--------------------+
                    |   Level Factories  |
                    +--------------------+
                              |
                    Player Contract Instances
```

All game logic runs on-chain. No backend server required.

---

## How to Play

### Prerequisites

- A Polkadot wallet (Talisman, SubWallet, or Polkadot.js extension)
- PAS tokens from the Paseo faucet for gas fees

### Step 1: Connect Your Wallet

Click the wallet button in the top-right corner and select your account.

### Step 2: Select a Level

Choose a level from the mission grid. Start with Level 1 (Instance) if you are new.

### Step 3: Get Your Instance

Click **Get Instance** to deploy your personal copy of the vulnerable contract. Each player receives a unique instance to exploit. The instance address will appear in the Tactical Relay console.

### Step 4: Analyze the Contract

Study the contract source code in the Target Mirror panel. Click **Level Intel** for hints, vulnerability explanations, and solution approaches.

### Step 5: Exploit Using Browser Console

Open your browser's developer console (F12 > Console tab). The platform injects helper utilities automatically:

```javascript
// See all available commands
help()

// Your injected contract instance
contract

// Your wallet address
player

// Get contract balance
await getBalance()

// Get any address balance
await getBalance("5GrwvaEF...")
```

Each level has specific methods on the `contract` object. Example for Level 1 (Instance):

```javascript
// Read the password from contract
await contract.getPassword()

// Authenticate with the password
await contract.authenticate("the_password_you_found")

// Verify level is cleared
await contract.getCleared()
```

### Step 6: Submit Your Solution

Once you have exploited the vulnerability, click **Submit Instance**. The factory contract validates your exploit on-chain. If successful, the level is marked complete.

---

## Levels

| Level | Name | Difficulty | Vulnerability |
|-------|------|------------|---------------|
| 1 | Instance | Easy | Public storage visibility |
| 2 | Fallback | Medium | Fallback function exploit |
| 3 | Reentrance | Hard | Reentrancy attack |
| 4 | CoinFlip | Medium | Predictable randomness |
| 5 | King | Medium | Denial of service |
| 6 | Vault | Easy | Private storage myth |

---

## Console Commands

When you have an active instance, these utilities are available in the browser console:

| Command | Description |
|---------|-------------|
| `help()` | Display all available commands |
| `contract` | The contract instance object |
| `player` | Your wallet address |
| `getBalance()` | Get contract balance |
| `getBalance(address)` | Get balance of any address |

Level-specific methods are available on the `contract` object. Use `help()` to see them.

---

## Local Development

### Frontend

```bash
cd app
npm install
npm run dev
```

### Contracts

Contracts are written in ink! and deployed using pop-cli.

```bash
# Build all contracts
cargo contract build --release

# Deploy using pop-cli
pop up contract --suri //Alice
```

---

## Deployed Contracts (Paseo Asset Hub)

| Contract | Address |
|----------|---------|
| Statistics | `0x40c68bb385e9AD1d19D1FA5ABc86BE0f1464099b` |
| Instance Factory | `0x9ae57Cf7f28651FB3AB5d86524D0049362D29C8E` |
| Fallback Factory | `0x93fF27d4d3ad03D3aa596b75dEdb9c94a94D1F13` |
| Reentrance Factory | `0x165e19c3D5b9Cf24395AF1E2286c73410F3be712` |
| CoinFlip Factory | `0x8fde0C3f9c11bee2F66F0E82415834fe67f25aAa` |
| King Factory | `0x5b5c27597917857d2869f2ffe61F8606DBe4a5db` |
| Vault Factory | `0x14279D8C03c9feAaFe36229a634505EF231c4476` |

---

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Blockchain:** Polkadot SDK, ink! smart contracts
- **Network:** Paseo Asset Hub testnet
- **Wallet:** @polkadot/extension-dapp

---

## License

MIT

---

## Links

- [ink! Documentation](https://use.ink/)
- [Paseo Testnet Faucet](https://faucet.polkadot.io/)
- [Paseo Asset Hub Explorer](https://passet-hub.subscan.io/)
