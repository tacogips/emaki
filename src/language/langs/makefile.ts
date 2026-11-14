import { compileGrammar } from '../grammar';
export const makefileLanguage = compileGrammar({ name: 'makefile', states: { root: [
{ match: /#.*/, tag: 'comment' }, { match: /\$\([^)]+\)|\$\{[^}]+\}/, tag: 'variable' }, { match: /^\.PHONY\b/, tag: 'meta' }, { match: /^(?:ifeq|include)\b/, tag: 'keyword' }, { match: /^[A-Za-z_][\w.-]*(?=:)/, tag: 'function' },{ match: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/, tag: 'string' },{ match: /\b\d+(?:\.\d+)?\b/, tag: 'number' },
],  },  });
