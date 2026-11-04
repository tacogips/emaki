import { compileGrammar } from '../grammar';
import { htmlTemplate } from '../templates/html-template';
import { erlangLanguage } from './erlang';
export const erlangHtmlLanguage = compileGrammar(htmlTemplate({ name: 'erlang-html', open: /<erl>/i, close: /<\/erl>/i, server: erlangLanguage }));
