import { compileGrammar } from '../grammar';
import { htmlTemplate } from '../templates/html-template';
import { javaLanguage } from './java';
const grammar = htmlTemplate({ name: 'jsp', open: /<%=?/, close: /%>/, server: javaLanguage, commentOpen: /<%--/ });
grammar.states.root = [{ match: /<%@[^%]*(?:%(?!>)[^%]*)*%>/, tag: 'meta' }, ...grammar.states.root!];
export const jspLanguage = compileGrammar(grammar);
