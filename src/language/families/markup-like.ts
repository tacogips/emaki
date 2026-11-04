import type { LineLanguage } from '../../types';
import type { GrammarDef, Rule } from '../grammar';
export function markupLike(o: { name: string; caseInsensitive?: boolean; embeds?: { script?: LineLanguage<string>; style?: LineLanguage<string> }; extra?: { root?: readonly Rule[]; states?: Record<string, readonly Rule[]> } }): GrammarDef {
  const flags = o.caseInsensitive ? 'i' : ''; const root: Rule[] = [...(o.extra?.root ?? [])];
  for (const name of ['script', 'style'] as const) { const language = o.embeds?.[name]; if (language) root.push({ match: new RegExp(`<${name}\\b[^>]*>`, flags), tag: 'tag', embed: { language, end: new RegExp(`</${name}\\s*>`, 'i') } }); }
  root.push({ match: /<!--/, tag: 'comment', push: 'comment' }, { match: /<!DOCTYPE\b[^>]*>|<\?xml\b[^>]*\?>/i, tag: 'meta' }, { match: /<\/?[\w:.-]+/, tag: 'tag', push: 'tag' }, { match: /&(?:#\d+|#x[\da-f]+|\w+);/i, tag: 'escape' });
  return { name: o.name, states: { root, comment: [{ match: /-->/, tag: 'comment', pop: true }, { match: /./, tag: 'comment' }], tag: [{ match: /\/?>/, tag: 'tag', pop: true }, { match: /[\w:.-]+(?=\s*=)/, tag: 'attribute' }, { match: /"[^"]*"|'[^']*'/, tag: 'string' }], ...o.extra?.states } };
}
