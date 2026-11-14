import { compileGrammar } from '../grammar';
export const rdLanguage = compileGrammar({name:'rd',states:{root:[{match:/%.*$/,tag:'comment'}, {match:/\\[A-Za-z]+/,tag:'keyword'}, {match:/[{}]/,tag:'punctuation'}, {match:/"[^"]*"/,tag:'string'}]}});
