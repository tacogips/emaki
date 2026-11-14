import { compileGrammar } from '../grammar';
import { shellLike } from '../families/shell-like';
const grammar = shellLike({ name: 'batch', keywords: ['if','else','for','in','do','set','goto'], builtins: ['echo'], variables: /%[A-Za-z_]\w*%|%%[A-Za-z]/, caseInsensitive: true });
grammar.states.root = [{ match: /^\s*(?:REM\b|::).*/i, tag: 'comment' }, { match: /^:[A-Za-z_]\w*/, tag: 'function' }, ...grammar.states.root!];
export const batchLanguage = compileGrammar(grammar);
