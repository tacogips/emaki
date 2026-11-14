import type { LanguageExpectation } from '../support/fixture-check';
export const functionalExpectations: readonly LanguageExpectation[] = [
  { id: 'haskell', ext: 'hs', classes: ['keyword', 'string', 'comment', 'number'], snippets: [['{- a {- b -} c -}', 'comment'], ['Shape', 'type'], ["x'", 'variable'], ["'c'", 'string']] },
  { id: 'ocaml', ext: 'ml', classes: ['keyword', 'string', 'comment', 'number'], snippets: [['(* outer (* inner *) tail *)', 'comment'], ["'a", 'type'], ['match', 'keyword'], ['"hello"', 'string']] },
  { id: 'erlang', ext: 'erl', classes: ['keyword', 'string', 'comment', 'number'], snippets: [['-module(example).', 'meta'], ['ready', 'constant'], ['X', 'variable'], ['fun', 'keyword']] },
  { id: 'clojure', ext: 'clj', classes: ['keyword', 'string', 'comment', 'number'], snippets: [['defn', 'keyword'], [':kw', 'constant'], ['#{', 'punctuation'], ['; sample', 'comment']] },
  { id: 'lisp', ext: 'lisp', classes: ['keyword', 'string', 'comment', 'number'], snippets: [['#| block comment |#', 'comment'], ['defun', 'keyword'], ['"hello"', 'string'], ['1', 'number']] },
  { id: 'nix', ext: 'nix', classes: ['keyword', 'string', 'comment', 'number'], snippets: [['pkgs.x', 'variable'], [' y', 'string'], ['./foo.nix', 'string'], ['/* block comment */', 'comment'], ['${', 'punctuation']] },
  { id: 'matlab', ext: 'm', classes: ['keyword', 'string', 'comment', 'number'], snippets: [['block comment', 'comment'], ["'", 'operator'], ["'hi'", 'string'], ['function', 'keyword']] },
];
