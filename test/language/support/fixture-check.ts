import { ChangeSet, Text } from '@codemirror/state';
import { expect } from 'vitest';
import type { LineLanguage, TokenSpan } from '../../../src/types';
import { IncrementalHighlighter } from '../../../src/language/incremental';
export interface LanguageExpectation { id: string; ext: string; classes: readonly string[]; snippets: readonly (readonly [snippet: string, tag: string])[] }
const make = (lang: LineLanguage<string>) => new IncrementalHighlighter(lang, { maxLinesPerFrame: 1e9, maxMsPerFrame: 1e9 });
export function tokenizeDoc(lang: LineLanguage<string>, text: string): TokenSpan[] { const doc = Text.of(text.split('\n')); const highlighter = make(lang); highlighter.setDoc(doc); const tokens = highlighter.tokens(0, doc.lines); expect(highlighter.approximate).toBe(false); return tokens; }
export function checkFixture(lang: LineLanguage<string>, sample: string, exp: LanguageExpectation): void {
  const check = (text: string, tokens: TokenSpan[]) => { for (const tag of exp.classes) expect(tokens.some(t => t.tag === tag)).toBe(true); for (const [snippet, tag] of exp.snippets) { const at = text.indexOf(snippet); expect(at).toBeGreaterThanOrEqual(0); expect(tokens.some(t => t.tag === tag && t.from <= at && t.to >= at + snippet.length)).toBe(true); } let last = 0; for (const t of tokens) { expect(t.from).toBeGreaterThanOrEqual(last); expect(t.to).toBeGreaterThan(t.from); expect(t.to).toBeLessThanOrEqual(text.length); last = t.to; } };
  const doc = Text.of(sample.split('\n')); const h = make(lang); h.setDoc(doc); check(sample, h.tokens(0, doc.lines)); expect(h.approximate).toBe(false);
  const at = doc.line(Math.floor(doc.lines / 2) + 1).to; const changes = ChangeSet.of([{ from: at, insert: ' ' }], doc.length); const next = changes.apply(doc); h.applyChanges(changes, next); const tokens = h.tokens(0, next.lines); expect(h.approximate).toBe(false); expect(tokens).toEqual(tokenizeDoc(lang, next.toString())); check(next.toString(), tokens);
}
interface NodeFs { readFileSync(path: string, encoding: 'utf8'): string }
const nodeFsModule = 'node:fs';
export async function readFixture(file: string): Promise<string> { const fs = await import(/* @vite-ignore */ nodeFsModule) as NodeFs; return fs.readFileSync(new URL('../../fixtures/languages/' + file, import.meta.url).pathname, 'utf8'); }
