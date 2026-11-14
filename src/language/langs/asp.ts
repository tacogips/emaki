import { compileGrammar } from '../grammar';
import { htmlTemplate } from '../templates/html-template';
const server = compileGrammar({ name: 'vbscript', states: { root: [
  { match: /'.*/, tag: 'comment' }, { match: /"(?:""|[^"])*"/, tag: 'string' },
  { match: /\b(?:dim|if|then|else|end|sub|response|write|for|each|next|function|set)\b/i, tag: 'keyword' },
  { match: /\b\d+(?:\.\d+)?/, tag: 'number' },
] } });
export const aspLanguage = compileGrammar(htmlTemplate({ name: 'asp', open: /<%=?/, close: /%>/, server }));
