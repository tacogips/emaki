import { compileGrammar } from '../grammar';
export const regexpLanguage = compileGrammar({ name: 'regexp', states: { root: [
{ match: /\(\?#[^)]*\)/, tag: 'comment' }, { match: /\\b|[\^$]/, tag: 'keyword' }, { match: /\\./, tag: 'escape' }, { match: /\[(?:\\.|[^\]\\])*\]/, tag: 'constant' }, { match: /\{\d+(?:,\d*)?\}|[*+?]/, tag: 'operator' }, { match: /\(\?:|[()]/, tag: 'punctuation' },
],  },  });
