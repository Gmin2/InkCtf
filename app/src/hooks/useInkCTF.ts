import { useState, useCallback } from 'react';
import { useWallet } from '../lib/polkadot-provider';
import { CONTRACTS, SELECTORS, CHAINS, ACTIVE_CHAIN, type LevelId } from '../lib/chain-config';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { decodeAddress } from '@polkadot/keyring';
import { hexToU8a, u8aToHex } from '@polkadot/util';
import type { ErrorInfo } from '../components/ErrorDialog';

// Transaction status
export type TxStatus =
  | { type: 'idle' }
  | { type: 'signing' }
  | { type: 'broadcasting' }
  | { type: 'inBlock'; blockHash: string }
  | { type: 'finalized'; blockHash: string }
  | { type: 'error'; message: string };

// Level instance info
export interface LevelInstance {
  levelId: LevelId;
  instanceAddress: string;
  createdAt: number;
  completed: boolean;
}

// Console message for UI
export interface ConsoleMessage {
  id: string;
  type: 'info' | 'success' | 'error' | 'warning' | 'tx';
  message: string;
  timestamp: Date;
  txHash?: string;
}

// Parse blockchain errors into user-friendly messages
function parseChainError(errorMsg: string): ErrorInfo | null {
  const lower = errorMsg.toLowerCase();

  if (lower.includes('accountnotmapped') || lower.includes('account not mapped')) {
    return {
      title: 'Account Not Mapped',
      message: 'Your Substrate account has not been mapped to an Ethereum-style (H160) address on this chain. The Revive pallet requires this mapping before you can interact with contracts.',
      suggestion: 'Use the Polkadot.js Apps interface or the eth_map extrinsic to map your account. Visit the faucet link below to get testnet tokens first if needed.',
      links: [
        { label: 'Paseo Faucet', url: 'https://faucet.polkadot.io/passet-hub' },
        { label: 'Polkadot.js Apps', url: 'https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Ftestnet-passet-hub.polkadot.io#/extrinsics' },
      ],
    };
  }

  if (
    lower.includes('insufficientbalance') ||
    lower.includes('insufficient balance') ||
    lower.includes('fundsunavailable') ||
    lower.includes('funds unavailable') ||
    lower.includes('inability to pay') ||
    lower.includes('balance too low')
  ) {
    return {
      title: 'Insufficient Balance',
      message: 'Your account does not have enough tokens to pay for this transaction. On Paseo Asset Hub testnet, you need PAS tokens to cover gas fees and any value transfers.',
      suggestion: 'Get free testnet tokens from the Paseo faucet. Make sure to request tokens for the Asset Hub (not the relay chain).',
      links: [
        { label: 'Paseo Faucet', url: 'https://faucet.polkadot.io/passet-hub' },
      ],
    };
  }

  if (lower.includes('contractnotfound') || lower.includes('contract not found')) {
    return {
      title: 'Contract Not Found',
      message: 'The contract at the specified address could not be found on chain. It may not be deployed yet on this network.',
      suggestion: 'Make sure you are connected to the correct network (Paseo Asset Hub). If using a local node, ensure the contracts have been deployed.',
    };
  }

  if (lower.includes('cancelled') || lower.includes('rejected')) {
    return {
      title: 'Transaction Cancelled',
      message: 'The transaction was cancelled or rejected in your wallet extension.',
      suggestion: 'Try again and approve the transaction when your wallet prompts you.',
    };
  }

  return null;
}

// Hook return type
interface UseInkCTFReturn {
  // State
  api: ApiPromise | null;
  isReady: boolean;
  isLoading: boolean;
  txStatus: TxStatus;
  consoleMessages: ConsoleMessage[];
  currentInstance: LevelInstance | null;
  errorDialog: ErrorInfo | null;

  // Actions
  connect: () => Promise<void>;
  createLevelInstance: (levelId: LevelId) => Promise<string | null>;
  submitLevelInstance: (levelId: LevelId, instanceAddress: string) => Promise<boolean>;
  callContract: (address: string, selector: string, args?: Uint8Array, value?: bigint) => Promise<any>;
  queryContract: (address: string, selector: string, args?: Uint8Array) => Promise<Uint8Array | null>;
  addConsoleMessage: (type: ConsoleMessage['type'], message: string, txHash?: string) => void;
  clearConsole: () => void;
  setCurrentInstance: (instance: LevelInstance | null) => void;
  dismissError: () => void;
}

