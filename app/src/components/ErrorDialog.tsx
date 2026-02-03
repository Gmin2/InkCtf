import type { FC } from 'react';

export interface ErrorInfo {
  title: string;
  message: string;
  suggestion: string;
  links?: { label: string; url: string }[];
}

interface ErrorDialogProps {
  error: ErrorInfo | null;
  onDismiss: () => void;
  theme?: 'dark' | 'light';
}

export const ErrorDialog: FC<ErrorDialogProps> = ({ error, onDismiss, theme = 'dark' }) => {
  if (!error) return null;
  const isLight = theme === 'light';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onDismiss}
      />

      {/* Dialog */}
      <div className={`relative w-full max-w-md mx-4 rounded-lg shadow-2xl overflow-hidden border ${
        isLight ? 'bg-white border-red-200' : 'bg-[#121215] border-red-500/30'
      }`}>
        {/* Header */}
        <div className={`flex items-center gap-3 px-6 py-4 border-b ${
          isLight ? 'bg-red-50 border-red-100' : 'bg-red-950/30 border-red-500/20'
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            isLight ? 'bg-red-100 text-red-600' : 'bg-red-500/20 text-red-400'
          }`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h3 className={`text-sm font-black uppercase tracking-wider ${
            isLight ? 'text-red-800' : 'text-red-400'
          }`}>
            {error.title}
          </h3>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className={`text-sm leading-relaxed ${
            isLight ? 'text-zinc-700' : 'text-[var(--text-secondary)]'
          }`}>
            {error.message}
          </p>

          <div className={`p-4 rounded border ${
            isLight ? 'bg-amber-50 border-amber-200' : 'bg-amber-900/10 border-amber-700/30'
          }`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 ${
              isLight ? 'text-amber-700' : 'text-amber-400'
            }`}>
              How to fix
            </span>
            <p className={`text-sm leading-relaxed ${
              isLight ? 'text-amber-900' : 'text-amber-200/80'
            }`}>
              {error.suggestion}
            </p>
          </div>

          {error.links && error.links.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {error.links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-colors ${
                    isLight
                      ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                      : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30'
                  }`}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-3 border-t flex justify-end ${
          isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-black/30 border-[var(--border-color)]'
        }`}>
          <button
            onClick={onDismiss}
            className={`px-5 py-2 text-xs font-black uppercase tracking-wider rounded transition-colors ${
              isLight
                ? 'bg-zinc-900 text-white hover:bg-zinc-700'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
