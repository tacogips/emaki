import { compileGrammar } from '../grammar';
export const restructuredtextLanguage = compileGrammar({ name: 'restructuredtext', states: { root: [
 {match:/^(?:={3,}|-{3,}|~{3,}|\^{3,})\s*$/,tag:'heading'}, {match:/^\s*\.\.\s+[\w-]+::/,tag:'keyword'},
 {match:/^\s*\.\..*$/,tag:'comment'}, {match:/:\w+:/,tag:'attribute'}, {match:/``[^`]+``/,tag:'string'},
 {match:/\*\*[^*]+\*\*/,tag:'strong'}, {match:/\*[^*]+\*/,tag:'emphasis'}, {match:/`[^`]+`_/,tag:'link'}
] } });
