import { compileGrammar } from '../grammar';
import { cLike } from '../families/c-like';

export const swiftLanguage = compileGrammar(cLike({ name: 'swift', keywords: ["func", "let", "var", "class", "struct", "enum", "return", "if", "else", "for", "in", "public", "private"], charQuote: false, nestedComments: true, extra: { root: [{ match: /^\s*#\w+/, tag: 'meta' }, { match: /@[A-Za-z_]\w*/, tag: 'meta' }, { match: /"""/, tag: 'string', push: 'triple' }], states: { triple: [{ match: /"""/, tag: 'string', pop: true }, { match: /./, tag: 'string' }] } } }));
