import type { LanguageExpectation } from '../support/fixture-check';
export const templatesExpectations: readonly LanguageExpectation[] = [
  { id: 'php', ext: 'php', classes: ['tag','meta','keyword','variable','number','comment','string'], snippets: [['<?php','meta'], ['$x','variable'], ['function','keyword'], ['42','number']] },
  { id: 'asp', ext: 'asp', classes: ['tag','meta','keyword','number','comment','string'], snippets: [['Dim','keyword'], ['42','number'], ["' comment",'comment'], ['"hello"','string']] },
  { id: 'jsp', ext: 'jsp', classes: ['tag','meta','keyword','number','comment','string'], snippets: [['<%@ page language="java" %>','meta'], ['b --%>','comment'], ['42','number'], ['"hello"','string']] },
  { id: 'erb', ext: 'erb', classes: ['tag','meta','keyword','number','comment','string'], snippets: [['do','keyword'], ['end','keyword'], ['<%# comment %>','comment'], ['42','number']] },
  { id: 'erlang-html', ext: 'yaws', classes: ['tag','meta','keyword','number','comment','string'], snippets: [['<erl>','meta'], ['case','keyword'], ['42','number'], ['% comment','comment']] },
  { id: 'tcl-html', ext: 'adp', classes: ['tag','meta','keyword','number','comment','string'], snippets: [['set','keyword'], ['42','number'], ['# comment','comment'], ['"hello"','string']] },
];
