/**
 * Contract Helper - Injected into window for browser console interaction
 * Players can interact with their level instance via:
 *   await contract.authenticate("password")
 *   await contract.getPassword()
 *   etc.
 */

import { ApiPromise } from '@polkadot/api';
import { hexToU8a, u8aToHex, stringToU8a } from '@polkadot/util';
import { decodeAddress } from '@polkadot/keyring';
import { SELECTORS } from './chain-config';

// Extend window type
declare global {
  interface Window {
    contract: ContractHelper | null;
    instance: string | null;
    player: string | null;
    help: () => void;
  }
}

export class ContractHelper {
  private api: ApiPromise;
  private h160Address: string;  // H160 format for Revive pallet
  private signer: any;
  private playerAddress: string;

  constructor(api: ApiPromise, address: string, signer: any, playerAddress: string) {
    this.api = api;
    this.h160Address = this.toH160(address);
    this.signer = signer;
    this.playerAddress = playerAddress;
  }

  // Convert SS58 address to H160 (20-byte) format
  // The H160 address is stored in the last 20 bytes of the 32-byte AccountId
  private toH160(address: string): string {
    // If already H160 format (0x + 40 hex chars)
    if (address.startsWith('0x') && address.length === 42) {
      return address;
    }

    // Decode SS58 to raw bytes
    try {
      const bytes = decodeAddress(address);
      // Extract last 20 bytes (H160 is padded with 12 zero bytes at start in AccountId)
      const h160Bytes = bytes.slice(12, 32);
      return u8aToHex(h160Bytes);
    } catch (e) {
      console.warn('Could not convert address to H160, using as-is:', address);
      return address;
    }
  }

  // Build call data from selector and args
  private buildCallData(selector: string, args: Uint8Array = new Uint8Array()): Uint8Array {
    const selectorBytes = hexToU8a(selector);
    const data = new Uint8Array(selectorBytes.length + args.length);
    data.set(selectorBytes, 0);
    data.set(args, selectorBytes.length);
    return data;
  }

  // Encode a string argument (SCALE: length-prefixed)
  private encodeString(str: string): Uint8Array {
    const bytes = stringToU8a(str);
    // SCALE compact encoding for length
    const len = bytes.length;
    if (len < 64) {
      // Single byte length prefix (len << 2)
      const result = new Uint8Array(1 + len);
      result[0] = len << 2;
      result.set(bytes, 1);
      return result;
    } else if (len < 16384) {
      // Two byte length prefix
      const result = new Uint8Array(2 + len);
      result[0] = ((len << 2) | 0x01) & 0xff;
      result[1] = (len >> 6) & 0xff;
      result.set(bytes, 2);
      return result;
    }
    throw new Error('String too long');
  }

  // Send a transaction to the contract
  private async sendTx(selector: string, args: Uint8Array = new Uint8Array(), value: bigint = 0n): Promise<any> {
    const data = this.buildCallData(selector, args);
    const dataHex = u8aToHex(data);

    const pallet = this.api.tx.revive || this.api.tx.contracts;
    if (!pallet) throw new Error('No contracts pallet available');

    const gasLimit = this.api.registry.createType('WeightV2', {
      refTime: 5_000_000_000n,
      proofSize: 500_000n,
    });
    const storageDepositLimit = 500_000_000_000n;

    return new Promise((resolve, reject) => {
      pallet.call(
        this.h160Address,
        value,
        gasLimit,
        storageDepositLimit,
        dataHex
      ).signAndSend(
        this.playerAddress,
        { signer: this.signer },
        ({ status, events }: any) => {
          if (status.isFinalized) {
            const failed = events.find(({ event }: any) =>
              this.api.events.system.ExtrinsicFailed.is(event)
            );
            if (failed) {
              reject(new Error('Transaction failed'));
            } else {
              resolve({ events, blockHash: status.asFinalized.toHex() });
            }
          }
        }
      ).catch(reject);
    });
  }

  // ===== Instance Level Methods =====

  /**
   * Authenticate with a password
   * Usage: await contract.authenticate("ethernaut0")
   */
  async authenticate(password: string): Promise<any> {
    const args = this.encodeString(password);
    return this.sendTx(SELECTORS.authenticate, args);
  }

  /**
   * Get the password (read-only, but contracts pallet doesn't have easy read)
   * Hint: Check the source code!
   */
  async getPassword(): Promise<string> {
    return 'Check the source code or contract storage!';
  }

  /**
   * Check if level is cleared
   */
  async getCleared(): Promise<boolean> {
    return false;
  }

