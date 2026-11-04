import type { LanguageExpectation } from '../support/fixture-check';
export const docsMarkupExpectations: readonly LanguageExpectation[] = [
 {id:'markdown',ext:'md',classes:['heading','strong','emphasis','link','string','comment'],snippets:[['# Heading','heading'],['**bold**','strong'],['*italic*','emphasis'],['[link](url)','link']]},
 {id:'restructuredtext',ext:'rst',classes:['heading','keyword','attribute','string','comment'],snippets:[['=====','heading'],['.. note::','keyword'],[':role:','attribute'],['``literal``','string']]},
 {id:'textile',ext:'textile',classes:['heading','strong','emphasis','link','meta'],snippets:[['h1. Title','heading'],['*bold*','strong'],['_emphasis_','emphasis'],['"link":https://example.test','link']]},
 {id:'latex',ext:'tex',classes:['keyword','type','comment','string'],snippets:[['document','type'],['\\section','keyword'],['% comment','comment'],['$math$','string']]},
 {id:'tex',ext:'tex',classes:['keyword','comment','string','punctuation'],snippets:[['\\command','keyword'],['% comment','comment'],['$math$','string'],['{','punctuation']]},
 {id:'bibtex',ext:'bib',classes:['keyword','property','string','comment'],snippets:[['@article','keyword'],['title','property'],['{A title}','string'],['Outside entry','comment']]},
 {id:'rd',ext:'rd',classes:['keyword','comment','punctuation','string'],snippets:[['\\name','keyword'],['% comment','comment'],['{','punctuation'],['"literal"','string']]},
 {id:'diff',ext:'diff',classes:['heading','inserted','deleted','meta'],snippets:[['diff --git a/file b/file','heading'],['-old','deleted'],['+new','inserted'],['@@ -1 +1 @@','meta']]},
 {id:'yaml',ext:'yaml',classes:['property','punctuation','variable','type','comment','string','number'],snippets:[['name','property'],['&here','variable'],['!!str','type'],['  block text','string']]},
 {id:'haml',ext:'haml',classes:['tag','attribute','keyword','comment','string','number'],snippets:[['%div','tag'],['.card','attribute'],['=','keyword'],['"hello"','string']]},
 {id:'json',ext:'json',classes:['json-key','json-string','json-number','json-punct'],snippets:[['"name"','json-key'],['"example"','json-string'],['42','json-number'],['{','json-punct']]},
];
