import { compileGrammar } from '../grammar';
import { htmlTemplate } from '../templates/html-template';
import { rubyLanguage } from './ruby';
export const erbLanguage = compileGrammar(htmlTemplate({ name: 'erb', open: /<%=?/, close: /-?%>/, server: rubyLanguage, commentOpen: /<%#/ }));
