import { compileGrammar } from '../grammar';
export const haskellLanguage = compileGrammar({ name: 'haskell', states: {
  root: [
    { match: /--.*/, tag: 'comment' }, { match: /\{-/, tag: 'comment', push: 'comment' },
    { match: /"/, tag: 'string', push: 'string' }, { match: /'(?:\\.|[^'\\])'/, tag: 'string' },
    { match: /\b(?:where|let|in|data|case|of|module|import|type|if|then|else|deriving)\b/, tag: 'keyword' },
    { match: /\b[A-Z][\w']*/, tag: 'type' }, { match: /\b[a-z_][\w']*/, tag: 'variable' },
    { match: /\b\d+(?:\.\d+)?\b/, tag: 'number' }, { match: /[=+*\/:<>-]+/, tag: 'operator' },
  ],
  comment: [{ match: /\{-/, tag: 'comment', push: 'comment' }, { match: /-\}/, tag: 'comment', pop: true }, { match: /./u, tag: 'comment' }],
  string: [{ match: /\\./, tag: 'escape' }, { match: /"/, tag: 'string', pop: true }, { match: /./u, tag: 'string' }],
}, eolPop: ['string'] });
