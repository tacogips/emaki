import { compileGrammar } from '../grammar';
import { markupLike } from '../families/markup-like';
import { javascriptLanguage } from './javascript';
import { typescriptLanguage } from './typescript';
import { cssLanguage } from './css';
// Opening tags spanning lines retain markup highlighting without entering the embedded language.
export const vueLanguage = compileGrammar(markupLike({ name: 'vue', caseInsensitive: true, embeds: { script: javascriptLanguage, style: cssLanguage }, extra: { root: [
  { match: /<script\b(?=[^>]*\blang\s*=\s*["']ts["'])[^>]*>/i, tag: 'tag', embed: { language: typescriptLanguage, end: /<\/script\s*>/i } },
  { match: /\{\{/, tag: 'punctuation', embed: { language: javascriptLanguage, end: /\}\}/ } },
  { match: /\}\}/, tag: 'punctuation' },
] } }));
