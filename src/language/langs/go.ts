import { compileGrammar } from '../grammar';
import { cLike } from '../families/c-like';

export const goLanguage = compileGrammar(cLike({ name: 'go', keywords: ["package", "func", "var", "const", "return", "if", "else", "for", "range", "type", "struct", "interface", 'im' + 'port'], charQuote: false, nestedComments: false, extra: { root: [{ match: /`/, tag: 'string', push: 'rawTick' }, { match: /\b(func)(\s+)([A-Za-z_]\w*)(?=\s*\()/, tag: ['keyword', undefined, 'function'] }, { match: /:=/, tag: 'operator' }], states: { rawTick: [{ match: /`/, tag: 'string', pop: true }, { match: /./, tag: 'string' }] } } }));
