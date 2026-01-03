import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { InkSquink } from '../components/svgs/InkSquink';

interface NotFoundPageProps {
  theme: 'dark' | 'light';
}

export const NotFoundPage: FC<NotFoundPageProps> = ({ theme }) => {
  const isLight = theme === 'light';

  return (
    <div className="flex-1 flex items-center justify-center py-20">
      <div className="text-center max-w-2xl mx-auto px-8">
        {/* Glitchy 404 */}
        <div className="relative mb-8">
          <h1 className={`text-[180px] font-black leading-none tracking-tighter ${
            isLight ? 'text-zinc-200' : 'text-[var(--border-color)]'
          }`}>
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <InkSquink className="w-32 h-32 opacity-80" />
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-4 mb-12">
          <h2 className={`text-2xl font-black uppercase tracking-wider ${
            isLight ? 'text-black' : 'text-[var(--text-primary)]'
          }`}>
            <span className="text-ink-pink">//</span> SECTOR_NOT_FOUND
          </h2>
          <p className={`text-base leading-relaxed ${
            isLight ? 'text-zinc-600' : 'text-[var(--text-secondary)]'
          }`}>
            The coordinates you've entered lead to uncharted territory.
            This sector doesn't exist in our training database.
          </p>
        </div>

        {/* Terminal-style error */}
        <div className={`p-6 border text-left font-mono text-sm mb-12 ${
          isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-black/50 border-[var(--border-color)]'
        }`}>
          <div className={`mb-2 ${isLight ? 'text-red-600' : 'text-red-400'}`}>
            <span className="opacity-50">[ERROR]</span> Navigation failed
          </div>
          <div className={isLight ? 'text-zinc-600' : 'text-[var(--text-secondary)]'}>
            <span className="opacity-50">{'>'}</span> Requested path not found in sector map
          </div>
          <div className={isLight ? 'text-zinc-600' : 'text-[var(--text-secondary)]'}>
            <span className="opacity-50">{'>'}</span> Initiating return sequence...
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className={`px-10 py-4 border text-[11px] font-black uppercase tracking-[0.2em] transition-all ${
              isLight
                ? 'bg-black text-white border-black hover:bg-zinc-800'
                : 'bg-ink-pink text-white border-ink-pink hover:brightness-110'
            }`}
          >
            Return to Base
          </Link>
          <Link
            to="/docs"
            className={`px-10 py-4 border text-[11px] font-black uppercase tracking-[0.2em] transition-all ${
              isLight
                ? 'bg-white text-black border-black hover:bg-zinc-100'
                : 'bg-[var(--card-bg)] text-[var(--text-primary)] border-[var(--border-color)] hover:bg-[var(--border-color)]'
            }`}
          >
            View Documentation
          </Link>
        </div>

        {/* Coordinates */}
        <div className={`mt-12 text-[10px] mono uppercase tracking-[0.3em] ${
          isLight ? 'text-zinc-400' : 'text-[var(--text-secondary)]/50'
        }`}>
          Error Code: 0x404 | Sector: Unknown | Status: Lost in the void
        </div>
      </div>
    </div>
  );
};
