import { compileGrammar } from '../grammar';
export const diffLanguage = compileGrammar({name:'diff',states:{root:[{match:/^(?:diff --git|---|\+\+\+).*$/,tag:'heading'}, {match:/^@@.*@@.*$/,tag:'meta'}, {match:/^\+.*$/,tag:'inserted'}, {match:/^-.*$/,tag:'deleted'}]}});
