/**
 * Progress tracking hook for ink!CTF
 * Stores player progress in localStorage
 */

import { useState, useEffect, useCallback } from 'react';
import type { LevelId } from '../lib/chain-config';

const STORAGE_KEY = 'inkctf_progress';

export interface LevelProgress {
  levelId: LevelId;
  instanceAddress: string;
  completedAt: number;
  txHash?: string;
}

export interface ActiveInstance {
  levelId: LevelId;
  instanceAddress: string;
  walletAddress: string;
  createdAt: number;
}

export interface PlayerProgress {
  completedLevels: Record<LevelId, LevelProgress>;
  activeInstances: Record<string, ActiveInstance>; // key: `${walletAddress}_${levelId}`
  lastPlayedLevel: LevelId | null;
  totalCompleted: number;
  firstCompletedAt: number | null;
  lastCompletedAt: number | null;
}

const defaultProgress: PlayerProgress = {
  completedLevels: {} as Record<LevelId, LevelProgress>,
  activeInstances: {} as Record<string, ActiveInstance>,
  lastPlayedLevel: null,
  totalCompleted: 0,
  firstCompletedAt: null,
  lastCompletedAt: null,
};

export function useProgress() {
  const [progress, setProgress] = useState<PlayerProgress>(defaultProgress);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load progress from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Migrate old data that doesn't have activeInstances
        setProgress({
          ...defaultProgress,
          ...parsed,
          activeInstances: parsed.activeInstances || {},
        });
      }
    } catch (e) {
      console.warn('Failed to load progress from localStorage:', e);
    }
    setIsLoaded(true);
  }, []);

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      } catch (e) {
        console.warn('Failed to save progress to localStorage:', e);
      }
    }
  }, [progress, isLoaded]);

  // Mark a level as completed
  const markLevelCompleted = useCallback((
    levelId: LevelId,
    instanceAddress: string,
    txHash?: string
  ) => {
    setProgress(prev => {
      // Don't update if already completed
      if (prev.completedLevels[levelId]) {
        return prev;
      }

      const now = Date.now();
      const newLevelProgress: LevelProgress = {
        levelId,
        instanceAddress,
        completedAt: now,
        txHash,
      };

      return {
        ...prev,
        completedLevels: {
          ...prev.completedLevels,
          [levelId]: newLevelProgress,
        },
        lastPlayedLevel: levelId,
        totalCompleted: prev.totalCompleted + 1,
        firstCompletedAt: prev.firstCompletedAt || now,
        lastCompletedAt: now,
      };
    });
  }, []);

  // Check if a level is completed
  const isLevelCompleted = useCallback((levelId: LevelId): boolean => {
    return !!progress.completedLevels[levelId];
  }, [progress.completedLevels]);

  // Get progress for a specific level
  const getLevelProgress = useCallback((levelId: LevelId): LevelProgress | null => {
    return progress.completedLevels[levelId] || null;
  }, [progress.completedLevels]);

  // Set the last played level
  const setLastPlayedLevel = useCallback((levelId: LevelId) => {
    setProgress(prev => ({
      ...prev,
      lastPlayedLevel: levelId,
    }));
  }, []);

  // Reset all progress
  const resetProgress = useCallback(() => {
    setProgress(defaultProgress);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Get completion percentage
  const getCompletionPercentage = useCallback((totalLevels: number): number => {
    if (totalLevels === 0) return 0;
    return Math.round((progress.totalCompleted / totalLevels) * 100);
  }, [progress.totalCompleted]);

  // Get all completed level IDs
  const getCompletedLevelIds = useCallback((): LevelId[] => {
    return Object.keys(progress.completedLevels) as LevelId[];
  }, [progress.completedLevels]);

  // Save an active instance for a wallet + level combination
  const saveActiveInstance = useCallback((
    walletAddress: string,
    levelId: LevelId,
    instanceAddress: string
  ) => {
    const key = `${walletAddress}_${levelId}`;
    setProgress(prev => ({
      ...prev,
      activeInstances: {
        ...(prev.activeInstances || {}),
        [key]: {
          levelId,
          instanceAddress,
          walletAddress,
          createdAt: Date.now(),
        },
      },
    }));
  }, []);

  // Get active instance for a wallet + level combination
  const getActiveInstance = useCallback((
    walletAddress: string,
    levelId: LevelId
  ): ActiveInstance | null => {
    const key = `${walletAddress}_${levelId}`;
    return progress.activeInstances?.[key] || null;
  }, [progress.activeInstances]);

  // Clear active instance (e.g., when level is completed or user wants fresh start)
  const clearActiveInstance = useCallback((
    walletAddress: string,
    levelId: LevelId
  ) => {
    const key = `${walletAddress}_${levelId}`;
    setProgress(prev => {
      const { [key]: _, ...rest } = prev.activeInstances;
      return {
        ...prev,
        activeInstances: rest,
      };
    });
  }, []);

  return {
    progress,
    isLoaded,
    markLevelCompleted,
    isLevelCompleted,
    getLevelProgress,
    setLastPlayedLevel,
    resetProgress,
    getCompletionPercentage,
    getCompletedLevelIds,
    saveActiveInstance,
    getActiveInstance,
    clearActiveInstance,
  };
}
