import { compileGrammar } from '../grammar';
export const ocamlLanguage = compileGrammar({ name: 'ocaml', states: {
  root: [
    { match: /\(\*/, tag: 'comment', push: 'comment' }, { match: /"/, tag: 'string', push: 'string' },
    { match: /'(?:\\.|[^'\\])'/, tag: 'string' }, { match: /'[a-z][\w']*/, tag: 'type' },
    { match: /\b(?:let|rec|in|match|with|type|fun|function|of|if|then|else|and|module|open)\b/, tag: 'keyword' },
    { match: /\b[A-Z]\w*/, tag: 'type' }, { match: /\b\d+(?:\.\d+)?\b/, tag: 'number' },
  ],
  comment: [{ match: /\(\*/, tag: 'comment', push: 'comment' }, { match: /\*\)/, tag: 'comment', pop: true }, { match: /./u, tag: 'comment' }],
  string: [{ match: /\\./, tag: 'escape' }, { match: /"/, tag: 'string', pop: true }, { match: /./u, tag: 'string' }],
} });
