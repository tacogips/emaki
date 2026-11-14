import { compileGrammar } from '../grammar';
import { cLike } from '../families/c-like';

export const javaLanguage = compileGrammar(cLike({
  name: 'java',
  keywords: ["class", "public", "private", "static", "void", "return", "new", "if", "else", "extends", "implements", "interface", "final", "int"],
  docComments: true,
  types: ['String', 'int', 'boolean'],
  extra: { root: [{ match: /"""/, tag: 'string', push: 'triple' }, { match: /@\w+/, tag: 'meta' }, { match: /[{}()[\],;:.]/, tag: 'punctuation' }], states: {triple: [{ match: /"""/, tag: 'string', pop: true }, { match: /./, tag: 'string' }]} }
}));
