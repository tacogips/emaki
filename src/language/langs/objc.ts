import { compileGrammar } from '../grammar';
import { cLike } from '../families/c-like';

export const objcLanguage = compileGrammar(cLike({ name: 'objc', keywords: ["int", "char", "void", "return", "if", "else", "for", "while", "struct", "typedef", "const", "static", "unsigned"], charQuote: true, nestedComments: false, extra: { root: [{ match: /@(interface|end|property|implementation)\b/, tag: 'keyword' }, { match: /@"/, tag: 'string', push: 'objcString' }], states: { objcString: [{ match: /\\./, tag: 'escape' }, { match: /"/, tag: 'string', pop: true }, { match: /./, tag: 'string' }] } } }));
