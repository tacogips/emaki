import { compileGrammar } from '../grammar';
export const textileLanguage = compileGrammar({ name:'textile', states:{root:[
 {match:/^h[1-6]\..*$/,tag:'heading'}, {match:/^bc\./,tag:'meta'}, {match:/\*[^*]+\*/,tag:'strong'},
 {match:/_[^_]+_/,tag:'emphasis'}, {match:/"[^"]+":\S+/,tag:'link'}, {match:/^\s*#.*$/,tag:'comment'}
]} });
