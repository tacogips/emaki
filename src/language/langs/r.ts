import { compileGrammar } from '../grammar';
export const rLanguage = compileGrammar({ name: 'r', states: { root: [
{ match: /#.*/, tag: 'comment' }, { match: /<-/, tag: 'operator' }, { match: /\b(?:TRUE|FALSE|NA|NULL)\b/, tag: 'constant' }, { match: /\b(?:function|if|else|for|in|return)\b/, tag: 'keyword' },{ match: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/, tag: 'string' },{ match: /\b\d+(?:\.\d+)?\b/, tag: 'number' },
],  },  });
