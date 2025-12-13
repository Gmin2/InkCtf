import React from 'react';
import type { Level } from './../types';
import { ICONS } from './../constants';

interface MissionViewProps {
  level: Level;
  onBack: () => void;
  onShowDocs: () => void;
  theme?: 'dark' | 'light';
}

export const MissionView: React.FC<MissionViewProps> = ({ level, onBack, onShowDocs, theme = 'dark' }) => {
  const isLight = theme === 'light';

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

              <p className={`text-md font-medium leading-relaxed mb-12 ${isLight ? 'text-zinc-600' : 'text-[var(--text-secondary)]'}`}>
                {level.description}
              </p>
              
              <div className="space-y-4">
                 <button 
                  onClick={onShowDocs} 
                  className={`w-full py-5 border text-[11px] font-black uppercase tracking-widest transition-all ${
                    isLight
                    ? 'bg-black text-white border-black hover:bg-zinc-800 shadow-md'
                    : 'bg-[var(--bg-void)] text-[var(--text-primary)] border-[var(--border-color)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-void)]'
                  }`}
                 >
                    Documentation Access
                 </button>
              </div>
           </div>
        </div>

        {/* Code Mirror */}
        <div className={`flex-1 border flex flex-col overflow-hidden shadow-sm ${
          isLight ? 'bg-white border-zinc-200' : 'border-[var(--border-color)] bg-black/80'
        }`}>
           <div className={`p-4 flex justify-between items-center border-b ${
             isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-[#121215] border-[var(--border-color)]'
           }`}>
              <span className={`text-[10px] mono uppercase tracking-[0.3em] font-bold ${isLight ? 'text-zinc-500' : 'text-[var(--text-secondary)]'}`}>
                Lib.rs // Target_Mirror
              </span>
           </div>
           <pre className={`flex-1 p-12 overflow-auto mono text-sm leading-relaxed custom-scrollbar ${
             isLight ? 'text-[#111827] bg-white' : 'text-indigo-300/80 bg-transparent'
           }`}>
              <code className={isLight ? 'opacity-100 font-medium' : ''}>{level.sourceCode}</code>
           </pre>
        </div>

        {/* Action Column */}
        <div className="w-[350px] flex flex-col gap-8">
           <button className={`h-44 border flex flex-col items-center justify-center group active:scale-95 transition-all shadow-lg bg-ink-pink border-ink-pink text-white hover:brightness-110 ${
             isLight ? 'shadow-[0_10px_30px_rgba(230,0,122,0.15)]' : 'shadow-[0_0_60px_rgba(230,0,122,0.1)]'
           }`}>
              <div className="transform group-hover:scale-110 transition-transform">
                <ICONS.Zap />
              </div>
              <span className="text-xl font-black uppercase tracking-widest mt-5">Execute_Pwn</span>
           </button>

           <div className={`flex-1 border p-8 flex flex-col ${
             isLight ? 'bg-white border-zinc-200' : 'border-[var(--border-color)] bg-[var(--card-bg)]'
           }`}>
              <span className={`text-[11px] mono uppercase font-black mb-6 tracking-widest border-b pb-4 ${
                isLight ? 'text-black border-zinc-100' : 'text-[var(--text-secondary)] border-[var(--border-color)]'
              }`}>
                Tactical_Relay
              </span>
              <div className={`flex-1 mono text-[11px] space-y-4 overflow-y-auto custom-scrollbar ${
                isLight ? 'text-zinc-600' : 'text-[var(--text-secondary)]'
              }`}>
                 <p className="text-ink-pink font-bold">{'>> INITIALIZING_SEQUENCE'}</p>
                 <p>{'>> MAPPING_RESOURCES...'}</p>
                 <p>{'>> READY_FOR_INJECTION_'}</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
