import { compileGrammar } from '../grammar';
import { cLike } from '../families/c-like';

export const objcppLanguage = compileGrammar(cLike({ name: 'objcpp', keywords: ["int", "char", "void", "return", "if", "else", "for", "while", "struct", "typedef", "const", "static", "unsigned", "class", "template", "namespace", "constexpr", "typename", "public", "private", "auto"], charQuote: true, nestedComments: false, extra: { root: [{ match: /@(interface|end|property|implementation)\b/, tag: 'keyword' }, { match: /@"/, tag: 'string', push: 'objcString' }], states: { objcString: [{ match: /\\./, tag: 'escape' }, { match: /"/, tag: 'string', pop: true }, { match: /./, tag: 'string' }] } } }));
