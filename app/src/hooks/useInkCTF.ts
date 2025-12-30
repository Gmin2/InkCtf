import { useState, useCallback } from 'react';
import { useWallet } from '../lib/polkadot-provider';
import { CONTRACTS, SELECTORS, CHAINS, ACTIVE_CHAIN, type LevelId } from '../lib/chain-config';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { decodeAddress } from '@polkadot/keyring';
import { hexToU8a, u8aToHex } from '@polkadot/util';

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

// Hook return type
interface UseInkCTFReturn {
  // State
  api: ApiPromise | null;
  isReady: boolean;
  isLoading: boolean;
  txStatus: TxStatus;
  consoleMessages: ConsoleMessage[];
  currentInstance: LevelInstance | null;

  // Actions
  connect: () => Promise<void>;
  createLevelInstance: (levelId: LevelId) => Promise<string | null>;
  submitLevelInstance: (levelId: LevelId, instanceAddress: string) => Promise<boolean>;
  callContract: (address: string, selector: string, args?: Uint8Array, value?: bigint) => Promise<any>;
  queryContract: (address: string, selector: string, args?: Uint8Array) => Promise<Uint8Array | null>;
  addConsoleMessage: (type: ConsoleMessage['type'], message: string, txHash?: string) => void;
  clearConsole: () => void;
  setCurrentInstance: (instance: LevelInstance | null) => void;
}

export function useInkCTF(): UseInkCTFReturn {
  const { selectedAccount } = useWallet();
  const [api, setApi] = useState<ApiPromise | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [txStatus, setTxStatus] = useState<TxStatus>({ type: 'idle' });
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([]);
  const [currentInstance, setCurrentInstance] = useState<LevelInstance | null>(null);

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
      addConsoleMessage('info', `Player: ${selectedAccount.address} (${playerBytes.length} bytes)`);
      addConsoleMessage('info', `Selector: ${SELECTORS.createInstance}`);

      const result = await callContract(
        factoryAddress,
        SELECTORS.createInstance,
        playerBytes
      );

      // Parse instance address from events
      // Debug: log all events
      console.log('Transaction events:', result.events.map(({ event }: any) =>
        `${event.section}.${event.method}: ${JSON.stringify(event.data.toHuman())}`
      ));

      // Look for Revive.Instantiated, Contracts.Instantiated, or System.NewAccount event
      const instantiatedEvent = result.events.find(
        ({ event }: any) =>
          (event.section === 'revive' && event.method === 'Instantiated') ||
          (event.section === 'contracts' && event.method === 'Instantiated')
      );

      let instanceAddress: string | null = null;

      if (instantiatedEvent) {
        // Revive/Contracts uses 'contract' field
        instanceAddress = (instantiatedEvent.event.data as any).contract?.toString()
          || (instantiatedEvent.event.data as any)[1]?.toString(); // fallback to positional
        console.log('Found Instantiated event, address:', instanceAddress);
      } else {
        // Fallback: look for System.NewAccount event (new contract account)
        const newAccountEvent = result.events.find(
          ({ event }: any) => event.section === 'system' && event.method === 'NewAccount'
        );
        if (newAccountEvent) {
          console.log('Found NewAccount event:', newAccountEvent.event.data.toHuman());
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

      // No new instance event found - might be duplicate or events not emitted for cross-contract calls
      // Check if transaction used minimal gas (likely duplicate/no-op)
      const successEvent = result.events.find(
        ({ event }: any) => event.section === 'system' && event.method === 'ExtrinsicSuccess'
      );
      if (successEvent) {
        const dispatchInfo = (successEvent.event.data as any).dispatchInfo || (successEvent.event.data as any)[0];
        const refTime = dispatchInfo?.weight?.refTime?.toString().replace(/,/g, '') || '0';
        const gasUsed = BigInt(refTime);

        // If gas used is low (< 1.5B), likely the instance already exists
        if (gasUsed < 1_500_000_000n) {
          addConsoleMessage('warning', 'Instance may already exist for this player (low gas usage detected)');
          addConsoleMessage('info', 'Try with a fresh node or different player address');
        } else {
          addConsoleMessage('warning', 'Instance created but address not found in events');
          addConsoleMessage('info', 'Check browser console for event details');
        }
      }
      setIsLoading(false);
      return null;
    } catch (error) {
      addConsoleMessage('error', `Failed to create instance: ${error}`);
      setIsLoading(false);
      return null;
    }
  }, [api, selectedAccount, callContract, addConsoleMessage]);

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
    connect,
    createLevelInstance,
    submitLevelInstance,
    callContract,
    queryContract,
    addConsoleMessage,
    clearConsole,
    setCurrentInstance,
  };
}
