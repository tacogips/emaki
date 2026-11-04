import { compileGrammar } from '../grammar';
export const applescriptLanguage = compileGrammar({ name: 'applescript', states: { root: [
{ match: /(?:--|#).*/, tag: 'comment' }, { match: /\(\*/, tag: 'comment', push: 'block' }, { match: /\b(?:tell|end|set|to|if|then|return)\b/i, tag: 'keyword' },{ match: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/, tag: 'string' },{ match: /\b\d+(?:\.\d+)?\b/, tag: 'number' },
], block: [{ match: /\*\)/, tag: 'comment', pop: true }, { match: /./, tag: 'comment' }], },  });
