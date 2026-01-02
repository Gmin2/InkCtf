// Chain configuration
// Toggle between local and testnet by changing the active chain

export const CHAINS = {
  local: {
    id: 'local',
    name: 'Local ink! Node',
    rpc: 'ws://localhost:9944',
    explorer: '',
    symbol: 'UNIT',
    decimals: 12,
  },
  paseoPassetHub: {
    id: 'paseoPassetHub',
    name: 'Paseo Passet Hub',
    rpc: 'wss://testnet-passet-hub.polkadot.io',
    explorer: 'https://passet-hub.subscan.io',
    symbol: 'PAS',
    decimals: 10,
  },
} as const;

export type ChainId = keyof typeof CHAINS;

// Local node contract addresses
export const LOCAL_CONTRACTS = {
  inkSpector: '', // Not needed for basic testing
  statistics: '', // Not needed for basic testing
  factories: {
    instance: '0x1c29aa8b76b0dff94e79ca471fa13823cfd61fa3',
    fallback: '0xb113eb99f18da5f13a63b353d71b5b5050a3ec54',
    reentrance: '0xf2095f6aa01f329d113c0ef984fc11d1f9932cab',
    coinflip: '0x08fa8ed21b5dce51cf7d41b8998a3c3bc143a40c',
    king: '0xbd94eb5fdc31ef0e54dca45284fe779165ecaaed',
    vault: '0x03158c7213e2ae8b11f77d02ca15e6e6805b40d5',
  },
} as const;

// Testnet contract addresses (Paseo Asset Hub)
export const TESTNET_CONTRACTS = {
  inkSpector: '', // Not deployed yet
  statistics: '0x40c68bb385e9AD1d19D1FA5ABc86BE0f1464099b',
  factories: {
    instance: '0x9ae57Cf7f28651FB3AB5d86524D0049362D29C8E',
    fallback: '0x93fF27d4d3ad03D3aa596b75dEdb9c94a94D1F13',
    reentrance: '0x165e19c3D5b9Cf24395AF1E2286c73410F3be712',
    coinflip: '0x8fde0C3f9c11bee2F66F0E82415834fe67f25aAa',
    king: '0x5b5c27597917857d2869f2ffe61F8606DBe4a5db',
    vault: '0x14279D8C03c9feAaFe36229a634505EF231c4476',
  },
} as const;

// Active configuration - change this to switch networks
export const ACTIVE_CHAIN: ChainId = 'local';
export const CONTRACTS = ACTIVE_CHAIN === 'local' ? LOCAL_CONTRACTS : TESTNET_CONTRACTS;

export type LevelId = keyof typeof CONTRACTS.factories;

// ink! message selectors (from contract metadata)
// These are the 4-byte selectors for contract calls
export const SELECTORS = {
  // Level trait methods (factory)
  createInstance: '0x4e4ee919',   // Level::create_instance
  validateInstance: '0xedd31693', // Level::validate_instance

  // Instance level methods
  authenticate: '0x8f9f344d',
  getPassword: '0x4c1f767e',
  getCleared: '0x04fb0b65',

  // Fallback level methods
  contribute: '0x9b3544d0',
  fallback: '0xf95f89e5',
  withdraw: '0x410fcc9d',
  getOwner: '0x07fcd0b1',
  getContribution: '0xe79557bc',
  getBalance: '0xea817e65',

  // Reentrance level methods
  donate: '0x3a139bdc',
  balanceOf: '0x0f755a56',
  // withdraw uses same selector as fallback

  // Coinflip level methods
  flip: '0x633aa551',
  getConsecutiveWins: '0x5c16f0c4',
  getLastBlockNumber: '0x4308ae53',

  // King level methods
  claimThrone: '0x93339f8f',
  getKing: '0xdcd15bcd',
  getPrize: '0x2e06559a',

  // Vault level methods
  unlock: '0xaa9ea9de',
  isLocked: '0x78c8506b',
} as const;
