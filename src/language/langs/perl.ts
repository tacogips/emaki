import { compileGrammar } from '../grammar';
export const perlLanguage = compileGrammar({ name: 'perl', states: { root: [
{ match: /^=pod\b.*/, tag: 'comment', push: 'pod' }, { match: /#[^\n]*/, tag: 'comment' },
{ match: /(?:m|qr)\/(?:\\.|[^/\\])*\/[a-z]*|s\/(?:\\.|[^/\\])*\/(?:\\.|[^/\\])*\/[a-z]*/, tag: 'regexp' },
{ match: /[$@%][A-Za-z_]\w*/, tag: 'variable' }, { match: /\b(?:my|sub|if|else|return|use)\b/, tag: 'keyword' },{ match: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/, tag: 'string' },{ match: /\b\d+(?:\.\d+)?\b/, tag: 'number' },
], pod: [{ match: /^=cut\b.*/, tag: 'comment', pop: true }, { match: /./, tag: 'comment' }], },  });
