// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { javascriptLanguage } from '../../../src/language/langs/javascript';
import { typescriptLanguage } from '../../../src/language/langs/typescript';
import { jsxLanguage } from '../../../src/language/langs/jsx';
import { tsxLanguage } from '../../../src/language/langs/tsx';
import { cssLanguage } from '../../../src/language/langs/css';
import { htmlLanguage } from '../../../src/language/langs/html';
import { xmlLanguage } from '../../../src/language/langs/xml';
import { vueLanguage } from '../../../src/language/langs/vue';
import { svelteLanguage } from '../../../src/language/langs/svelte';
import { webExpectations, nantExpectation } from '../expectations/web';
import { checkFixture, readFixture, tokenizeDoc } from '../support/fixture-check';
const languages = { javascript: javascriptLanguage, typescript: typescriptLanguage, jsx: jsxLanguage, tsx: tsxLanguage, css: cssLanguage, html: htmlLanguage, xml: xmlLanguage, vue: vueLanguage, svelte: svelteLanguage };
describe('web fixtures', () => {
  for (const e of webExpectations) it(e.id, async () => checkFixture(languages[e.id as keyof typeof languages], await readFixture(`${e.id}.${e.ext}`), e));
  it('nant', async () => checkFixture(xmlLanguage, await readFixture('nant.build'), nantExpectation));
  it('distinguishes regular expressions from division', () => {
    const text = 'const r = /=+/; const d = a / b / c;';
    const tokens = tokenizeDoc(javascriptLanguage, text).filter(t => t.tag === 'regexp');
    expect(tokens.map(t => text.slice(t.from, t.to))).toEqual(['/=+/']);
  });
  it('handles multiline templates and nested expression braces', () => {
    const text = 'const t = `a${ {k:1}.k }b`; const n = 2;\nconst u = `one\ntwo\nthree`;';
    const tokens = tokenizeDoc(javascriptLanguage, text);
    expect(tokens.some(t => t.tag === 'string' && text.slice(t.from,t.to).includes('two'))).toBe(true);
    const at = text.indexOf('const n');
    expect(tokens.some(t => t.tag === 'keyword' && t.from === at)).toBe(true);
  });
  it('embeds HTML and returns to markup', () => {
    const text = '<script>\nlet x = 1;\n</script>\n<p class="a">\n<style>a{color:red}</style>';
    const tokens = tokenizeDoc(htmlLanguage, text);
    for (const [word, tag] of [['let','keyword'],['script','tag'],['class','attribute'],['color','property']]) {
      const at = word === 'script' ? text.indexOf('script', text.indexOf('</')) : text.indexOf(word!);
      expect(tokens.some(t => t.tag === tag && t.from <= at && t.to >= at + word!.length)).toBe(true);
    }
  });
  it('embeds TypeScript and JSX expressions', () => {
    const vue = '<script lang="ts">\nlet x: unknown;\n</script>';
    expect(tokenizeDoc(vueLanguage, vue).some(t => t.tag === 'type' && vue.slice(t.from,t.to) === 'unknown')).toBe(true);
    const text = 'return <Button onClick={() => go(1)}>Hi</Button>;';
    const tokens = tokenizeDoc(tsxLanguage, text);
    for (const [word, tag] of [['Button','tag'],['onClick','attribute'],['1','number']]) {
      const at = text.indexOf(word!); expect(tokens.some(t => t.tag === tag && t.from <= at && t.to >= at + word!.length)).toBe(true);
    }
  });
  it('keeps division distinct inside template and JSX expressions', () => {
    for (const [language, text] of [[javascriptLanguage, 'const t = `${a / b / c}`;'], [jsxLanguage, 'return <p>{a / b / c}</p>;']] as const) {
      expect(tokenizeDoc(language, text).filter(t => t.tag === 'regexp')).toEqual([]);
    }
  });
  it('highlights JSX fragments and their children', () => {
    const text = 'return <><Button title="ok" /></>;';
    const tokens = tokenizeDoc(jsxLanguage, text);
    const at = text.indexOf('title');
    expect(tokens.some(t => t.tag === 'attribute' && t.from <= at && t.to >= at + 5)).toBe(true);
  });
  it('distinguishes CSS ID selectors from colors', () => {
    const text = '#abc { color: #fff; }'; const tokens = tokenizeDoc(cssLanguage, text);
    for (const [word, tag] of [['#abc', 'attribute'], ['#fff', 'constant']]) {
      const at = text.indexOf(word!); expect(tokens.some(t => t.tag === tag && t.from <= at && t.to >= at + word!.length)).toBe(true);
    }
  });
  it('recognizes script and style variations and template expressions', () => {
    const cases = [
      [htmlLanguage, '<SCRIPT type="module">let value = 1;</SCRIPT>', 'let', 'keyword'],
      [vueLanguage, '<style lang="scss">a{color:red}</style>{{ return 1 }}', 'return', 'keyword'],
      [svelteLanguage, '<script lang="ts">interface Box { value: unknown }</script>', 'unknown', 'type'],
      [svelteLanguage, '{#if true}{return 1}{:else}{/if}', '#if', 'keyword'],
      [javascriptLanguage, 'value;\n/a+b/g.test(value)', '/a+b/g', 'regexp'],
      [typescriptLanguage, 'function f<T>(x: T) {}', '<', 'punctuation'],
    ] as const;
    for (const [language, text, word, tag] of cases) {
      const at = text.indexOf(word); expect(tokenizeDoc(language, text).some(t => t.tag === tag && t.from <= at && t.to >= at + word.length)).toBe(true);
    }
  });

});
