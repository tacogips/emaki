import { compileGrammar } from '../grammar';
import { cLike } from '../families/c-like';

export const cLanguage = compileGrammar(cLike({ name: 'c', keywords: ["int", "char", "void", "return", "if", "else", "for", "while", "struct", "typedef", "const", "static", "unsigned"], charQuote: true, nestedComments: false, extra: { root: [{ match: /^(\s*#\s*(?:include|import|include_next))(\s*)(<[^>]*>)/, tag: ['meta', undefined, 'string'] }, { match: /^\s*#\s*\w+/, tag: 'meta' }], states: {  } } }));