export function useInkCTF(): UseInkCTFReturn {
  const { selectedAccount } = useWallet();
  const [api, setApi] = useState<ApiPromise | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [txStatus, setTxStatus] = useState<TxStatus>({ type: 'idle' });
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([]);
  const [currentInstance, setCurrentInstance] = useState<LevelInstance | null>(null);
  const [errorDialog, setErrorDialog] = useState<ErrorInfo | null>(null);

  const dismissError = useCallback(() => setErrorDialog(null), []);

  // Add console message
  const addConsoleMessage = useCallback((
    type: ConsoleMessage['type'],
    message: string,
    txHash?: string
  ) => {
    const newMessage: ConsoleMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type,
      message,
      timestamp: new Date(),
      txHash,
    };
    setConsoleMessages(prev => [...prev, newMessage]);
  }, []);

  const clearConsole = useCallback(() => {
    setConsoleMessages([]);
  }, []);

  // Connect to chain
  const connect = useCallback(async () => {
    if (api) return;

    try {
      const chain = CHAINS[ACTIVE_CHAIN];
      addConsoleMessage('info', `Connecting to ${chain.name}...`);
      const provider = new WsProvider(chain.rpc);
      const newApi = await ApiPromise.create({ provider });
      await newApi.isReady;

      const chainInfo = await newApi.rpc.system.chain();
      addConsoleMessage('success', `Connected to ${chainInfo.toString()}`);

      // Check for revive pallet (newer EVM-compatible contracts)
      if (newApi.tx.revive) {
        addConsoleMessage('info', `Revive pallet: available`);
      } else if (newApi.tx.contracts) {
        addConsoleMessage('info', `Contracts pallet: available`);
      } else {
        const pallets = Object.keys(newApi.tx);
        addConsoleMessage('warning', `No contracts pallet found. Available: ${pallets.slice(0, 10).join(', ')}...`);
      }

      setApi(newApi);
    } catch (error) {
      addConsoleMessage('error', `Failed to connect: ${error}`);
    }
  }, [api, addConsoleMessage]);

  // Build contract call data
  const buildCallData = (selector: string, args: Uint8Array = new Uint8Array()): Uint8Array => {
    const selectorBytes = hexToU8a(selector);
    const data = new Uint8Array(selectorBytes.length + args.length);
    data.set(selectorBytes, 0);
    data.set(args, selectorBytes.length);
    return data;
  };

  // Query contract (dry run) - supports both Revive and Contracts pallets
  const queryContract = useCallback(async (
    address: string,
    selector: string,
    args: Uint8Array = new Uint8Array()
  ): Promise<Uint8Array | null> => {
    if (!api || !selectedAccount) return null;

    try {
      const data = buildCallData(selector, args);

      // Determine which API to use
      const useRevive = !!api.tx.revive;
      const contractsApi = useRevive ? (api.call as any).reviveApi : (api.call as any).contractsApi;

      if (!contractsApi) {
        console.error('No contracts API available');
        return null;
      }

      const result = await contractsApi.call(
        selectedAccount.address,
        address,
        0, // value
        null, // gasLimit
        null, // storageDepositLimit
        data
      );

      if ((result as any).result?.isOk) {
        return (result as any).result.asOk.data;
      }
      return null;
    } catch (error) {
      console.error('Query failed:', error);
      return null;
    }
  }, [api, selectedAccount]);

  // Call contract (submit transaction) - supports both Revive and Contracts pallets
  const callContract = useCallback(async (
    address: string,
    selector: string,
    args: Uint8Array = new Uint8Array(),
    value: bigint = 0n
  ): Promise<any> => {
    if (!api || !selectedAccount) {
      throw new Error('Not connected');
    }

    const data = buildCallData(selector, args);

    // Determine which pallet to use
    const useRevive = !!api.tx.revive;
    const pallet = useRevive ? api.tx.revive : api.tx.contracts;

    if (!pallet) {
      throw new Error('No contracts pallet available');
    }

    setTxStatus({ type: 'signing' });
    addConsoleMessage('info', `Calling ${address} with ${data.length} bytes of data`);
    addConsoleMessage('info', `Waiting for signature... (using ${useRevive ? 'Revive' : 'Contracts'} pallet)`);

    // Build the transaction - both pallets use WeightV2 structure
    // Use values similar to what pop CLI estimates
    const gasLimit = api.registry.createType('WeightV2', {
      refTime: 5_000_000_000n,    // 5 billion (pop uses ~2.5B actual)
      proofSize: 500_000n,         // 500K (pop uses ~64K actual)
    });

    // Storage deposit limit - enough for contract instantiation
    // Pop CLI used ~102mUNIT total, so 500mUNIT should be plenty
    const storageDepositLimit = 500_000_000_000n; // 500 mUNIT

    // Convert data to hex string for Bytes encoding
    const dataHex = u8aToHex(data);

    const tx = pallet.call(
      address,
      value,
      gasLimit,
      storageDepositLimit,
      dataHex
    );

    return new Promise((resolve, reject) => {
      tx.signAndSend(
          selectedAccount.address,
          { signer: selectedAccount.polkadotSigner },
          ({ status, events, txHash }: any) => {
            if (status.isReady) {
              setTxStatus({ type: 'broadcasting' });
              addConsoleMessage('tx', `Broadcasting transaction...`, txHash.toHex());
            }

            if (status.isInBlock) {
              setTxStatus({ type: 'inBlock', blockHash: status.asInBlock.toHex() });
              addConsoleMessage('info', `Included in block ${status.asInBlock.toHex()}`);
            }

            if (status.isFinalized) {
              setTxStatus({ type: 'finalized', blockHash: status.asFinalized.toHex() });

              // Check for errors
              const failed = events.find(({ event }: any) =>
                api.events.system.ExtrinsicFailed.is(event)
              );

              if (failed) {
                const error = (failed.event.data as any)[0];
                // Try to decode the error
                let errorMsg = error.toString();
                if (error.isModule) {
                  try {
                    const decoded = api.registry.findMetaError(error.asModule);
                    errorMsg = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
                  } catch {
                    // Keep original error if decoding fails
                  }
                }
                addConsoleMessage('error', `Transaction failed: ${errorMsg}`);
                const parsed = parseChainError(errorMsg);
                if (parsed) setErrorDialog(parsed);
                reject(new Error(errorMsg));
              } else {
                addConsoleMessage('success', `Transaction finalized!`);
                resolve({ events, txHash: txHash.toHex() });
              }
            }
          }
        )
        .catch((error: any) => {
          setTxStatus({ type: 'error', message: error.message });
          addConsoleMessage('error', `Transaction error: ${error.message}`);
          const parsed = parseChainError(error.message || String(error));
          if (parsed) setErrorDialog(parsed);
          reject(error);
        });
    });
  }, [api, selectedAccount, addConsoleMessage]);

  // Create level instance
  const createLevelInstance = useCallback(async (levelId: LevelId): Promise<string | null> => {
    if (!api) {
      addConsoleMessage('error', 'API not connected. Please wait for connection...');
      return null;
    }
    if (!selectedAccount) {
      addConsoleMessage('error', 'No account selected. Please connect wallet and select an account.');
      return null;
    }

    const factoryAddress = CONTRACTS.factories[levelId];
    if (!factoryAddress) {
      addConsoleMessage('error', `Unknown level: ${levelId}`);
      return null;
    }

    setIsLoading(true);
    addConsoleMessage('info', `Creating instance for level: ${levelId}`);
    addConsoleMessage('info', `Factory: ${factoryAddress}`);

    try {
      // Encode player address as argument (32-byte AccountId)
      const playerBytes = decodeAddress(selectedAccount.address);
      addConsoleMessage('info', `Player: ${selectedAccount.address}`);

      // Pre-flight dry-run to check if instance creation would succeed
      addConsoleMessage('info', 'Running dry-run check...');
      const dryRunResult = await queryContract(factoryAddress, SELECTORS.createInstance, playerBytes);

      if (!dryRunResult) {
        // Dry-run failed or reverted — instance likely already exists
        // The return data from create_instance is Result<AccountId, LevelError>
        // On revert, we can't get the address from the dry-run, but we know one exists
        addConsoleMessage('warning', 'Instance already exists for this player. Attempting to recover address...');

        // Try to recover: dry-run validate_instance with a dummy address to see if factory has data
        // Since the factory uses deterministic addressing (CREATE2 with player as salt),
        // we can try calling the factory's create_instance via RPC to get the would-be address
        // The RPC dry-run returns Ok even on revert, with flags — let's try the raw API
        try {
          const data = buildCallData(SELECTORS.createInstance, playerBytes);
          const useRevive = !!api.tx.revive;
          const contractsApi = useRevive ? (api.call as any).reviveApi : (api.call as any).contractsApi;

          if (contractsApi) {
            const rawResult = await contractsApi.call(
              selectedAccount.address,
              factoryAddress,
              0,
              null,
              null,
              data
            );

            // Even on revert, the RPC returns the result data with flags
            // Check if we can extract the return data
            const resultData = (rawResult as any).result;
            if (resultData?.isOk) {
              const okData = resultData.asOk;
              const flags = okData.flags?.toNumber?.() || okData.flags || 0;
              const returnData = okData.data;

              // Flag 1 = REVERT. If reverted but we have return data, try to decode the error
              if (flags & 1) {
                addConsoleMessage('error', 'Factory confirmed: an instance already exists for this player on this level.');
                addConsoleMessage('info', 'Enter your existing instance address in the field below, or use a different wallet.');
              } else if (returnData && returnData.length >= 33) {
                // Success in dry-run: Result::Ok(AccountId) = 0x00 + 32-byte AccountId
                if (returnData[0] === 0) {
                  const addrBytes = returnData.slice(1, 33);
                  // Last 20 bytes are the H160 address
                  const h160 = addrBytes.slice(12, 32);
                  const recoveredAddress = '0x' + Buffer.from(h160).toString('hex');
                  addConsoleMessage('success', `Recovered instance address: ${recoveredAddress}`);

                  setCurrentInstance({
                    levelId,
                    instanceAddress: recoveredAddress,
                    createdAt: Date.now(),
                    completed: false,
                  });
                  setIsLoading(false);
                  return recoveredAddress;
                }
              }
            }
          }
        } catch {
          // Raw API call failed, fall through to error message
        }

        addConsoleMessage('info', 'Could not recover the instance address automatically.');
        setIsLoading(false);
        return null;
      }

      // Dry-run succeeded — safe to submit the real transaction
      addConsoleMessage('info', 'Dry-run passed. Submitting transaction...');

      const result = await callContract(
        factoryAddress,
        SELECTORS.createInstance,
        playerBytes
      );

      // Parse instance address from events
      const instantiatedEvent = result.events.find(
        ({ event }: any) =>
          (event.section === 'revive' && event.method === 'Instantiated') ||
          (event.section === 'contracts' && event.method === 'Instantiated')
      );

      let instanceAddress: string | null = null;

      if (instantiatedEvent) {
        instanceAddress = (instantiatedEvent.event.data as any).contract?.toString()
          || (instantiatedEvent.event.data as any)[1]?.toString();
      } else {
        const newAccountEvent = result.events.find(
          ({ event }: any) => event.section === 'system' && event.method === 'NewAccount'
        );
        if (newAccountEvent) {
          instanceAddress = (newAccountEvent.event.data as any).account?.toString()
            || (newAccountEvent.event.data as any)[0]?.toString();
        }
      }

      if (instanceAddress) {
        addConsoleMessage('success', `Instance created at: ${instanceAddress}`);
        setCurrentInstance({
          levelId,
          instanceAddress,
          createdAt: Date.now(),
          completed: false,
        });
        setIsLoading(false);
        return instanceAddress;
      }

      addConsoleMessage('warning', 'Instance created but address not found in events');
      addConsoleMessage('info', 'Check browser console for event details');
      setIsLoading(false);
      return null;
    } catch (error) {
      const errorMsg = String(error);
      if (errorMsg.includes('ContractReverted')) {
        addConsoleMessage('error', 'An instance already exists for this level. The factory contract rejected a duplicate creation.');
        addConsoleMessage('info', 'Enter your existing instance address manually, or use a different wallet.');
      } else {
        addConsoleMessage('error', `Failed to create instance: ${error}`);
      }
      setIsLoading(false);
      return null;
    }
  }, [api, selectedAccount, callContract, queryContract, addConsoleMessage]);

  // Submit (validate) level instance
  const submitLevelInstance = useCallback(async (
    levelId: LevelId,
    instanceAddress: string
  ): Promise<boolean> => {
    if (!api || !selectedAccount) {
      addConsoleMessage('error', 'Please connect wallet first');
      return false;
    }

    const factoryAddress = CONTRACTS.factories[levelId];
    if (!factoryAddress) {
      addConsoleMessage('error', `Unknown level: ${levelId}`);
      return false;
    }

    setIsLoading(true);
    addConsoleMessage('info', `Validating instance for level: ${levelId}`);

    try {
      // Encode arguments: instance address + player address (both as 32-byte AccountId)
      const instanceBytes = decodeAddress(instanceAddress);
      const playerBytes = decodeAddress(selectedAccount.address);
      const args = new Uint8Array([...instanceBytes, ...playerBytes]);

      await callContract(
        factoryAddress,
        SELECTORS.validateInstance,
        args
      );

      addConsoleMessage('success', `Level ${levelId} completed! Congratulations!`);

      if (currentInstance?.instanceAddress === instanceAddress) {
        setCurrentInstance(prev => prev ? { ...prev, completed: true } : null);
      }

      setIsLoading(false);
      return true;
    } catch (error) {
      addConsoleMessage('error', `Validation failed: ${error}`);
      setIsLoading(false);
      return false;
    }
  }, [api, selectedAccount, currentInstance, callContract, addConsoleMessage]);

  return {
    api,
    isReady: !!api && !!selectedAccount,
    isLoading,
    txStatus,
    consoleMessages,
    currentInstance,
    errorDialog,
    connect,
    createLevelInstance,
    submitLevelInstance,
    callContract,
    queryContract,
    addConsoleMessage,
    clearConsole,
    setCurrentInstance,
    dismissError,
  };
}
