import { compileGrammar } from '../grammar';
import { markupLike } from '../families/markup-like';

export const xmlLanguage = compileGrammar(markupLike({
  name: 'xml',
  extra: {
    root: [{ match: /<!\[CDATA\[/, tag: 'string', push: 'cdata' }],
    states: { cdata: [{ match: /\]\]>/, tag: 'string', pop: true }, { match: /./, tag: 'string' }] },
  },
}));
