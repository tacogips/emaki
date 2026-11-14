import type { GrammarDef, Rule } from '../grammar';
export function iniLike(o: { name: string; comments: readonly string[]; sections?: RegExp; keyValue: RegExp; valueRules?: readonly Rule[] }): GrammarDef {
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return { name: o.name, states: { root: [...o.comments.map(comment => ({ match: new RegExp(esc(comment) + '.*'), tag: 'comment' as const })), { match: o.sections ?? /^\s*\[[^\]]+\]/, tag: 'type' }, { match: o.keyValue, tag: ['property', 'operator'] }, ...(o.valueRules ?? [{ match: /"(?:\\.|[^"])*"|'(?:\\.|[^'])*'/, tag: 'string' as const }, { match: /\b\d+(?:\.\d+)?\b/, tag: 'number' as const }])] } };
}
