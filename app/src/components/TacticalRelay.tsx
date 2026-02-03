import { useEffect, useRef } from 'react';
import type { ConsoleMessage } from '../hooks/useInkCTF';

interface TacticalRelayProps {
  messages: ConsoleMessage[];
  onClear?: () => void;
  theme?: 'dark' | 'light';
}

// Format timestamp - shorter format
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Truncate long messages
function truncateMessage(msg: string, maxLen: number = 50): string {
  if (msg.length <= maxLen) return msg;
  return `${msg.slice(0, maxLen)}...`;
}

// Message type colors - with light theme support
const getMessageStyle = (type: ConsoleMessage['type'], isLight: boolean) => {
  const styles = {
    info: {
      color: isLight ? 'text-blue-600' : 'text-blue-400',
      prefix: 'ℹ'
    },
    success: {
      color: isLight ? 'text-green-600' : 'text-green-400',
      prefix: '✓'
    },
    error: {
      color: isLight ? 'text-red-600' : 'text-red-400',
      prefix: '✗'
    },
    warning: {
      color: isLight ? 'text-amber-600' : 'text-yellow-400',
      prefix: '⚠'
    },
    tx: {
      color: isLight ? 'text-purple-600' : 'text-purple-400',
      prefix: '→'
    },
  };
  return styles[type];
};

export function TacticalRelay({ messages, onClear, theme = 'dark' }: TacticalRelayProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isLight = theme === 'light';

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className={`flex flex-col h-full rounded-lg border overflow-hidden ${
      isLight
        ? 'bg-zinc-50 border-zinc-200'
        : 'bg-black/40 border-[var(--border-color)]'
    }`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-3 py-1.5 border-b ${
        isLight
          ? 'bg-zinc-100 border-zinc-200'
          : 'bg-black/60 border-[var(--border-color)]'
      }`}>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500/80" />
            <div className="w-2 h-2 rounded-full bg-yellow-500/80" />
            <div className="w-2 h-2 rounded-full bg-green-500/80" />
          </div>
          <span className={`text-[10px] font-mono uppercase tracking-wider ${
            isLight ? 'text-zinc-500' : 'text-[var(--text-secondary)]'
          }`}>
            Tactical_Relay
          </span>
        </div>
        {onClear && messages.length > 0 && (
          <button
            onClick={onClear}
            className={`text-[10px] transition-colors ${
              isLight
                ? 'text-zinc-400 hover:text-zinc-600'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Clear
          </button>
        )}
      </div>

      {/* Console Output - Minimal */}
      <div
        ref={scrollRef}
        className={`flex-1 overflow-y-auto p-2 font-mono text-[11px] space-y-0.5 ${
          isLight ? 'bg-white' : 'bg-transparent'
        }`}
      >
        {messages.length === 0 ? (
          <div className={`text-center py-3 ${
            isLight ? 'text-zinc-400' : 'text-[var(--text-secondary)]/50'
          }`}>
            <p className="text-xs">// Awaiting transmission...</p>
            <p className="text-[10px] mt-1 opacity-70">Connect wallet to interact</p>
          </div>
        ) : (
          // Show only last 8 messages for minimal view
          messages.slice(-8).map((msg) => {
            const style = getMessageStyle(msg.type, isLight);
            return (
              <div key={msg.id} className="flex gap-1.5 leading-tight">
                <span className={`${isLight ? 'text-zinc-400' : 'text-[var(--text-secondary)]/40'} shrink-0`}>
                  {formatTime(msg.timestamp)}
                </span>
                <span className={`${style.color} shrink-0`}>{style.prefix}</span>
                <span className={`${msg.type === 'error' ? 'whitespace-pre-wrap break-all' : 'truncate'} ${isLight ? 'text-zinc-700' : 'text-[var(--text-primary)]/90'}`}>
                  {msg.type === 'error' ? msg.message : truncateMessage(msg.message, 40)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
