import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Level } from '../types';

interface LevelDocsProps {
  level: Level;
  isCompleted?: boolean;
  isOpen: boolean;
  onClose: () => void;
  theme?: 'dark' | 'light';
}

// Import all markdown files at build time
const levelDocs = import.meta.glob('../gamedata/descriptions/*.md', {
  query: '?raw',
  import: 'default',
  eager: true
}) as Record<string, string>;

// Get doc content for a level
function getLevelDoc(levelId: string, isCompleted: boolean): string {
  const suffix = isCompleted ? '_complete' : '';
  const path = `../gamedata/descriptions/${levelId}${suffix}.md`;

  const content = levelDocs[path];
  if (content) return content;

  // Fallback to basic doc if completed version doesn't exist
  const fallbackPath = `../gamedata/descriptions/${levelId}.md`;
  return levelDocs[fallbackPath] || '# Documentation not found\n\nNo documentation available for this level.';
}

// Custom light theme for syntax highlighting
const lightTheme: { [key: string]: React.CSSProperties } = {
  'pre[class*="language-"]': {
    background: '#f5f5f5',
    margin: 0,
    padding: 0,
  },
  'code[class*="language-"]': {
    background: 'transparent',
    color: '#383a42',
  },
  'comment': {
    color: '#a0a1a7',
    fontStyle: 'italic',
  },
  'keyword': {
    color: '#a626a4',
  },
  'function': {
    color: '#4078f2',
  },
  'string': {
    color: '#50a14f',
  },
  'number': {
    color: '#986801',
  },
  'operator': {
    color: '#0184bc',
  },
  'class-name': {
    color: '#c18401',
  },
  'punctuation': {
    color: '#383a42',
  },
  'property': {
    color: '#e45649',
  },
  'builtin': {
    color: '#c18401',
  },
};

