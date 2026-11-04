import { compileGrammar } from '../grammar';
import type { GrammarDef } from '../grammar';
export const texGrammar: GrammarDef = {name:'tex',states:{root:[
 {match:/%.*$/,tag:'comment'}, {match:/\$\$[^$]*\$\$|\$[^$]*\$/,tag:'string'},
 {match:/\\[A-Za-z]+/,tag:'keyword'}, {match:/[{}]/,tag:'punctuation'}
]}};
export const texLanguage = compileGrammar(texGrammar);
