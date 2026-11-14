import { compileGrammar } from '../grammar';
import { markupLike } from '../families/markup-like';
import { javascriptLanguage } from './javascript';
import { typescriptLanguage } from './typescript';
import { cssLanguage } from './css';
// Expressions end at the first closing brace; nested braces are outside the fidelity contract.
export const svelteLanguage = compileGrammar(markupLike({ name: 'svelte', caseInsensitive: true, embeds: { script: javascriptLanguage, style: cssLanguage }, extra: { root: [
  { match: /<script\b(?=[^>]*\blang\s*=\s*["']ts["'])[^>]*>/i, tag: 'tag', embed: { language: typescriptLanguage, end: /<\/script\s*>/i } },
  { match: /\{([#:/](?:if|else|each))\b/, tag: [ 'keyword' ], embed: { language: javascriptLanguage, end: /\}/ } },
  { match: /\{/, tag: 'punctuation', embed: { language: javascriptLanguage, end: /\}/ } },
  { match: /\}/, tag: 'punctuation' },
] } }));
