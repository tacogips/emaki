import { compileGrammar } from '../grammar';
import { htmlTemplate } from '../templates/html-template';
import { tclLanguage } from './tcl';
export const tclHtmlLanguage = compileGrammar(htmlTemplate({ name: 'tcl-html', open: /<%/, close: /%>/, server: tclLanguage }));
