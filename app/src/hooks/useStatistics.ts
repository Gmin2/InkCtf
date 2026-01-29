import { useState, useEffect, useCallback } from 'react';
import { useInkCTF } from './useInkCTF';
import { useWallet } from '../lib/polkadot-provider';
import { CONTRACTS, SELECTORS, type LevelId } from '../lib/chain-config';
import { hexToU8a } from '@polkadot/util';
import { decodeAddress } from '@polkadot/keyring';
import type { PlayerLevelStats, GlobalLevelStats, StatisticsData } from '../types/statistics';

const LEVEL_IDS: LevelId[] = ['instance', 'fallback', 'reentrance', 'coinflip', 'king', 'vault'];

interface UseStatisticsReturn {
  data: StatisticsData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Decode u32 from SCALE-encoded response (little-endian)
// Response format: Result<u32, LangError> = 0x00 (Ok variant) + 4 bytes u32
function decodeU32Result(bytes: Uint8Array): number {
  if (!bytes || bytes.length < 5) return 0;
  // First byte is Result variant (0 = Ok, 1 = Err)
  if (bytes[0] !== 0) return 0;
  // Next 4 bytes are the u32 value (little-endian)
  const view = new DataView(bytes.buffer, bytes.byteOffset + 1, 4);
  return view.getUint32(0, true);
}

// Decode Vec<Address> length from SCALE-encoded response
// Response format: Result<Vec<H160>, LangError> = 0x00 + compact length + addresses
function decodeVecLength(bytes: Uint8Array): number {
  if (!bytes || bytes.length < 2) return 0;
  // First byte is Result variant
  if (bytes[0] !== 0) return 0;
  // Second byte is compact-encoded length (for small arrays, it's just the length * 4)
  // SCALE compact encoding: if < 64, it's (length << 2)
  const compactByte = bytes[1];
  return compactByte >> 2;
}

// Convert H160 address string to 20-byte Uint8Array
function h160ToBytes(address: string): Uint8Array {
  // Remove 0x prefix if present and convert
  const hex = address.startsWith('0x') ? address.slice(2) : address;
  return hexToU8a('0x' + hex.padStart(40, '0'));
}

// Convert SS58 address to H160 bytes (last 20 bytes of 32-byte AccountId)
function ss58ToH160Bytes(ss58Address: string): Uint8Array {
  try {
    const accountBytes = decodeAddress(ss58Address);
    // H160 is stored in the last 20 bytes (first 12 are zero-padding)
    return accountBytes.slice(12, 32);
  } catch {
    // If already H160 format, just convert
    return h160ToBytes(ss58Address);
  }
}

export function useStatistics(): UseStatisticsReturn {
  const { api, queryContract, connect } = useInkCTF();
  const { selectedAccount } = useWallet();
  const [data, setData] = useState<StatisticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!api || !CONTRACTS.statistics) {
      setError('Statistics contract not available');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const playerStats: PlayerLevelStats[] = [];
      const globalStats: GlobalLevelStats[] = [];

      // Fetch stats for each level in parallel
      const levelPromises = LEVEL_IDS.map(async (levelId) => {
        const factoryAddress = CONTRACTS.factories[levelId];
        if (!factoryAddress) return { levelId, player: null, global: null };

        // Factory address is already H160 format
        const factoryBytes = h160ToBytes(factoryAddress);

        // Fetch global stats (total instances for this level)
        const globalResult = await queryContract(
          CONTRACTS.statistics,
          SELECTORS.getTotalInstances,
          factoryBytes
        );
        const totalInstances = globalResult ? decodeU32Result(globalResult) : 0;

        // Fetch player stats if wallet connected
        let successCount = 0;
        let failureCount = 0;
        let instanceCount = 0;

        if (selectedAccount) {
          // Convert SS58 address to H160 bytes (last 20 bytes of AccountId)
          const playerBytes = ss58ToH160Bytes(selectedAccount.address);

          // Encode args: player (20 bytes) + level (20 bytes)
          const args = new Uint8Array([...playerBytes, ...factoryBytes]);

          const [successResult, failureResult, instancesResult] = await Promise.all([
            queryContract(CONTRACTS.statistics, SELECTORS.getSuccessCount, args),
            queryContract(CONTRACTS.statistics, SELECTORS.getFailureCount, args),
            queryContract(CONTRACTS.statistics, SELECTORS.getPlayerInstances, args),
          ]);

          successCount = successResult ? decodeU32Result(successResult) : 0;
          failureCount = failureResult ? decodeU32Result(failureResult) : 0;
          instanceCount = instancesResult ? decodeVecLength(instancesResult) : 0;
        }

        return {
          levelId,
          player: { levelId, successCount, failureCount, instanceCount },
          global: { levelId, totalInstances },
        };
      });

      const results = await Promise.all(levelPromises);

      for (const result of results) {
        if (result.player) playerStats.push(result.player);
        if (result.global) globalStats.push(result.global);
      }

      setData({ playerStats, globalStats });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
    } finally {
      setIsLoading(false);
    }
  }, [api, selectedAccount, queryContract]);

  // Auto-connect and fetch on mount
  useEffect(() => {
    if (!api) {
      connect();
    }
  }, [api, connect]);

  // Fetch stats when API and account are ready
  useEffect(() => {
    if (api) {
      fetchStats();
    }
  }, [api, selectedAccount, fetchStats]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchStats,
  };
}
