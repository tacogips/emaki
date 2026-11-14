import { compileGrammar } from '../grammar';
import { iniLike } from '../families/ini-like';
const base = iniLike({ name: 'properties', comments: ['#', '!'], keyValue: /^\s*([^\s:=]+)\s*([=:])/ });
export const propertiesLanguage = compileGrammar({ ...base, states: { root: [...base.states.root!, { match: /\s*[^\\\n]*\\\s*$/, tag: 'string', push: 'continued' }, { match: /\b(?:true|false)\b/, tag: 'keyword' }, { match: /\b\d+\b/, tag: 'number' }, { match: /[^\s]+/, tag: 'string' }], continued: [{ match: /^.*\\\s*$/, tag: 'string' }, { match: /^.+/, tag: 'string', pop: true }] } });
