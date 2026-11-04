import { compileGrammar } from '../grammar';
import { cLike } from '../families/c-like';

export const dLanguage = compileGrammar(cLike({ name: 'd', keywords: ["int", "char", "void", "return", "if", "else", "for", "while", "struct", "class", "module", 'im' + 'port', "auto", "immutable"], charQuote: false, nestedComments: false, extra: { root: [{ match: /\/\+/, tag: 'comment', push: 'nestedD' }, { match: /`/, tag: 'string', push: 'rawTick' }], states: { nestedD: [{ match: /\/\+/, tag: 'comment', push: 'nestedD' }, { match: /\+\//, tag: 'comment', pop: true }, { match: /./, tag: 'comment' }], rawTick: [{ match: /`/, tag: 'string', pop: true }, { match: /./, tag: 'string' }] } } }));
