import { ChangeSet, Text } from '@codemirror/state';
import { expect, it } from 'vitest';
import { loadLanguage } from '../../src/language/registry';
import { IncrementalHighlighter } from '../../src/language/incremental';
import { tokenizeDoc } from './support/fixture-check';
import type { LineLanguage } from '../../src/types';
function has(lang: LineLanguage<string>, text: string, snippet: string, tag: string) { const at = text.indexOf(snippet); expect(at).toBeGreaterThanOrEqual(0); expect(tokenizeDoc(lang,text).some(t => t.from <= at && t.to >= at + snippet.length && t.tag === tag), `${snippet}: ${tag}`).toBe(true); }
it('loads selected markdown fences and restores markdown', async () => {
 const lang = await loadLanguage('markdown',{embedded:['ts','python']}); const text = '```ts\ninterface X {}\n```\n```rust\nfn main() {}\n```\n# x';
 has(lang,text,'interface','keyword'); has(lang,text,'fn main() {}','string'); has(lang,text,'# x','heading');
 has(await loadLanguage('markdown',{embedded:'all'}),'```rust\nfn main() {}\n```','fn','keyword');
});
it('highlights embedded host languages', async () => {
 has(await loadLanguage('html'),'<script>const x = 1;</script>','const','keyword'); has(await loadLanguage('html'),'<style>p { color: red; }</style>','color','property');
 has(await loadLanguage('vue'),'<script lang="ts">let x: unknown;</script>','unknown','type'); has(await loadLanguage('vue'),'{{ a + 1 }}','1','number');
 has(await loadLanguage('svelte'),'{a + 1}','1','number'); has(await loadLanguage('php'),'<?php $x ?>','$x','variable');
});
it('keeps incremental fence state across edits and closing fence changes', async () => {
 const lang = await loadLanguage('markdown',{embedded:['ts']}); let text = '```ts\ninterface X {}\n```\n# x'; let doc = Text.of(text.split('\n'));
 const h = new IncrementalHighlighter(lang,{maxLinesPerFrame:1e9,maxMsPerFrame:1e9}); h.setDoc(doc); h.tokens(0,doc.lines);
 const edit = (from:number,to:number,insert:string) => { const changes = ChangeSet.of([{from,to,insert}],doc.length); doc = changes.apply(doc); h.applyChanges(changes,doc); text = doc.toString(); expect(h.tokens(0,doc.lines)).toEqual(tokenizeDoc(lang,text)); };
 let pos = text.indexOf('X') + 1; edit(pos,pos,'1'); has(lang,text,'interface','keyword'); pos = text.lastIndexOf('```'); edit(pos,pos+3,''); expect(tokenizeDoc(lang,text).some(t => t.from === text.indexOf('# x') && t.tag === 'heading')).toBe(false); edit(pos,pos,'```'); has(lang,text,'# x','heading');
});
