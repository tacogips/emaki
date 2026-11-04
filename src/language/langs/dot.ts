import { compileGrammar } from '../grammar';
import { cLike } from '../families/c-like';

export const dotLanguage = compileGrammar(cLike({
  name: 'dot',
  keywords: ["digraph", "graph", "node", "edge", "subgraph", "strict"],
  extra: { root: [{ match: /->|--/, tag: 'operator' }, { match: /[{}()[\],;:.]/, tag: 'punctuation' }, { match: /#.*/, tag: 'comment' }] }
}));
