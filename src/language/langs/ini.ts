import { compileGrammar } from '../grammar';
import { iniLike } from '../families/ini-like';
const base = iniLike({ name: 'ini', comments: [';', '#'], keyValue: /^\s*([^\s=:]+)\s*([=:])/, valueRules: [{ match: /\b(?:true|false)\b/, tag: 'keyword' }, { match: /\b\d+\b/, tag: 'number' }, { match: /"(?:\\.|[^"])*"|'(?:\\.|[^'])*'/, tag: 'string' }, { match: /[^\s]+/, tag: 'string' }] });
export const iniLanguage = compileGrammar(base);
