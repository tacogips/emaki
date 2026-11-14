import { compileGrammar } from '../grammar';
import { cLike } from '../families/c-like';

export const actionscriptLanguage = compileGrammar(cLike({ name: 'actionscript', keywords: ["function", "var", "package", "class", "public", "private", "return", "if", "else", "for", "while", "const", "new"], charQuote: false, nestedComments: false, extra: { root: [], states: {  } } }));
