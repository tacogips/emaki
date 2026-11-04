import { ChangeSet, Text } from '@codemirror/state';
import { expect, it } from 'vitest';
import { loadLanguage } from '../../src/language/registry';
import { IncrementalHighlighter } from '../../src/language/incremental';
import { tokenizeDoc } from './support/fixture-check';
const A = 'a'.repeat(4097);
it('preserves C comment state and incremental edits beyond 4096', async () => {
 const lang = await loadLanguage('c'); let text = `/*${A}*/\nint answer = 42;`; let doc = Text.of(text.split('\n')); const h = new IncrementalHighlighter(lang,{maxLinesPerFrame:1e9,maxMsPerFrame:1e9}); h.setDoc(doc);
 const check = () => { const tokens = h.tokens(0,doc.lines); expect(tokens).toEqual(tokenizeDoc(lang,text)); const start = text.indexOf('int answer'); expect(tokens.some(t=>t.from===start && t.tag==='keyword')).toBe(true); expect(tokens.some(t=>t.from===text.indexOf('42') && t.tag==='number')).toBe(true); }; check();
 const edit = (from:number,to:number,insert:string) => {const changes=ChangeSet.of([{from,to,insert}],doc.length); doc=changes.apply(doc); h.applyChanges(changes,doc); text=doc.toString(); check();}; let p=text.indexOf('*/'); edit(p,p,'bb'); edit(p,p+2,'');
 text = `${A}/*\nint x;`; const start=text.indexOf('int x;'); expect(tokenizeDoc(lang,text).some(t=>t.from===start && t.to===text.length && t.tag==='comment')).toBe(true);
});
it('closes long HTML script and Markdown fences', async () => {
 const html = `<script>${A}</script>\n<p class="x">`; const tokens = tokenizeDoc(await loadLanguage('html'),html); for (const [snippet,tag] of [['p','tag'],['class','attribute']]) { const pos = html.lastIndexOf(snippet!); expect(tokens.some(t=>t.from<=pos && t.to>=pos+snippet!.length && t.tag===tag)).toBe(true); }
 const md = '```ts\n' + 'a'.repeat(5000) + '\n```\n# h'; const pos=md.indexOf('# h'); expect(tokenizeDoc(await loadLanguage('markdown',{embedded:['ts']}),md).some(t=>t.from===pos && t.tag==='heading')).toBe(true);
});
