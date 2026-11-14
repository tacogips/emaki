import { compileGrammar } from '../grammar';
import { lispLike } from '../families/lisp-like';
const grammar = lispLike({ name: 'clojure', specialForms: ['defn', 'def', 'let', 'fn', 'if', 'do', 'loop', 'recur'], constants: ['true', 'false', 'nil'] });
export const clojureLanguage = compileGrammar({ ...grammar, name: 'clojure', states: { ...grammar.states, root: [{ match: /#\{|\}/, tag: 'punctuation' }, ...grammar.states.root!] } });
