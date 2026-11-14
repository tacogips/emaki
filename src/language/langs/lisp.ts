import { compileGrammar } from '../grammar';
import { lispLike } from '../families/lisp-like';
const grammar = lispLike({ name: 'lisp', specialForms: ['defun', 'defvar', 'lambda', 'let', 'if', 'progn'], constants: ['nil', 't'], blockComment: ['#|', '|#'] });
export const lispLanguage = compileGrammar({ ...grammar, name: 'lisp' });
