import { compileGrammar } from '../grammar';
import type { LineLanguage } from '../../types';
export function createMarkdownLanguage(embedded: (fenceInfo: string) => LineLanguage<string> | undefined): LineLanguage<string> {
  return compileGrammar({ name: 'markdown', states: {
    root: [
      { match: /^( {0,3})(`{3,}|~{3,})[ \t]*([^\s`]*)?.*$/, tag: [undefined, 'punctuation', 'meta'], push: 'fence', embed: { language: m => { const language = embedded(m[3] ?? ''); return language?.name === 'markdown' ? undefined : language; }, endArg: m => m[2]!, end: arg => new RegExp('^ {0,3}' + (arg[0] === '~' ? '~' : '`') + '{' + arg.length + ',}[ \t]*$') } },
      { match: /^#{1,6}(?:[ \t]+.*|$)/, tag: 'heading' },
      { match: /<!--.*?-->/, tag: 'comment' },
      { match: /\*\*[^*]+\*\*/, tag: 'strong' }, { match: /(?:\*[^*]+\*|_[^_]+_)/, tag: 'emphasis' },
      { match: /`[^`]+`/, tag: 'string' }, { match: /\[[^\]]+\]\([^)]+\)/, tag: 'link' },
      { match: /^\s*(?:>|[-*](?=\s)|\d+\.(?=\s))/, tag: 'punctuation' },
    ], fence: [{ match: /^ {0,3}(?:`{3,}|~{3,})[ \t]*$/, tag: 'punctuation', pop: true }],
  } });
}
export const markdownLanguage = createMarkdownLanguage(() => undefined);
