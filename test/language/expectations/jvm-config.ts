import type { LanguageExpectation } from '../support/fixture-check';

export const jvmConfigExpectations: readonly LanguageExpectation[] = [
  {"id": "java", "ext": "java", "classes": ["keyword", "string", "comment", "number"], "snippets": [["@param", "meta"], ["@Override", "meta"], ["42", "number"], ["hello", "string"]]},
  {"id": "groovy", "ext": "groovy", "classes": ["keyword", "string", "comment", "number"], "snippets": [["def", "keyword"], ["${", "punctuation"], ["who", "variable"], ["42", "number"]]},
  {"id": "scala", "ext": "scala", "classes": ["keyword", "string", "comment", "number"], "snippets": [["case", "keyword"], ["def", "keyword"], ["multiline", "string"], ["42", "number"]]},
  {"id": "kotlin", "ext": "kt", "classes": ["keyword", "string", "comment", "number"], "snippets": [["fun", "keyword"], ["${", "punctuation"], ["person", "variable"], ["42", "number"]]},
  {"id": "protobuf", "ext": "proto", "classes": ["keyword", "string", "comment", "number"], "snippets": [["message", "keyword"], ["enum", "keyword"], ["int32", "type"], ["1", "number"]]},
  {"id": "graphql", "ext": "graphql", "classes": ["keyword", "string", "comment", "number"], "snippets": [["block description", "string"], ["query", "keyword"], ["$id", "variable"], ["@cached", "meta"]]},
  {"id": "dot", "ext": "dot", "classes": ["keyword", "string", "comment", "number"], "snippets": [["digraph", "keyword"], ["->", "operator"], ["start", "string"], ["1", "number"]]},
  {"id": "properties", "ext": "properties", "classes": ["keyword", "string", "comment", "number"], "snippets": [["two", "string"], ["name", "property"], ["42", "number"], ["true", "keyword"]]},
  {"id": "ini", "ext": "ini", "classes": ["keyword", "string", "comment", "number"], "snippets": [["[section]", "type"], ["name", "property"], ["42", "number"], ["hello", "string"]]},
  {"id": "toml", "ext": "toml", "classes": ["keyword", "string", "comment", "number"], "snippets": [["[[array.table]]", "type"], ["1979-05-27T07:32:00Z", "number"], ["true", "constant"], ["middle", "string"]]},
  {"id": "hcl", "ext": "tf", "classes": ["keyword", "string", "comment", "number"], "snippets": [["resource", "keyword"], ["heredoc body", "string"], ["${", "punctuation"], ["var.x", "variable"]]},
];
