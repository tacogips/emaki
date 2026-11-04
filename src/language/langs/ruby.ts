import { compileGrammar } from '../grammar';
export const rubyLanguage = compileGrammar({ name: 'ruby', states: { root: [
{ match: /^=begin\b.*/, tag: 'comment', push: 'block' },
{ match: /<<[-~]?([A-Za-z_]\w*)/, tag: 'operator', embed: { language: () => undefined, endArg: m => m[1]!, end: arg => new RegExp('^\\s*' + arg + '\\s*$'), fallbackTag: 'string' } },
{ match: /#[^\n]*/, tag: 'comment' }, { match: /%w\[[^\]]*\]/, tag: 'string' },
{ match: /:[A-Za-z_]\w*/, tag: 'constant' }, { match: /\/(?:\\.|[^/\\])+\/[a-z]*/, tag: 'regexp' },
{ match: /\b(?:def|end|class|if|else|do|return|puts)\b/, tag: 'keyword' },{ match: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/, tag: 'string' },{ match: /\b\d+(?:\.\d+)?\b/, tag: 'number' },
], block: [{ match: /^=end\b.*/, tag: 'comment', pop: true }, { match: /./, tag: 'comment' }], },  });
