import { compileGrammar } from '../grammar';
export const luaLanguage = compileGrammar({ name: 'lua', states: { root: [
{ match: /--\[==\[/, tag: 'comment', push: 'lcomment2' }, { match: /--\[=\[/, tag: 'comment', push: 'lcomment1' }, { match: /--\[\[/, tag: 'comment', push: 'lcomment0' }, { match: /--.*/, tag: 'comment' },
{ match: /\[\[/, tag: 'string', push: 'longstring' }, { match: /\b(?:local|function|end|if|then|else|return)\b/, tag: 'keyword' },{ match: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/, tag: 'string' },{ match: /\b\d+(?:\.\d+)?\b/, tag: 'number' },
], lcomment0: [{ match: /\]\]/, tag: 'comment', pop: true }, { match: /./, tag: 'comment' }], lcomment1: [{ match: /\]=\]/, tag: 'comment', pop: true }, { match: /./, tag: 'comment' }], lcomment2: [{ match: /\]==\]/, tag: 'comment', pop: true }, { match: /./, tag: 'comment' }],longstring: [{ match: /\]\]/, tag: 'string', pop: true }, { match: /./, tag: 'string' }], },  });
