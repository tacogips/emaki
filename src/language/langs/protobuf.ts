import { compileGrammar } from '../grammar';
import { cLike } from '../families/c-like';

export const protobufLanguage = compileGrammar(cLike({
  name: 'protobuf',
  keywords: ["syntax", "message", "enum", "service", "rpc", "returns", "repeated", "optional", "required"],
  types: ['int32', 'int64', 'string', 'bool', 'bytes', 'double', 'float', 'uint32', 'uint64', 'sint32', 'sint64'],
  extra: { root: [{ match: /[{}()[\],;:.]/, tag: 'punctuation' }] }
}));
