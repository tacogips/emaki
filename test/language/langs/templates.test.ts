// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { phpLanguage } from '../../../src/language/langs/php';
import { aspLanguage } from '../../../src/language/langs/asp';
import { jspLanguage } from '../../../src/language/langs/jsp';
import { erbLanguage } from '../../../src/language/langs/erb';
import { erlangHtmlLanguage } from '../../../src/language/langs/erlang-html';
import { tclHtmlLanguage } from '../../../src/language/langs/tcl-html';
import { templatesExpectations } from '../expectations/templates';
import { checkFixture, readFixture, tokenizeDoc } from '../support/fixture-check';
const languages = [phpLanguage, aspLanguage, jspLanguage, erbLanguage, erlangHtmlLanguage, tclHtmlLanguage];
describe('template languages', () => {
  for (const [i, language] of languages.entries()) {
    const exp = templatesExpectations[i]!;
    it(exp.id, async () => { expect(language.name).toBe(exp.id); checkFixture(language, await readFixture(`${exp.id}.${exp.ext}`), exp); });
  }
  it('resumes HTML around PHP and leaves unclosed PHP active', () => {
    const text = '<p><?php echo $x; ?></p>'; const tokens = tokenizeDoc(phpLanguage, text);
    for (const [part, tag, at] of [['p','tag',1], ['<?php','meta',3], ['$x','variable',14], ['p','tag',22]] as const) expect(tokens.some(t => t.tag === tag && t.from <= at && t.to >= at + part.length)).toBe(true);
    const unclosed = '<?php\n$a = 1;\n'; const result = tokenizeDoc(phpLanguage, unclosed);
    expect(result.some(t => t.tag === 'number' && unclosed.slice(t.from,t.to) === '1')).toBe(true);
  });
  it('keeps heredoc content until its matching terminator', () => {
    const text = '<?php\n$x = <<<EOT\nhello\nworld\nEOT;\nfunction done() {}'; const tokens = tokenizeDoc(phpLanguage, text);
    for (const [part, tag] of [['hello', 'string'], ['world', 'string'], ['function', 'keyword']] as const) { const at = text.indexOf(part); expect(tokens.some(t => t.tag === tag && t.from <= at && t.to >= at + part.length)).toBe(true); }
  });
  it('handles ERB code and HTML across lines', () => {
    const text = '<ul>\n<% items.each do |i| %>\n<li><%= i %></li>\n<% end %>'; const tokens = tokenizeDoc(erbLanguage, text);
    for (const [part, tag] of [['do','keyword'], ['li','tag'], ['end','keyword']] as const) { const at = text.indexOf(part); expect(tokens.some(t => t.tag === tag && t.from <= at && t.to >= at + part.length)).toBe(true); }
  });
  it('ends multiline JSP comments and handles empty HTML lines', () => {
    const text = '<%-- a\nb --%>\n<p>\n\n<div>'; const tokens = tokenizeDoc(jspLanguage, text);
    for (const [part, tag] of [['b --%>','comment'], ['p','tag'], ['div','tag']] as const) { const at = text.indexOf(part); expect(tokens.some(t => t.tag === tag && t.from <= at && t.to >= at + part.length)).toBe(true); }
    const root = jspLanguage.startState();
    const emptyRoot = jspLanguage.tokenizeLine('', root);
    expect(emptyRoot).toEqual({ tokens: [], state: root });
    const html = jspLanguage.tokenizeLine('<p>', root).state;
    expect(html).not.toBe(root);
    const emptyHtml = jspLanguage.tokenizeLine('', html);
    expect(emptyHtml).toEqual({ tokens: [], state: html });
    const next = jspLanguage.tokenizeLine('<div>', emptyHtml.state);
    expect(next).toEqual(jspLanguage.tokenizeLine('<div>', html));
    expect(next.tokens.some(t => t.tag === 'tag')).toBe(true);
  });
});
