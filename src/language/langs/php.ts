import { compileGrammar } from '../grammar';
import { cLike } from '../families/c-like';
import { htmlTemplate } from '../templates/html-template';
const server = compileGrammar(cLike({ name: 'php-server', keywords: ['function','echo','return','if','else','class','public','new','foreach','as'], charQuote: true, extra: { root: [
  { match: /#[^\n]*/, tag: 'comment' }, { match: /\$[A-Za-z_]\w*/, tag: 'variable' }, { match: /->|::/, tag: 'operator' },
  { match: /<<<['"]?([A-Za-z_]\w*)['"]?/, tag: 'string', push: 'heredocEnd', embed: { language: () => undefined, endArg: m => m[1]!, end: label => new RegExp('^' + label + ';?\\s*$'), fallbackTag: 'string' } },
], states: { heredocEnd: [{ match: /^[A-Za-z_]\w*;?\s*$/, tag: 'string', pop: true }] } } }));
export const phpLanguage = compileGrammar(htmlTemplate({ name: 'php', open: /<\?(?:php\b|=)?/, close: /\?>/, server }));