export function LevelDocs({ level, isCompleted = false, isOpen, onClose, theme = 'dark' }: LevelDocsProps) {
  const [content, setContent] = useState<string>('');
  const [showCompleted, setShowCompleted] = useState(isCompleted);
  const isLight = theme === 'light';

  useEffect(() => {
    const doc = getLevelDoc(level.id, showCompleted);
    setContent(doc);
  }, [level.id, showCompleted]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`relative w-full max-w-4xl max-h-[85vh] mx-4 rounded-lg shadow-2xl overflow-hidden ${
        isLight ? 'bg-white' : 'bg-[#0d0d0f] border border-[var(--border-color)]'
      }`}>
        {/* Header */}
        <div className={`sticky top-0 z-10 flex items-center justify-between px-8 py-4 border-b ${
          isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-[#121215] border-[var(--border-color)]'
        }`}>
          <div className="flex items-center gap-4">
            <span className="text-ink-pink font-black text-sm uppercase tracking-widest">
              / INTEL_BRIEF
            </span>
            <span className={`text-sm font-medium ${isLight ? 'text-zinc-500' : 'text-[var(--text-secondary)]'}`}>
              {level.title}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Toggle between regular and completed docs */}
            {isCompleted && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCompleted(false)}
                  className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-colors ${
                    !showCompleted
                      ? 'bg-ink-pink text-white'
                      : isLight ? 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300' : 'bg-[var(--card-bg)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]'
                  }`}
                >
                  Challenge
                </button>
                <button
                  onClick={() => setShowCompleted(true)}
                  className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-colors ${
                    showCompleted
                      ? 'bg-green-500 text-white'
                      : isLight ? 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300' : 'bg-[var(--card-bg)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]'
                  }`}
                >
                  Solution
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className={`w-10 h-10 flex items-center justify-center rounded hover:bg-ink-pink/10 transition-colors ${
                isLight ? 'text-zinc-500 hover:text-ink-pink' : 'text-[var(--text-secondary)] hover:text-ink-pink'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={`overflow-y-auto max-h-[calc(85vh-80px)] px-8 py-8 ${
          isLight ? 'bg-white' : 'bg-[#0d0d0f]'
        }`}>
          <article className="max-w-none">
            <Markdown
              rehypePlugins={[rehypeRaw]}
              components={{
                // H1 - Main title
                h1: ({ children }) => (
                  <h1 className={`text-3xl font-black uppercase tracking-tight mb-4 ${
                    isLight ? 'text-zinc-900' : 'text-white'
                  }`}>
                    {children}
                  </h1>
                ),
                // H2 - Section headers
                h2: ({ children }) => (
                  <h2 className={`text-xl font-bold uppercase tracking-wide mt-8 mb-4 pb-2 border-b ${
                    isLight ? 'text-zinc-800 border-zinc-200' : 'text-ink-pink border-[var(--border-color)]'
                  }`}>
                    {children}
                  </h2>
                ),
                // H3 - Subsections
                h3: ({ children }) => (
                  <h3 className={`text-lg font-bold mt-6 mb-3 ${
                    isLight ? 'text-zinc-700' : 'text-white'
                  }`}>
                    {children}
                  </h3>
                ),
                // Paragraphs
                p: ({ children }) => (
                  <p className={`text-sm leading-relaxed mb-4 ${
                    isLight ? 'text-zinc-600' : 'text-[var(--text-secondary)]'
                  }`}>
                    {children}
                  </p>
                ),
                // Lists
                ul: ({ children }) => (
                  <ul className={`list-disc list-inside space-y-2 mb-4 text-sm ${
                    isLight ? 'text-zinc-600' : 'text-[var(--text-secondary)]'
                  }`}>
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className={`list-decimal list-inside space-y-2 mb-4 text-sm ${
                    isLight ? 'text-zinc-600' : 'text-[var(--text-secondary)]'
                  }`}>
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="leading-relaxed">{children}</li>
                ),
                // Strong/Bold
                strong: ({ children }) => (
                  <strong className={`font-bold ${isLight ? 'text-zinc-800' : 'text-white'}`}>
                    {children}
                  </strong>
                ),
                // Code blocks with syntax highlighting
                pre: ({ children }) => (
                  <div className="mb-4">{children}</div>
                ),
                code: ({ children, className }) => {
                  const match = /language-(\w+)/.exec(className || '');
                  const language = match ? match[1] : '';
                  const isInline = !className;

                  if (isInline) {
                    return (
                      <code className={`px-1.5 py-0.5 rounded text-xs font-mono ${
                        isLight ? 'bg-zinc-100 text-ink-pink' : 'bg-black/50 text-ink-pink'
                      }`}>
                        {children}
                      </code>
                    );
                  }

                  return (
                    <SyntaxHighlighter
                      style={isLight ? lightTheme : oneDark}
                      language={language || 'javascript'}
                      PreTag="div"
                      customStyle={{
                        margin: 0,
                        borderRadius: '0.5rem',
                        fontSize: '0.75rem',
                        padding: '1rem',
                        background: isLight ? '#f5f5f5' : '#1a1a1f',
                        border: isLight ? '1px solid #e5e5e5' : 'none',
                      }}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  );
                },
                // Custom rendering for details/summary (hints)
                details: ({ children }) => {
                  // Separate summary from content
                  const childArray = React.Children.toArray(children);
                  const summary = childArray.find((child: any) => child?.type === 'summary' || child?.props?.node?.tagName === 'summary');
                  const content = childArray.filter((child: any) => child !== summary);

                  return (
                    <details className={`my-4 rounded-lg border overflow-hidden ${
                      isLight ? 'bg-amber-50 border-amber-200' : 'bg-amber-900/10 border-amber-700/30'
                    }`}>
                      {summary}
                      <div className="px-4 pb-4 pt-1">
                        {content}
                      </div>
                    </details>
                  );
                },
                summary: ({ children }) => (
                  <summary className={`cursor-pointer font-bold px-4 py-3 ${
                    isLight ? 'text-amber-700 hover:bg-amber-100' : 'text-amber-400 hover:bg-amber-900/20'
                  }`}>
                    {children}
                  </summary>
                ),
                // Style horizontal rules
                hr: () => (
                  <hr className={`my-6 border-t ${
                    isLight ? 'border-zinc-200' : 'border-[var(--border-color)]'
                  }`} />
                ),
                // Style tables
                table: ({ children }) => (
                  <div className="overflow-x-auto mb-4">
                    <table className={`w-full text-sm border-collapse rounded-lg overflow-hidden ${
                      isLight ? 'border border-zinc-200' : 'border border-[var(--border-color)]'
                    }`}>
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className={isLight ? 'bg-zinc-100' : 'bg-[var(--card-bg)]'}>
                    {children}
                  </thead>
                ),
                th: ({ children }) => (
                  <th className={`px-4 py-3 text-left font-bold text-xs uppercase tracking-wider border-b ${
                    isLight ? 'text-zinc-700 border-zinc-200' : 'text-[var(--text-primary)] border-[var(--border-color)]'
                  }`}>
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className={`px-4 py-3 border-b ${
                    isLight ? 'text-zinc-600 border-zinc-100' : 'text-[var(--text-secondary)] border-[var(--border-color)]/50'
                  }`}>
                    {children}
                  </td>
                ),
              }}
            >
              {content}
            </Markdown>
          </article>
        </div>
      </div>
    </div>
  );
}
