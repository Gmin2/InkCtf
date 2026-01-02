/**
 * Console Utilities for ink!CTF
 * Inspired by Ethernaut's ^^ utilities
 * Provides a rich browser console experience for players
 */

import { ApiPromise } from '@polkadot/api';
import { formatBalance } from '@polkadot/util';
import { CHAINS, ACTIVE_CHAIN } from './chain-config';

// Extend window type (utilities only - contract types defined in contract-helper.ts)
declare global {
  interface Window {
    // Additional game state
    api: ApiPromise | null;
    level: string | null;

    // Utility functions
    getBalance: (address?: string) => Promise<string>;
    toUnit: (amount: number | string) => bigint;
    fromUnit: (amount: bigint | string) => string;
    getBlockNumber: () => Promise<number>;
  }
}

// Console styling
const styles = {
  title: 'color: #e6007a; font-size: 20px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);',
  header: 'color: #00d4aa; font-size: 14px; font-weight: bold;',
  info: 'color: #6366f1; font-size: 12px;',
  success: 'color: #22c55e; font-size: 12px; font-weight: bold;',
  warning: 'color: #eab308; font-size: 12px;',
  error: 'color: #ef4444; font-size: 12px; font-weight: bold;',
  code: 'color: #a855f7; font-family: monospace; font-size: 11px;',
  hint: 'color: #64748b; font-style: italic; font-size: 11px;',
};

// Custom console methods
export function setupConsoleUtils(api: ApiPromise | null) {
  window.api = api;

  // Greeting message
  console.log(
    '%c\n' +
    '    ╦╔╗╔╦╔═  ╔═╗╔╦╗╔═╗\n' +
    '    ║║║║╠╩╗  ║   ║ ╠╣ \n' +
    '    ╩╝╚╝╩ ╩  ╚═╝ ╩ ╚  \n',
    styles.title
  );

  console.log('%c Welcome to ink!CTF - The ink! Smart Contract CTF Game', styles.header);
  console.log('%c Type help() to see available commands', styles.info);
  console.log('');
}

// Help function
export function createHelpFunction() {
  return function help() {
    const chain = CHAINS[ACTIVE_CHAIN];

    console.log('%c╔══════════════════════════════════════════════════════════════╗', styles.header);
    console.log('%c║                    ink!CTF Console Help                       ║', styles.header);
    console.log('%c╠══════════════════════════════════════════════════════════════╣', styles.header);

    console.log('%c\n📍 Current Session:', styles.header);
    console.log('%c   Chain:    %s', styles.info, chain.name);
    console.log('%c   Player:   %s', styles.info, window.player || 'Not connected');
    console.log('%c   Instance: %s', styles.info, window.instance || 'None');
    console.log('%c   Level:    %s', styles.info, window.level || 'None');

    console.log('%c\n🎮 Game Objects:', styles.header);
    console.log('%c   player     %c- Your wallet address', styles.code, styles.hint);
    console.log('%c   instance   %c- Current level instance address', styles.code, styles.hint);
    console.log('%c   contract   %c- Contract helper with level methods', styles.code, styles.hint);
    console.log('%c   api        %c- Polkadot.js API instance', styles.code, styles.hint);

    console.log('%c\n🔧 Utility Functions:', styles.header);
    console.log('%c   help()                    %c- Show this help', styles.code, styles.hint);
    console.log('%c   await getBalance()        %c- Get your balance', styles.code, styles.hint);
    console.log('%c   await getBalance(addr)    %c- Get balance of address', styles.code, styles.hint);
    console.log('%c   toUnit(1)                 %c- Convert 1 token to smallest unit', styles.code, styles.hint);
    console.log('%c   fromUnit(1000000000000n)  %c- Convert smallest unit to token', styles.code, styles.hint);
    console.log('%c   await getBlockNumber()    %c- Get current block number', styles.code, styles.hint);

    console.log('%c\n📝 Level Commands (Instance Level):', styles.header);
    console.log('%c   await contract.authenticate("password")', styles.code);
    console.log('%c   // Call authenticate with a password guess', styles.hint);

    console.log('%c\n📝 Level Commands (Fallback Level):', styles.header);
    console.log('%c   await contract.contribute({ value: toUnit(0.001) })', styles.code);
    console.log('%c   await contract.withdraw()', styles.code);

    console.log('%c\n📝 Level Commands (Vault Level):', styles.header);
    console.log('%c   await contract.unlock("secret")', styles.code);

    console.log('%c\n📝 Level Commands (Coinflip Level):', styles.header);
    console.log('%c   await contract.flip(true)  // or flip(false)', styles.code);

    console.log('%c\n📝 Level Commands (King Level):', styles.header);
    console.log('%c   await contract.claimThrone({ value: toUnit(1) })', styles.code);

    console.log('%c\n📝 Level Commands (Reentrance Level):', styles.header);
    console.log('%c   await contract.donate("0x...", { value: toUnit(0.1) })', styles.code);
    console.log('%c   await contract.withdraw()', styles.code);

    console.log('%c\n💡 Tips:', styles.header);
    console.log('%c   - Read the contract source code carefully', styles.hint);
    console.log('%c   - Check for vulnerabilities in the logic', styles.hint);
    console.log('%c   - Use getBalance() to track contract balance', styles.hint);
    console.log('%c   - Submit your instance after solving to complete the level', styles.hint);

    console.log('%c\n╚══════════════════════════════════════════════════════════════╝\n', styles.header);
  };
}

