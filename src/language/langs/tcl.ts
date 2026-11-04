import { compileGrammar } from '../grammar';
export const tclLanguage = compileGrammar({ name: 'tcl', states: { root: [
{ match: /(^\s*|;\s*)(#.*)/, tag: [undefined, 'comment'] }, { match: /\$[A-Za-z_]\w*/, tag: 'variable' }, { match: /\b(?:proc|set|if|else|return|puts)\b/, tag: 'keyword' },{ match: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/, tag: 'string' },{ match: /\b\d+(?:\.\d+)?\b/, tag: 'number' },
],  },  });