  // ===== Fallback Level Methods =====

  /**
   * Contribute to the contract
   * Usage: await contract.contribute({ value: 1000000000000n })
   */
  async contribute(options?: { value?: bigint }): Promise<any> {
    const value = options?.value || 0n;
    return this.sendTx(SELECTORS.contribute, new Uint8Array(), value);
  }

  /**
   * Withdraw from the contract
   */
  async withdraw(): Promise<any> {
    return this.sendTx(SELECTORS.withdraw);
  }

  /**
   * Trigger the fallback function by sending value
   * Usage: await contract.fallback({ value: toUnit(0.0001) })
   */
  async fallback(options?: { value?: bigint }): Promise<any> {
    const value = options?.value || 0n;
    // Use the fallback selector to trigger the fallback function
    return this.sendTx(SELECTORS.fallback, new Uint8Array(), value);
  }

  // ===== Vault Level Methods =====

  /**
   * Unlock the vault
   * Usage: await contract.unlock("secret")
   */
  async unlock(password: string): Promise<any> {
    const args = this.encodeString(password);
    return this.sendTx(SELECTORS.unlock, args);
  }

  // ===== Coinflip Level Methods =====

  /**
   * Flip a coin
   * Usage: await contract.flip(true)
   */
  async flip(guess: boolean): Promise<any> {
    const args = new Uint8Array([guess ? 1 : 0]);
    return this.sendTx(SELECTORS.flip, args);
  }

  // ===== King Level Methods =====

  /**
   * Claim the throne
   * Usage: await contract.claimThrone({ value: 1000000000000n })
   */
  async claimThrone(options?: { value?: bigint }): Promise<any> {
    const value = options?.value || 0n;
    return this.sendTx(SELECTORS.claimThrone, new Uint8Array(), value);
  }

  // ===== Reentrance Level Methods =====

  /**
   * Donate to an address
   * Usage: await contract.donate("0x...", { value: 1000000000000n })
   */
  async donate(to: string, options?: { value?: bigint }): Promise<any> {
    // Encode the address (this is simplified - might need proper encoding)
    const args = hexToU8a(to.startsWith('0x') ? to : `0x${to}`);
    const value = options?.value || 0n;
    return this.sendTx(SELECTORS.donate, args, value);
  }
}

/**
 * Inject contract helper into window
 */
export function injectContractHelper(
  api: ApiPromise,
  instanceAddress: string,
  signer: any,
  playerAddress: string
): void {
  const helper = new ContractHelper(api, instanceAddress, signer, playerAddress);

  window.contract = helper;
  window.instance = instanceAddress;
  window.player = playerAddress;

  // Add help function
  window.help = () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                    ink!CTF Console Help                     ║
╠════════════════════════════════════════════════════════════╣
║  Instance: ${instanceAddress.slice(0, 20)}...
║  Player:   ${playerAddress.slice(0, 20)}...
╠════════════════════════════════════════════════════════════╣
║  Available commands:                                        ║
║                                                             ║
║  INSTANCE LEVEL:                                            ║
║    await contract.authenticate("password")                  ║
║                                                             ║
║  FALLBACK LEVEL:                                            ║
║    await contract.contribute({ value: 1000000000000n })     ║
║    await contract.withdraw()                                ║
║                                                             ║
║  VAULT LEVEL:                                               ║
║    await contract.unlock("secret")                          ║
║                                                             ║
║  COINFLIP LEVEL:                                            ║
║    await contract.flip(true)                                ║
║                                                             ║
║  KING LEVEL:                                                ║
║    await contract.claimThrone({ value: 1000000000000n })    ║
║                                                             ║
║  REENTRANCE LEVEL:                                          ║
║    await contract.donate("0x...", { value: 100n })          ║
║    await contract.withdraw()                                ║
╚════════════════════════════════════════════════════════════╝
    `);
  };

  console.log(`
╔════════════════════════════════════════════════════════════╗
║              ink!CTF - Contract Ready!                      ║
╠════════════════════════════════════════════════════════════╣
║  Your instance contract is available at:                    ║
║  > window.contract                                          ║
║  > window.instance (address)                                ║
║                                                             ║
║  Type help() for available commands                         ║
║                                                             ║
║  Example:                                                   ║
║  > await contract.authenticate("ethernaut0")                ║
╚════════════════════════════════════════════════════════════╝
  `);
}

/**
 * Clear contract helper from window
 */
export function clearContractHelper(): void {
  window.contract = null;
  window.instance = null;
  window.player = null;
}
