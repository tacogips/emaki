import { compileGrammar } from '../grammar';
export const sqlLanguage = compileGrammar({ name: 'sql', states: { root: [
{ match: /--.*/, tag: 'comment' }, { match: /\/\*/, tag: 'comment', push: 'block' }, { match: /'(?:''|[^'])*'/, tag: 'string' }, { match: /[@:][A-Za-z_]\w*/, tag: 'variable' }, { match: /\b(?:select|from|where|insert|into|values|create|table|and|or|as|null)\b/i, tag: 'keyword' },{ match: /\b\d+(?:\.\d+)?\b/, tag: 'number' },
], block: [{ match: /\*\//, tag: 'comment', pop: true }, { match: /./, tag: 'comment' }], },  });
