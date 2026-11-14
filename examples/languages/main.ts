import { createEditor } from '../../src/index';
import { languages, loadLanguage } from '../../src/language/registry';
import { defaultTokenColors } from '../../src/language/tags';
import { installPerfHook } from '../json-10k/perf-hook';

declare global { interface Window { __emakiLang: { id: string; loadMs: number; resetCounters(): void; counters(): { calls: number; ms: number }; longLineMs(chars: number): number } } }
const params = new URLSearchParams(location.search);
const id = params.get('lang') || 'typescript';
const requested = Number(params.get('lines'));
const lines = [1000, 10000, 100000].includes(requested) ? requested : 10000;
const samples = import.meta.glob('../../test/fixtures/languages/*', { query: '?raw', import: 'default' });
const key = Object.keys(samples).find(path => path.split('/').pop()!.split('.')[0] === id);
if (!key) throw new Error(`Missing fixture: ${id}`);
const sample = await samples[key]!() as string;
const sampleLines = sample.replace(/\n$/, '').split('\n');
const text = Array.from({ length: lines }, (_, i) => sampleLines[i % sampleLines.length]).join('\n');
const host = document.querySelector<HTMLElement>('#editor');
const select = document.querySelector<HTMLSelectElement>('#lang');
const count = document.querySelector<HTMLElement>('#line-count');
if (!host || !select || !count) throw new Error('Language editor elements are missing');
for (const info of languages.filter(info => Object.keys(samples).some(path => path.split('/').pop()!.split('.')[0] === info.id))) { const option = document.createElement('option'); option.value = info.id; option.textContent = info.name; select.append(option); }
select.value = id;
select.addEventListener('change', () => { const url = new URL(location.href); url.searchParams.set('lang', select.value); location.assign(url.href); });
count.textContent = `${lines.toLocaleString()} lines`;
const t0 = performance.now();
const lang = await loadLanguage(id);
const loadMs = performance.now() - t0;
let calls = 0, ms = 0;
const wrapped = { ...lang, tokenizeLine(text: string, state: string) { const start = performance.now(); const result = lang.tokenizeLine(text, state); calls++; ms += performance.now() - start; return result; } };
const handle = createEditor(host, { language: wrapped, theme: { tokens: defaultTokenColors } });
window.__emakiLang = { id, loadMs, resetCounters() { calls = 0; ms = 0; }, counters() { return { calls, ms }; }, longLineMs(chars) { const seed = sampleLines.find(line => line.length > 0) || ' '; const line = seed.repeat(Math.ceil(chars / seed.length)).slice(0, chars); const start = performance.now(); lang.tokenizeLine(line, lang.startState()); return performance.now() - start; } };
const hook = installPerfHook(handle, text);
if (params.get('autoload') !== '0') void hook.load();
