import React from 'react';
import { Link } from 'react-router-dom';
import { Difficulty } from './../types';
import type { Level } from './../types';
import { ICONS } from './../constants';

interface MissionNodeProps {
  level: Level;
  index: number;
  isLocked: boolean;
  isCompleted?: boolean;
  linkTo?: string;
  onSelect?: (l: Level) => void;
}

export const MissionNode: React.FC<MissionNodeProps> = ({ level, index, isLocked, isCompleted = false, linkTo, onSelect }) => {
  const borderClasses = `border-b border-[var(--border-color)] ${index % 3 !== 2 ? 'md:border-r' : ''}`;

  const handleClick = () => {
    if (!isLocked && onSelect) {
      onSelect(level);
    }
  };

  const content = (
      <div className={`h-full bg-[var(--card-bg)] p-10 ${!isLocked && 'hover:bg-ink-pink/[0.03]'} transition-all relative overflow-hidden`}>
        {!isLocked && (
          <div className="absolute -inset-1 bg-ink-pink/0 group-hover:bg-ink-pink/5 transition-colors pointer-events-none"></div>
        )}

        <div className="flex justify-between items-start mb-12 relative z-10">
          <div className={`w-12 h-12 flex items-center justify-center border text-ink-pink bg-[var(--bg-void)] ${
            isCompleted ? 'border-green-500' : 'border-[var(--border-color)]'
          }`}>
            {isLocked ? <ICONS.Lock /> : isCompleted ? <ICONS.CheckCircle /> : <ICONS.Code />}
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[9px] mono text-[var(--text-secondary)] font-bold uppercase tracking-[0.3em]">SEC_ID // 0{level.id}</span>
            {isCompleted && (
              <span className="text-[9px] font-black uppercase tracking-wider text-green-500">Cleared</span>
            )}
          </div>
        </div>
        
        <h3 className="text-3xl font-black uppercase tracking-tight text-[var(--text-primary)] mb-6 leading-none group-hover:text-ink-pink transition-colors relative z-10">
          {level.title}
        </h3>
        
        <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed mb-12 line-clamp-3 relative z-10">
          {level.description}
        </p>

        <div className="flex items-center justify-between border-t border-[var(--border-color)] pt-8 relative z-10">
           <div className="flex flex-col">
             <span className="text-[8px] mono text-[var(--text-secondary)] uppercase tracking-widest mb-1 font-bold">Threat_Level</span>
             <div className={`text-[10px] font-black uppercase tracking-widest ${
               level.difficulty === Difficulty.EASY ? 'text-green-500' : 
               level.difficulty === Difficulty.MEDIUM ? 'text-yellow-500' : 
               'text-red-500'
             }`}>
               {level.difficulty}
             </div>
           </div>
           {!isLocked && (
             <div className="w-10 h-10 rounded-full border border-[var(--border-color)] flex items-center justify-center group-hover:border-ink-pink transition-colors">
               <span className="text-xs group-hover:translate-x-1 transition-transform">→</span>
             </div>
           )}
        </div>
      </div>
  );

  // If linkTo is provided, wrap in Link, otherwise use div with onClick
  if (linkTo && !isLocked) {
    return (
      <Link
        to={linkTo}
        className={`relative group h-full transition-all duration-300 block ${borderClasses}`}
      >
        {content}
      </Link>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={`relative group h-full transition-all duration-300 ${isLocked ? 'opacity-30 grayscale cursor-not-allowed' : 'cursor-pointer'} ${borderClasses}`}
    >
      {content}
    </div>
  );
};
