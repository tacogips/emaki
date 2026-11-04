import type { LanguageExpectation } from '../support/fixture-check';
// regexp has no keyword words, string literals, or numeric literals.
export const scriptingExpectations: readonly LanguageExpectation[] = [
  {"id": "python", "ext": "py", "classes": ["keyword", "string", "comment", "number"], "snippets": [["@decorator", "meta"], ["greet", "function"], ["middle text", "string"], ["True", "constant"]]},
  {"id": "ruby", "ext": "rb", "classes": ["keyword", "string", "comment", "number"], "snippets": [["block words", "comment"], [":sym", "constant"], ["/abc/", "regexp"], ["%w[a b]", "string"]]},
  {"id": "perl", "ext": "pl", "classes": ["keyword", "string", "comment", "number"], "snippets": [["documentation words", "comment"], ["$x", "variable"], ["qr/abc/", "regexp"], ["my", "keyword"]]},
  {"id": "lua", "ext": "lua", "classes": ["keyword", "string", "comment", "number"], "snippets": [["middle comment", "comment"], ["]]", "comment"], ["hello", "string"], ["42", "number"]]},
  {"id": "r", "ext": "r", "classes": ["keyword", "string", "comment", "number"], "snippets": [["<-", "operator"], ["TRUE", "constant"], ["function", "keyword"], ["42", "number"]]},
  {"id": "tcl", "ext": "tcl", "classes": ["keyword", "string", "comment", "number"], "snippets": [["proc", "keyword"], ["set", "keyword"], ["$name", "variable"], ["# comment", "comment"]]},
  {"id": "bash", "ext": "sh", "classes": ["keyword", "string", "comment", "number"], "snippets": [["echo", "function"], ["$HOME", "variable"], ["if", "keyword"], ["# comment", "comment"]]},
  {"id": "fish", "ext": "fish", "classes": ["keyword", "string", "comment", "number"], "snippets": [["function", "keyword"], ["end", "keyword"], ["set", "keyword"], ["# comment", "comment"]]},
  {"id": "batch", "ext": "bat", "classes": ["keyword", "comment", "string", "number"], "snippets": [["REM comment", "comment"], [":label", "function"], ["%VAR%", "variable"], ["%%i", "variable"]]},
  {"id": "applescript", "ext": "applescript", "classes": ["keyword", "string", "comment", "number"], "snippets": [["middle comment", "comment"], ["tell", "keyword"], ["set", "keyword"], ["42", "number"]]},
  {"id": "makefile", "ext": "mk", "classes": ["keyword", "string", "comment", "number", "variable", "function"], "snippets": [["build", "function"], ["$(VAR)", "variable"], [".PHONY", "meta"], ["ifeq", "keyword"]]},
  {"id": "dockerfile", "ext": "dockerfile", "classes": ["keyword", "string", "comment", "number", "function"], "snippets": [["FROM", "keyword"], ["RUN", "keyword"], ["echo", "function"], ["COPY", "keyword"]]},
  {"id": "sql", "ext": "sql", "classes": ["keyword", "string", "comment", "number"], "snippets": [["SELECT", "keyword"], ["select", "keyword"], ["'it''s'", "string"], [":name", "variable"]]},
  {"id": "regexp", "ext": "re", "classes": ["punctuation", "operator", "escape", "constant", "comment"], "snippets": [["(?#comment)", "comment"], ["[a-z]", "constant"], ["\\d", "escape"], ["{2,3}", "operator"]]},
];
