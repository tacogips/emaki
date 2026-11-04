import { compileGrammar } from '../grammar';
export const erlangLanguage = compileGrammar({ name: 'erlang', states: {
  root: [
    { match: /%.*/, tag: 'comment' }, { match: /^\s*-[a-z][\w]*(?:\([^\n]*?\))?\./, tag: 'meta' },
    { match: /"/, tag: 'string', push: 'string' }, { match: /'(?:\\.|[^'\\])*'/, tag: 'constant' },
    { match: /\b(?:fun|end|case|of|receive|after|when|if|try|catch|begin)\b/, tag: 'keyword' },
    { match: /\b[A-Z_][\w@]*/, tag: 'variable' }, { match: /\b[a-z][\w@]*/, tag: 'constant' },
    { match: /\b\d+(?:\.\d+)?\b/, tag: 'number' },
  ], string: [{ match: /\\./, tag: 'escape' }, { match: /"/, tag: 'string', pop: true }, { match: /./u, tag: 'string' }],
} });
