import { compileGrammar } from '../grammar';
export const nixLanguage = compileGrammar({ name: 'nix', states: {
  root: [
    { match: /#.*/, tag: 'comment' }, { match: /\/\*/, tag: 'comment', push: 'comment' },
    { match: /''/, tag: 'string', push: 'indented' }, { match: /"/, tag: 'string', push: 'string' },
    { match: /(?:\.\.?\/|\/)[\w./+-]+/, tag: 'string' },
    { match: /\b(?:let|in|with|rec|inherit|if|then|else|assert|or)\b/, tag: 'keyword' },
    { match: /\b\d+(?:\.\d+)?\b/, tag: 'number' },
  ],
  comment: [{ match: /\*\//, tag: 'comment', pop: true }, { match: /./u, tag: 'comment' }],
  indented: [{ match: /''\$\{/, tag: 'escape' }, { match: /'''/, tag: 'escape' }, { match: /''/, tag: 'string', pop: true }, { match: /\$\{/, tag: 'punctuation', push: 'interpolation' }, { match: /./u, tag: 'string' }],
  string: [{ match: /\\./, tag: 'escape' }, { match: /"/, tag: 'string', pop: true }, { match: /\$\{/, tag: 'punctuation', push: 'interpolation' }, { match: /./u, tag: 'string' }],
  interpolation: [{ match: /\}/, tag: 'punctuation', pop: true }, { match: /[a-zA-Z_][\w.'-]*/, tag: 'variable' }, { match: /\d+/, tag: 'number' }],
} });
