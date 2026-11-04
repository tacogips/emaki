import type { LanguageExpectation } from '../support/fixture-check';
export const webExpectations: readonly LanguageExpectation[] = [
  { id: 'javascript', ext: 'js', classes: ['keyword','number','comment','string'], snippets: [['const','keyword'],['/a+b/g','regexp'],['1_000n','number'],['hello world','string']] },
  { id: 'typescript', ext: 'ts', classes: ['keyword','number','comment','string'], snippets: [['interface','keyword'],['unknown','type'],['12','number'],['"hi"','string']] },
  { id: 'jsx', ext: 'jsx', classes: ['keyword','number','comment','string'], snippets: [['const','keyword'],['1','number'],['Button','tag'],['title','attribute']] },
  { id: 'tsx', ext: 'tsx', classes: ['keyword','number','comment','string'], snippets: [['interface','keyword'],['unknown','type'],['Button','tag'],['title','attribute']] },
  { id: 'css', ext: 'css', classes: ['comment','keyword','number','string'], snippets: [['@media','keyword'],['color','property'],['#fff','constant'],['12px','number']] },
  { id: 'html', ext: 'html', classes: ['comment','tag','attribute','keyword','property'], snippets: [['let','keyword'],['color','property'],['class','attribute'],['"hello"','string']] },
  { id: 'xml', ext: 'xml', classes: ['comment','tag','attribute','string'], snippets: [['<?xml version="1.0"?>','meta'],['root','tag'],['id','attribute'],['hello]]>','string']] },
  { id: 'vue', ext: 'vue', classes: ['comment','tag','attribute','keyword','property'], snippets: [['interface','keyword'],['unknown','type'],['color','property'],['class','attribute'],['true','keyword']] },
  { id: 'svelte', ext: 'svelte', classes: ['comment','tag','attribute','keyword','property'], snippets: [['#if','keyword'],['let','keyword'],['color','property'],['class','attribute']] },
];
export const nantExpectation: LanguageExpectation = { id: 'nant', ext: 'build', classes: ['tag','attribute'], snippets: [['project','tag'],['target','tag'],['name','attribute'],['message','attribute']] };
