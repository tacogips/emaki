import type { GrammarDef, Rule } from '../grammar';
export function lispLike(o: { name: string; specialForms: readonly string[]; constants?: readonly string[]; lineComment?: string; blockComment?: readonly [string, string] }): GrammarDef {
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const root: Rule[] = [{ match: new RegExp(esc(o.lineComment ?? ';') + '.*'), tag: 'comment' }, { match: /"/, tag: 'string', push: 'string' }, { match: /:[\w-]+/, tag: 'constant' }, { match: /\b\d+(?:\.\d+)?\b/, tag: 'number' }];
  if (o.specialForms.length) root.unshift({ match: new RegExp(`(\\()(${o.specialForms.map(esc).join('|')})(?=\\s|\\))`), tag: ['punctuation', 'keyword'] });
  if (o.constants?.length) root.push({ match: new RegExp(`\\b(?:${o.constants.map(esc).join('|')})\\b`), tag: 'constant' });
  const states: Record<string, readonly Rule[]> = { root, string: [{ match: /\\./, tag: 'escape' }, { match: /"/, tag: 'string', pop: true }, { match: /./, tag: 'string' }] };
  if (o.blockComment) { root.unshift({ match: new RegExp(esc(o.blockComment[0])), tag: 'comment', push: 'comment' }); states.comment = [{ match: new RegExp(esc(o.blockComment[1])), tag: 'comment', pop: true }, { match: /./, tag: 'comment' }]; }
  return { name: o.name, states };
}
