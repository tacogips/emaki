import { compileGrammar } from '../grammar';
import { cLike } from '../families/c-like';

export const graphqlLanguage = compileGrammar(cLike({
  name: 'graphql',
  keywords: ["query", "type", "fragment", "mutation", "subscription", "on", "schema", "input", "enum"],
  lineComment: '#',
  blockComment: null,
  extra: { root: [{ match: /"""/, tag: 'string', push: 'triple' }, { match: /\$\w+/, tag: 'variable' }, { match: /@\w+/, tag: 'meta' }, { match: /[{}()[\],;:.]/, tag: 'punctuation' }], states: {triple: [{ match: /"""/, tag: 'string', pop: true }, { match: /./, tag: 'string' }]} }
}));
