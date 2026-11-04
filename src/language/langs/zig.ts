import { compileGrammar } from '../grammar';
import { cLike } from '../families/c-like';

export const zigLanguage = compileGrammar(cLike({ name: 'zig', keywords: ["const", "var", "fn", "pub", "return", "if", "else", "for", "while", "struct", "enum", "test"], charQuote: false, nestedComments: false, extra: { root: [{ match: /@[A-Za-z_]\w*/, tag: 'function' }, { match: /\\\\.*/, tag: 'string' }], states: {  } } }));
