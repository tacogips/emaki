// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { compileGrammar } from '../../../src/language/grammar';
import { markdownLanguage, createMarkdownLanguage } from '../../../src/language/langs/markdown';
import { restructuredtextLanguage } from '../../../src/language/langs/restructuredtext';
import { textileLanguage } from '../../../src/language/langs/textile';
import { latexLanguage } from '../../../src/language/langs/latex';
import { texLanguage } from '../../../src/language/langs/tex';
import { bibtexLanguage } from '../../../src/language/langs/bibtex';
import { rdLanguage } from '../../../src/language/langs/rd';
import { diffLanguage } from '../../../src/language/langs/diff';
import { yamlLanguage } from '../../../src/language/langs/yaml';
import { hamlLanguage } from '../../../src/language/langs/haml';
import { plaintextLanguage } from '../../../src/language/langs/plaintext';
import { jsonLanguage } from '../../../src/language/langs/json';
import { docsMarkupExpectations } from '../expectations/docs-markup';
import { checkFixture, readFixture } from '../support/fixture-check';
import type { LineLanguage } from '../../../src/types';
const langs: Record<string, LineLanguage<string>> = {markdown:markdownLanguage,restructuredtext:restructuredtextLanguage,textile:textileLanguage,latex:latexLanguage,tex:texLanguage,bibtex:bibtexLanguage,rd:rdLanguage,diff:diffLanguage,yaml:yamlLanguage,haml:hamlLanguage,json:jsonLanguage};
function lines(lang: LineLanguage<string>, input: string[]) { let state=lang.startState(); return input.map(text=>{ const result=lang.tokenizeLine(text,state); state=result.state; return result; }); }
describe('docs and markup',()=>{
 for (const exp of docsMarkupExpectations) it(exp.id,async()=>checkFixture(langs[exp.id]!,await readFixture(`${exp.id}.${exp.ext}`),exp));
 it('embeds known fences, falls back for unknown and resumes prose',()=>{
  const tiny=compileGrammar({name:'tiny',states:{root:[{match:/word/,tag:'keyword'}]}});
  const lang=createMarkdownLanguage(info=> info==='json' ? jsonLanguage : info==='t' ? tiny : undefined);
  for (const [input,tag] of [[['```json','{"a": 1}','```','# H'],'json-key'],[['```nope','x','```','# H'],'string'],[['~~~t','word','~~~','# H'],'keyword']] as const) {
   const out=lines(lang,[...input]); expect(out[1]!.tokens.some(t=>t.tag===tag)).toBe(true); expect(out[3]!.tokens[0]?.tag).toBe('heading');
  }
  const longer=lines(lang,['````','```','````','# H']); expect(longer[1]!.tokens[0]?.tag).toBe('string'); expect(longer[3]!.tokens[0]?.tag).toBe('heading');
  expect(lines(markdownLanguage,['```json','{"a":1}','```'])[1]!.tokens[0]?.tag).toBe('string');
 });
 it('handles diff, yaml blocks, and plaintext',()=>{
  expect(lines(diffLanguage,['+a','-b','@@ -1 +1 @@']).map(x=>x.tokens[0]?.tag)).toEqual(['inserted','deleted','meta']);
  const y=lines(yamlLanguage,['k: |','  text','j: 1']); expect(y[1]!.tokens[0]?.tag).toBe('string'); expect(y[2]!.tokens[0]?.tag).toBe('property');
  expect(plaintextLanguage.tokenizeLine('anything', '')).toEqual({tokens:[],state:''});
 });
});
