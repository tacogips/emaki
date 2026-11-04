import { compileGrammar } from '../grammar';
import { markupLike } from '../families/markup-like';
import { javascriptLanguage } from './javascript';
import { cssLanguage } from './css';
export const htmlLanguage = compileGrammar(markupLike({ name: 'html', caseInsensitive: true, embeds: { script: javascriptLanguage, style: cssLanguage } }));
