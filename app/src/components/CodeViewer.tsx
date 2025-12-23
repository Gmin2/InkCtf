import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeViewerProps {
  code: string;
  language?: string;
  theme?: 'dark' | 'light';
}

// Custom dark theme based on oneDark with ink! CTF colors
const customDarkTheme = {
  ...oneDark,
  'pre[class*="language-"]': {
    ...oneDark['pre[class*="language-"]'],
    background: 'transparent',
    margin: 0,
    padding: 0,
  },
  'code[class*="language-"]': {
    ...oneDark['code[class*="language-"]'],
    background: 'transparent',
    color: '#abb2bf',
  },
  'comment': {
    color: '#5c6370',
    fontStyle: 'italic',
  },
  'keyword': {
    color: '#c678dd',
  },
  'function': {
    color: '#61afef',
  },
  'string': {
    color: '#98c379',
  },
  'number': {
    color: '#d19a66',
  },
  'operator': {
    color: '#56b6c2',
  },
  'class-name': {
    color: '#e5c07b',
  },
  'attr-name': {
    color: '#e6007a',
  },
  'punctuation': {
    color: '#abb2bf',
  },
};

// Custom light theme with better contrast
const customLightTheme = {
  ...oneLight,
  'pre[class*="language-"]': {
    ...oneLight['pre[class*="language-"]'],
    background: 'transparent',
    margin: 0,
    padding: 0,
  },
  'code[class*="language-"]': {
    ...oneLight['code[class*="language-"]'],
    background: 'transparent',
    color: '#383a42',
  },
  'comment': {
    color: '#a0a1a7',
    fontStyle: 'italic',
  },
  'keyword': {
    color: '#a626a4',
    fontWeight: '600',
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
  'attr-name': {
    color: '#e6007a',
    fontWeight: '600',
  },
  'punctuation': {
    color: '#383a42',
  },
  'builtin': {
    color: '#c18401',
  },
};

export function CodeViewer({ code, language = 'rust', theme = 'dark' }: CodeViewerProps) {
  const isLight = theme === 'light';

  return (
    <SyntaxHighlighter
      style={isLight ? customLightTheme : customDarkTheme}
      language={language}
      showLineNumbers={true}
      lineNumberStyle={{
        minWidth: '2.5em',
        paddingRight: '1em',
        color: isLight ? '#a0a1a7' : '#4b5563',
        userSelect: 'none',
        fontSize: '0.7rem',
      }}
      customStyle={{
        margin: 0,
        padding: '1rem',
        background: 'transparent',
        fontSize: '0.7rem',
        lineHeight: '1.5',
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace',
      }}
      codeTagProps={{
        style: {
          fontFamily: 'inherit',
        },
      }}
    >
      {code}
    </SyntaxHighlighter>
  );
}
