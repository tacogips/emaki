import { compileGrammar } from '../grammar';
import { shellLike } from '../families/shell-like';
const grammar = shellLike({ name: 'fish', keywords: ['function','end','set','if','else','for','in'], builtins: ['echo','printf'], variables: /\$[A-Za-z_]\w*/ });
grammar.states.root = [{ match: /[()]/, tag: 'punctuation' }, ...grammar.states.root!];
export const fishLanguage = compileGrammar(grammar);
