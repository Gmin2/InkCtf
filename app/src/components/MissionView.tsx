import React, { useEffect, useState } from 'react';
import type { Level } from './../types';
import { ICONS } from './../constants';
import { useWallet } from '../lib/polkadot-provider';
import { useInkCTF } from '../hooks/useInkCTF';
import { useProgress } from '../hooks/useProgress';
import { TacticalRelay } from './TacticalRelay';
import { LevelDocs } from './LevelDocs';
import { CodeViewer } from './CodeViewer';
import type { LevelId } from '../lib/chain-config';
import { injectContractHelper, clearContractHelper } from '../lib/contract-helper';
import { initializeConsoleUtils, showVictory } from '../lib/console-utils';

interface MissionViewProps {
  level: Level;
  onBack: () => void;
  onShowDocs: () => void;
  theme?: 'dark' | 'light';
}

export const MissionView: React.FC<MissionViewProps> = ({ level, onBack, onShowDocs, theme = 'dark' }) => {
  const isLight = theme === 'light';
  const { isConnected, selectedAccount } = useWallet();
  const {
    api,
    isReady,
    isLoading,
    consoleMessages,
    currentInstance,
    connect,
    createLevelInstance,
    submitLevelInstance,
    addConsoleMessage,
    clearConsole,
    setCurrentInstance,
  } = useInkCTF();
  const { markLevelCompleted, isLevelCompleted, setLastPlayedLevel } = useProgress();

  // Local state for instance address input (for manual entry if needed)
  const [instanceAddress, setInstanceAddress] = useState('');
  // State for level-specific docs modal
  const [showLevelDocs, setShowLevelDocs] = useState(false);

  // Connect to chain when component mounts
  useEffect(() => {
    if (isConnected && !isReady) {
      connect();
    }
  }, [isConnected, isReady, connect]);

  // Initialize console utilities when API is ready
  useEffect(() => {
    if (api && selectedAccount) {
      initializeConsoleUtils(api);
      window.player = selectedAccount.address;
      window.level = level.id;
    }
  }, [api, selectedAccount, level.id]);

  // Update instance address when currentInstance changes
  useEffect(() => {
    if (currentInstance?.instanceAddress) {
      setInstanceAddress(currentInstance.instanceAddress);
    }
  }, [currentInstance]);

  // Inject contract helper when instance is available
  useEffect(() => {
    if (api && currentInstance?.instanceAddress && selectedAccount) {
      injectContractHelper(
        api,
        currentInstance.instanceAddress,
        selectedAccount.polkadotSigner,
        selectedAccount.address
      );
      addConsoleMessage('info', 'Contract helper injected! Type help() in browser console');
    }

    // Cleanup on unmount or instance change
    return () => {
      clearContractHelper();
    };
  }, [api, currentInstance, selectedAccount, addConsoleMessage]);

  // Reset when level changes
  useEffect(() => {
    setCurrentInstance(null);
    setInstanceAddress('');
    clearContractHelper();
  }, [level.id, setCurrentInstance]);

  // Handle Get New Instance
  const handleGetInstance = async () => {
    if (!isConnected) {
      addConsoleMessage('error', 'Please connect your wallet first');
      return;
    }

    addConsoleMessage('info', `Requesting new instance for level: ${level.id}`);
    const address = await createLevelInstance(level.id as LevelId);
    if (address) {
      setInstanceAddress(address);
    }
  };

  // Track last played level
  useEffect(() => {
    setLastPlayedLevel(level.id as LevelId);
  }, [level.id, setLastPlayedLevel]);

  // Handle Submit Instance
  const handleSubmitInstance = async () => {
    if (!instanceAddress) {
      addConsoleMessage('error', 'No instance address. Get a new instance first.');
      return;
    }

    const success = await submitLevelInstance(level.id as LevelId, instanceAddress);
    if (success) {
      // Save progress to localStorage
      markLevelCompleted(level.id as LevelId, instanceAddress);

      showVictory(level.title);
      addConsoleMessage('success', '='.repeat(40));
      addConsoleMessage('success', `LEVEL ${level.title.toUpperCase()} COMPLETE!`);
      addConsoleMessage('success', '='.repeat(40));
    }
  };

  // Check if level is already completed
  const levelCompleted = isLevelCompleted(level.id as LevelId);

  return (
    <div className="flex-1 flex flex-col p-8 gap-8 animate-in fade-in duration-700">
      <nav className="flex justify-between items-center px-4">
        <button
          onClick={onBack}
          className={`group flex items-center gap-4 border px-8 py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-sm ${
            isLight
            ? 'bg-black text-white border-black hover:bg-zinc-800'
            : 'bg-[var(--card-bg)] text-[var(--text-primary)] border-[var(--border-color)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-void)]'
          }`}
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> BACK_TO_SECTOR
        </button>
        <div className="flex gap-6 items-center">
          {levelCompleted && (
            <span className="px-3 py-1 bg-green-500 text-white text-[10px] font-black uppercase tracking-wider rounded-full">
              Completed
            </span>
          )}
          <span className={`text-[11px] mono font-bold uppercase tracking-widest underline decoration-ink-pink decoration-2 underline-offset-8 ${isLight ? 'text-black' : 'text-[var(--text-secondary)]'}`}>
            Active_Session: {level.title}
          </span>
        </div>
      </nav>

      <div className="flex-1 flex gap-8 overflow-hidden min-h-[600px]">
        {/* Sidebar Info */}
        <div className="w-[420px] flex flex-col gap-8">
           <div className={`flex-1 border p-10 overflow-y-auto custom-scrollbar ${
             isLight ? 'bg-white border-zinc-200' : 'border-[var(--border-color)] bg-[var(--card-bg)]'
           }`}>
              <span className="text-[11px] mono text-ink-pink font-black block mb-4 tracking-widest uppercase">/ MISSION_BRIEF</span>
              <h2 className={`text-4xl font-black uppercase tracking-tighter mb-8 leading-none ${isLight ? 'text-black' : 'text-[var(--text-primary)]'}`}>
                {level.title}
              </h2>

              <div className={`p-6 border rounded-sm mb-8 ${
                isLight
                ? 'bg-ink-pink/5 border-ink-pink/10'
                : 'bg-black/60 border-[var(--border-color)]'
              }`}>
                 <span className={`text-[10px] mono block mb-2 uppercase tracking-widest font-bold ${isLight ? 'text-ink-pink' : 'text-[var(--text-secondary)]'}`}>
                   Primary Target
                 </span>
                 <p className={`text-sm font-bold leading-relaxed tracking-tight ${isLight ? 'text-black' : 'text-[var(--text-primary)]'}`}>
                   {level.objective}
                 </p>
              </div>

              <p className={`text-md font-medium leading-relaxed mb-8 ${isLight ? 'text-zinc-600' : 'text-[var(--text-secondary)]'}`}>
                {level.description}
              </p>

              {/* Instance Info */}
              {currentInstance && (
                <div className={`p-4 border rounded-sm mb-8 ${
                  isLight ? 'bg-green-50 border-green-200' : 'bg-green-900/20 border-green-700/30'
                }`}>
                  <span className={`text-[10px] mono block mb-2 uppercase tracking-widest font-bold ${isLight ? 'text-green-700' : 'text-green-400'}`}>
                    Your Instance
                  </span>
                  <p className={`text-xs font-mono break-all ${isLight ? 'text-green-900' : 'text-green-300'}`}>
                    {currentInstance.instanceAddress}
                  </p>
                  {currentInstance.completed && (
                    <span className="inline-block mt-2 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded">
                      COMPLETED
                    </span>
                  )}
                </div>
              )}

              <div className="space-y-4">
                 <button
                  onClick={() => setShowLevelDocs(true)}
                  className={`w-full py-5 border text-[11px] font-black uppercase tracking-widest transition-all ${
                    isLight
                    ? 'bg-black text-white border-black hover:bg-zinc-800 shadow-md'
                    : 'bg-[var(--bg-void)] text-[var(--text-primary)] border-[var(--border-color)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-void)]'
                  }`}
                 >
                    Level Intel
                 </button>
                 <button
                  onClick={onShowDocs}
                  className={`w-full py-3 border text-[10px] font-bold uppercase tracking-widest transition-all ${
                    isLight
                    ? 'bg-zinc-100 text-zinc-700 border-zinc-300 hover:bg-zinc-200'
                    : 'bg-[var(--card-bg)] text-[var(--text-secondary)] border-[var(--border-color)] hover:text-[var(--text-primary)]'
                  }`}
                 >
                    Platform Docs
                 </button>
              </div>
           </div>
        </div>

        {/* Code Mirror */}
        <div className={`flex-1 border flex flex-col overflow-hidden shadow-sm ${
          isLight ? 'bg-white border-zinc-200' : 'border-[var(--border-color)] bg-black/80'
        }`}>
           <div className={`px-4 py-3 flex justify-between items-center border-b ${
             isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-[#121215] border-[var(--border-color)]'
           }`}>
              <span className={`text-[10px] mono uppercase tracking-[0.3em] font-bold ${isLight ? 'text-zinc-500' : 'text-[var(--text-secondary)]'}`}>
                lib.rs // Target_Mirror
              </span>
              <span className={`text-[10px] mono uppercase tracking-[0.2em] ${isLight ? 'text-zinc-400' : 'text-[var(--text-secondary)]/50'}`}>
                {level.difficulty}
              </span>
           </div>
           <div className={`flex-1 overflow-auto custom-scrollbar ${
             isLight ? 'bg-white' : 'bg-transparent'
           }`}>
              <CodeViewer code={level.sourceCode} language="rust" theme={theme} />
           </div>
        </div>

        {/* Action Column */}
        <div className="w-[350px] flex flex-col gap-6">
           {/* Get Instance Button */}
           <button
             onClick={handleGetInstance}
             disabled={!isConnected || isLoading}
             className={`h-20 border flex flex-col items-center justify-center group transition-all ${
               !isConnected
                 ? `opacity-50 cursor-not-allowed ${isLight ? 'border-zinc-200 bg-zinc-50' : 'border-[var(--border-color)] bg-[var(--card-bg)]'}`
                 : isLoading
                   ? 'opacity-70 cursor-wait bg-blue-600 border-blue-600 text-white'
                   : `active:scale-95 shadow-md ${
                       isLight
                         ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
                         : 'bg-blue-600 border-blue-600 text-white hover:brightness-110'
                     }`
             }`}
           >
              <div className="flex items-center gap-2">
                {isLoading ? (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <ICONS.Code />
                )}
                <span className="text-sm font-black uppercase tracking-wider">
                  {isLoading ? 'Processing...' : 'Get_Instance'}
                </span>
              </div>
              {!isConnected && (
                <span className={`text-[9px] mt-1 ${isLight ? 'text-zinc-400' : 'opacity-60'}`}>Connect wallet first</span>
              )}
           </button>

           {/* Instance Address Input - for manual entry or showing current instance */}
           <div className={`border p-4 ${
             isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-[var(--card-bg)] border-[var(--border-color)]'
           }`}>
              <label className={`text-[10px] mono uppercase tracking-[0.2em] block mb-2 ${
                isLight ? 'text-zinc-500' : 'text-[var(--text-secondary)]'
              }`}>
                Instance Address
              </label>
              <input
                type="text"
                value={instanceAddress}
                onChange={(e) => setInstanceAddress(e.target.value)}
                placeholder="0x... or 5..."
                className={`w-full px-3 py-2 mono text-xs border rounded ${
                  isLight
                    ? 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400'
                    : 'bg-black/50 border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50'
                }`}
              />
              {instanceAddress && (
                <button
                  onClick={() => {
                    setCurrentInstance({
                      levelId: level.id as LevelId,
                      instanceAddress,
                      createdAt: Date.now(),
                      completed: false,
                    });
                    addConsoleMessage('info', `Using instance: ${instanceAddress}`);
                  }}
                  className={`mt-2 w-full text-[10px] py-1 uppercase tracking-wider ${
                    isLight
                      ? 'text-blue-600 hover:text-blue-800'
                      : 'text-blue-400 hover:text-blue-300'
                  }`}
                >
                  Use This Instance
                </button>
              )}
           </div>

           {/* Submit Instance Button */}
           <button
             onClick={handleSubmitInstance}
             disabled={!isConnected || isLoading || !instanceAddress}
             className={`h-20 border flex flex-col items-center justify-center group transition-all ${
               !isConnected || !instanceAddress
                 ? `opacity-50 cursor-not-allowed ${isLight ? 'border-zinc-200 bg-zinc-50' : 'border-[var(--border-color)] bg-[var(--card-bg)]'}`
                 : isLoading
                   ? 'opacity-70 cursor-wait bg-ink-pink border-ink-pink text-white'
                   : 'active:scale-95 shadow-md bg-ink-pink border-ink-pink text-white hover:brightness-110'
             }`}
           >
              <div className="flex items-center gap-2">
                <ICONS.Zap />
                <span className="text-sm font-black uppercase tracking-wider">Submit_Instance</span>
              </div>
              {!instanceAddress && (
                <span className={`text-[9px] mt-1 ${isLight ? 'text-zinc-400' : 'opacity-60'}`}>Get instance first</span>
              )}
           </button>

           {/* Tactical Relay Console */}
           <div className="flex-1 min-h-[200px]">
             <TacticalRelay
               messages={consoleMessages}
               onClear={clearConsole}
               theme={theme}
             />
           </div>
        </div>
      </div>

      {/* Level-specific documentation modal */}
      <LevelDocs
        level={level}
        isCompleted={currentInstance?.completed || levelCompleted}
        isOpen={showLevelDocs}
        onClose={() => setShowLevelDocs(false)}
        theme={theme}
      />
    </div>
  );
};
