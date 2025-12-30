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

export interface PlayerProgress {
  completedLevels: Record<LevelId, LevelProgress>;
  lastPlayedLevel: LevelId | null;
  totalCompleted: number;
  firstCompletedAt: number | null;
  lastCompletedAt: number | null;
}

const defaultProgress: PlayerProgress = {
  completedLevels: {} as Record<LevelId, LevelProgress>,
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
        const parsed = JSON.parse(stored) as PlayerProgress;
        setProgress(parsed);
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
  };
}
