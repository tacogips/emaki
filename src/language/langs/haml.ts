import { compileGrammar } from '../grammar';
export const hamlLanguage = compileGrammar({name:'haml',states:{root:[{match:/^\s*(?:-#|\/).*$/,tag:'comment'}, {match:/%[\w-]+/,tag:'tag'}, {match:/[.#][\w-]+/,tag:'attribute'}, {match:/^\s*[-=]/,tag:'keyword'}, {match:/"[^"]*"|'[^']*'/,tag:'string'}, {match:/\b\d+\b/,tag:'number'}]}});
