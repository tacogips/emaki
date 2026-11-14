import { compileGrammar } from '../grammar';
import { shellLike } from '../families/shell-like';
export const bashLanguage = compileGrammar(shellLike({ name: 'bash', keywords: ['if','then','else','fi','for','do','done','in','case','esac'], builtins: ['echo','printf','cd','read','export'], variables: /\$(?:[A-Za-z_]\w*|\{[^}]+\})/, heredoc: true }));