// Get balance function
export function createGetBalanceFunction(api: ApiPromise | null) {
  return async function getBalance(address?: string): Promise<string> {
    if (!api) {
      console.log('%c Error: API not connected', styles.error);
      return '0';
    }

    const addr = address || window.player;
    if (!addr) {
      console.log('%c Error: No address provided and no player connected', styles.error);
      return '0';
    }

    try {
      const { data: { free } } = await api.query.system.account(addr) as any;
      const chain = CHAINS[ACTIVE_CHAIN];
      const formatted = formatBalance(free, {
        decimals: chain.decimals,
        withUnit: chain.symbol,
        withSi: true
      });

      console.log('%c Balance of %s: %s', styles.success,
        addr.slice(0, 10) + '...' + addr.slice(-6),
        formatted
      );

      return formatted;
    } catch (e) {
      console.log('%c Error getting balance: %s', styles.error, e);
      return '0';
    }
  };
}

// Convert to smallest unit (like toWei)
export function createToUnitFunction() {
  return function toUnit(amount: number | string): bigint {
    const chain = CHAINS[ACTIVE_CHAIN];
    const decimals = chain.decimals;
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    const result = BigInt(Math.floor(value * Math.pow(10, decimals)));

    console.log('%c %s %s = %s (smallest unit)', styles.info,
      amount, chain.symbol, result.toString()
    );

    return result;
  };
}

// Convert from smallest unit (like fromWei)
export function createFromUnitFunction() {
  return function fromUnit(amount: bigint | string): string {
    const chain = CHAINS[ACTIVE_CHAIN];
    const decimals = chain.decimals;
    const value = typeof amount === 'string' ? BigInt(amount) : amount;
    const result = Number(value) / Math.pow(10, decimals);

    console.log('%c %s (smallest unit) = %s %s', styles.info,
      value.toString(), result.toString(), chain.symbol
    );

    return `${result} ${chain.symbol}`;
  };
}

// Get block number
export function createGetBlockNumberFunction(api: ApiPromise | null) {
  return async function getBlockNumber(): Promise<number> {
    if (!api) {
      console.log('%c Error: API not connected', styles.error);
      return 0;
    }

    try {
      const header = await api.rpc.chain.getHeader();
      const blockNumber = header.number.toNumber();

      console.log('%c Current block: #%d', styles.info, blockNumber);

      return blockNumber;
    } catch (e) {
      console.log('%c Error getting block number: %s', styles.error, e);
      return 0;
    }
  };
}

// Initialize all console utilities
export function initializeConsoleUtils(api: ApiPromise | null) {
  setupConsoleUtils(api);

  window.help = createHelpFunction();
  window.getBalance = createGetBalanceFunction(api);
  window.toUnit = createToUnitFunction();
  window.fromUnit = createFromUnitFunction();
  window.getBlockNumber = createGetBlockNumberFunction(api);
}

// Victory message
export function showVictory(levelName: string) {
  console.log('%c\n' +
    '    ██╗   ██╗██╗ ██████╗████████╗ ██████╗ ██████╗ ██╗   ██╗██╗\n' +
    '    ██║   ██║██║██╔════╝╚══██╔══╝██╔═══██╗██╔══██╗╚██╗ ██╔╝██║\n' +
    '    ██║   ██║██║██║        ██║   ██║   ██║██████╔╝ ╚████╔╝ ██║\n' +
    '    ╚██╗ ██╔╝██║██║        ██║   ██║   ██║██╔══██╗  ╚██╔╝  ╚═╝\n' +
    '     ╚████╔╝ ██║╚██████╗   ██║   ╚██████╔╝██║  ██║   ██║   ██╗\n' +
    '      ╚═══╝  ╚═╝ ╚═════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝\n',
    'color: #22c55e; font-size: 12px; font-weight: bold;'
  );

  console.log('%c 🎉 Congratulations! You completed the %s level! 🎉',
    'color: #22c55e; font-size: 16px; font-weight: bold;',
    levelName
  );
  console.log('%c\n Click "Submit Instance" to record your victory and move to the next level.\n',
    styles.hint
  );
}

// Hint message
export function showHint(hint: string) {
  console.log('%c 💡 Hint: %s', styles.warning, hint);
}

// Error message
export function showError(message: string) {
  console.log('%c ❌ Error: %s', styles.error, message);
}

// Success message
export function showSuccess(message: string) {
  console.log('%c ✅ %s', styles.success, message);
}
