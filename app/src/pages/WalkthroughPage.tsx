import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { LEVELS, getDifficultyColor } from '../constants';

const walkthroughDocs = import.meta.glob('../gamedata/walkthroughs/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

interface WalkthroughPageProps {
  theme: 'dark' | 'light';
}

export const WalkthroughPage: FC<WalkthroughPageProps> = ({ theme }) => {
  const [selectedLevelId, setSelectedLevelId] = useState(LEVELS[0].id);
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);
  const navigate = useNavigate();
  const isLight = theme === 'light';

  useEffect(() => {
    setSpoilerRevealed(false);
  }, [selectedLevelId]);

  const selectedLevel = LEVELS.find(l => l.id === selectedLevelId)!;
  const levelIndex = LEVELS.findIndex(l => l.id === selectedLevelId);
  const content = walkthroughDocs[`../gamedata/walkthroughs/${selectedLevelId}.md`] || '# Walkthrough not found';

  return (
    <div className={`flex-1 flex flex-col p-12 overflow-hidden ${
      isLight ? 'bg-white' : 'bg-[var(--bg-void)]'
    }`}>
      {/* Header */}
      <div className={`flex justify-between items-center mb-12 border-b pb-8 ${
        isLight ? 'border-zinc-200' : 'border-[var(--border-color)]'
      }`}>
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className={`w-14 h-14 border flex items-center justify-center transition-all group ${
              isLight
                ? 'border-black bg-white text-black hover:bg-black hover:text-white'
                : 'border-[var(--border-color)] hover:bg-ink-pink hover:text-white text-[var(--text-primary)]'
            }`}
          >
            <span className="text-lg group-hover:scale-110 transition-transform">←</span>
          </Link>
          <div>
            <span className={`text-[10px] mono block tracking-[0.5em] mb-1 font-bold uppercase ${
              isLight ? 'text-zinc-400' : 'text-[var(--text-secondary)]'
            }`}>Classified_Intel_v.1</span>
            <h2 className={`text-3xl font-black uppercase tracking-tight ${
              isLight ? 'text-black' : 'text-[var(--text-primary)]'
            }`}>Walkthrough Archives</h2>
          </div>
        </div>
        <Link
          to="/docs"
          className={`px-4 py-2 border text-[10px] font-black uppercase tracking-wider transition-all ${
            isLight
              ? 'border-zinc-300 text-zinc-600 hover:text-black hover:border-black'
              : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:text-ink-pink hover:border-ink-pink'
          }`}
        >
          Security Docs →
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 flex gap-12 overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 space-y-3 overflow-y-auto">
          {LEVELS.map((level) => (
            <button
              key={level.id}
              onClick={() => setSelectedLevelId(level.id)}
              className={`w-full text-left p-5 border transition-all ${
                selectedLevelId === level.id
                  ? 'bg-ink-pink text-white border-ink-pink shadow-lg'
                  : `${isLight ? 'bg-zinc-50 border-zinc-200 text-black hover:border-black font-bold' : 'bg-[var(--card-bg)] border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-ink-pink/10'}`
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-widest">{level.title}</span>
                <span
                  className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm"
                  style={{
                    color: selectedLevelId === level.id ? 'white' : getDifficultyColor(level.difficulty),
                    backgroundColor: selectedLevelId === level.id
                      ? 'rgba(255,255,255,0.2)'
                      : `${getDifficultyColor(level.difficulty)}15`,
                  }}
                >
                  {level.difficulty}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto pr-8 custom-scrollbar">
          {/* Level meta bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <span
                className="text-[10px] font-black uppercase tracking-wider px-3 py-1"
                style={{
                  color: getDifficultyColor(selectedLevel.difficulty),
                  backgroundColor: `${getDifficultyColor(selectedLevel.difficulty)}15`,
                }}
              >
                {selectedLevel.difficulty}
              </span>
              {selectedLevel.skills?.map(skill => (
                <span
                  key={skill}
                  className={`text-[10px] uppercase tracking-wider px-2 py-1 border ${
                    isLight ? 'border-zinc-200 text-zinc-500' : 'border-[var(--border-color)] text-[var(--text-secondary)]'
                  }`}
                >
                  {skill}
                </span>
              ))}
            </div>
            <button
              onClick={() => navigate(`/level/${levelIndex + 1}`)}
              className="px-4 py-2 bg-ink-pink text-white text-[10px] font-black uppercase tracking-wider hover:brightness-110 transition-all"
            >
              Play {selectedLevel.title} →
            </button>
          </div>

          {/* Spoiler gate */}
          {!spoilerRevealed && (
            <div className={`p-6 border text-center mb-6 ${
              isLight
                ? 'bg-amber-50 border-amber-300'
                : 'bg-amber-500/10 border-amber-500/30'
            }`}>
              <span className={`text-[11px] font-black uppercase tracking-widest block mb-3 ${
                isLight ? 'text-amber-700' : 'text-amber-400'
              }`}>
                Spoiler Warning
              </span>
              <p className={`text-sm mb-5 ${
                isLight ? 'text-amber-900' : 'text-amber-200'
              }`}>
                This walkthrough reveals the full solution for the <strong>{selectedLevel.title}</strong> level.
                Try solving it yourself first!
              </p>
              <button
                onClick={() => setSpoilerRevealed(true)}
                className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                  isLight
                    ? 'bg-amber-600 text-white hover:bg-amber-700'
                    : 'bg-amber-500 text-black hover:bg-amber-400'
                }`}
              >
                Reveal Walkthrough
              </button>
            </div>
          )}

          {/* Markdown content */}
          <div className={`transition-all duration-300 ${!spoilerRevealed ? 'blur-md select-none pointer-events-none' : ''}`}>
              <Markdown
                rehypePlugins={[rehypeRaw]}
                components={{
                  h1: ({ children }) => (
                    <h1 className={`text-3xl font-black uppercase tracking-tighter mb-6 ${
                      isLight ? 'text-black' : 'text-[var(--text-primary)]'
                    }`}>{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className={`text-xl font-black uppercase tracking-tight mt-10 mb-4 pb-2 border-b ${
                      isLight ? 'text-black border-zinc-200' : 'text-ink-pink border-[var(--border-color)]'
                    }`}>{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className={`text-lg font-bold mt-6 mb-3 ${
                      isLight ? 'text-black' : 'text-[var(--text-primary)]'
                    }`}>{children}</h3>
                  ),
                  p: ({ children }) => (
                    <p className={`text-sm leading-relaxed mb-4 ${
                      isLight ? 'text-zinc-700' : 'text-[var(--text-secondary)]'
                    }`}>{children}</p>
                  ),
                  strong: ({ children }) => (
                    <strong className={`font-bold ${
                      isLight ? 'text-black' : 'text-[var(--text-primary)]'
                    }`}>{children}</strong>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className={`border-l-4 pl-4 my-4 py-3 pr-3 ${
                      isLight ? 'border-ink-pink bg-pink-50' : 'border-ink-pink bg-ink-pink/5'
                    }`}>
                      {children}
                    </blockquote>
                  ),
                  ul: ({ children }) => (
                    <ul className={`list-disc list-inside space-y-1 mb-4 text-sm ${
                      isLight ? 'text-zinc-700' : 'text-[var(--text-secondary)]'
                    }`}>{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className={`list-decimal list-inside space-y-1 mb-4 text-sm ${
                      isLight ? 'text-zinc-700' : 'text-[var(--text-secondary)]'
                    }`}>{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-relaxed">{children}</li>
                  ),
                  hr: () => (
                    <hr className={`my-8 border-t ${
                      isLight ? 'border-zinc-200' : 'border-[var(--border-color)]'
                    }`} />
                  ),
                  code: ({ className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match;
                    if (isInline) {
                      return (
                        <code className={`px-1.5 py-0.5 rounded text-xs font-mono ${
                          isLight ? 'bg-pink-100 text-pink-700' : 'bg-ink-pink/10 text-ink-pink'
                        }`} {...props}>{children}</code>
                      );
                    }
                    return (
                      <SyntaxHighlighter
                        language={match[1]}
                        style={isLight ? oneLight : oneDark}
                        customStyle={{
                          margin: '0 0 1rem 0',
                          padding: '1.25rem',
                          fontSize: '0.75rem',
                          borderRadius: '2px',
                          background: isLight ? '#FAFAFA' : '#1a1a1f',
                          border: isLight ? '1px solid #E5E7EB' : '1px solid rgba(255,255,255,0.1)',
                        }}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    );
                  },
                  pre: ({ children }) => <>{children}</>,
                  details: ({ children }) => (
                    <details className={`my-4 p-4 border rounded-sm ${
                      isLight ? 'bg-amber-50 border-amber-200' : 'bg-amber-500/5 border-amber-500/20'
                    }`}>
                      {children}
                    </details>
                  ),
                  summary: ({ children }) => (
                    <summary className={`cursor-pointer font-bold text-sm ${
                      isLight ? 'text-amber-700' : 'text-amber-400'
                    }`}>{children}</summary>
                  ),
                }}
              >
                {content}
              </Markdown>
            </div>
        </div>
      </div>
    </div>
  );
};
