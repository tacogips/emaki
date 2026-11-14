import { compileGrammar } from '../grammar';
import type { LineLanguage } from '../../types';
const base = compileGrammar({name:'yaml',states:{root:[{match:/#.*$/,tag:'comment'}, {match:/[\w.-]+(?=\s*:)/,tag:'property'}, {match:/-(?=\s)/,tag:'punctuation'}, {match:/[&*][\w-]+/,tag:'variable'}, {match:/!![\w-]+/,tag:'type'}, {match:/"[^"]*"|'[^']*'/,tag:'string'}, {match:/\b\d+\b/,tag:'number'}]}});
export const yamlLanguage: LineLanguage<string> = { ...base, startState:()=> 'root', tokenizeLine(text,state) {
 if (state.startsWith('block')) { const indent = Number(state.slice(5)); if (!text.trim() || (text.match(/^ */)?.[0].length ?? 0) > indent) return {tokens: text.length ? [{from:0,to:text.length,tag:'string'}] : [],state}; }
 const result = base.tokenizeLine(text,'root'); const block = /^( *)(?:[^#\n]+?):\s*[|>][+-]?\s*(?:#.*)?$/.exec(text);
 return {tokens:result.tokens,state:block ? 'block'+block[1]!.length : 'root'};
}};
