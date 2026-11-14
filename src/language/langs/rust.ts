import { compileGrammar } from '../grammar';
import { cLike } from '../families/c-like';

export const rustLanguage = compileGrammar(cLike({ name: 'rust', keywords: ["fn", "let", "mut", "pub", "struct", "enum", "impl", "trait", "use", "mod", "if", "else", "match", "return", "const"], charQuote: true, nestedComments: true, extra: { root: [{ match: /#\[[^\]]*\]/, tag: 'meta' }, { match: /r(#+)"/, tag: 'string', push: 'rustRawEnd', embed: { language: () => undefined, end: s => new RegExp('"' + s), endArg: m => m[1] ?? '' } }, { match: /'[A-Za-z_]\w*\b(?!')/, tag: 'type' }, { match: /[A-Za-z_]\w*!/, tag: 'function' }], states: { rustRawEnd: [{ match: /"#+/, tag: 'string', pop: true }, { match: /./, tag: 'string' }] } } }));
