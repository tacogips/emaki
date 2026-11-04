import { compileGrammar } from '../grammar';
export const bibtexLanguage = compileGrammar({name:'bibtex',states:{root:[
 {match:/@[A-Za-z]+/,tag:'keyword',push:'entry'}, {match:/.+/,tag:'comment'}
],entry:[{match:/^\s*}\s*$/,tag:'punctuation',pop:true}, {match:/[A-Za-z]+(?=\s*=)/,tag:'property'},
 {match:/\{[^{}]*\}|"[^"]*"/,tag:'string'}, {match:/\b\d+\b/,tag:'number'}, {match:/[{},=]/,tag:'punctuation'}]}});
