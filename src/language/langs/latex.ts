import { compileGrammar } from '../grammar';
import { texGrammar } from './tex';
export const latexLanguage = compileGrammar({ ...texGrammar, name:'latex', states:{...texGrammar.states, root:[
 {match:/(\\(?:begin|end))(\{)([^}]+)(\})/,tag:['keyword','punctuation','type','punctuation']}, ...texGrammar.states.root!
]} });
