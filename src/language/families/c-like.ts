import type { GrammarDef, Rule } from '../grammar';
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export function cLike(o: { name: string; keywords: readonly string[]; types?: readonly string[]; constants?: readonly string[]; builtins?: readonly string[]; lineComment?: string | null; blockComment?: readonly [string, string] | null; nestedComments?: boolean; strings?: readonly string[]; charQuote?: boolean; docComments?: boolean; numbers?: RegExp; extra?: { root?: readonly Rule[]; states?: Record<string, readonly Rule[]> } }): GrammarDef {
  const root: Rule[] = [...(o.extra?.root ?? [])]; const states: Record<string, readonly Rule[]> = {}; const eolPop: string[] = [];
  const line = o.lineComment === undefined ? '//' : o.lineComment; const block = o.blockComment === undefined ? ['/*', '*/'] as const : o.blockComment;
  if (line) root.push({ match: new RegExp(esc(line) + '.*'), tag: 'comment' });
  if (block) {
    if (o.docComments) { root.push({ match: new RegExp(esc(block[0]) + '(?=\\*)'), tag: 'comment', push: 'doc-comment' }); states['doc-comment'] = [{ match: new RegExp(esc(block[1])), tag: 'comment', pop: true }, { match: /@\w+/, tag: 'meta' }, { match: /./, tag: 'comment' }]; }
    root.push({ match: new RegExp(esc(block[0])), tag: 'comment', push: 'comment' });
    states.comment = [{ match: new RegExp(esc(block[1])), tag: 'comment', pop: true }, ...(o.nestedComments ? [{ match: new RegExp(esc(block[0])), tag: 'comment' as const, push: 'comment' }] : []), { match: /./, tag: 'comment' }];
  }
  for (const [i, quote] of [...(o.strings ?? ['"']), ...(o.charQuote ? ["'"] : [])].entries()) {
    const state = `string-${i}`; root.push({ match: new RegExp(esc(quote)), tag: 'string', push: state });
    states[state] = [{ match: /\\./, tag: 'escape' }, { match: new RegExp(esc(quote)), tag: 'string', pop: true }, { match: /./, tag: 'string' }]; eolPop.push(state);
  }
  const words = (list: readonly string[] | undefined, tag: Rule['tag']) => { if (list?.length) root.push({ match: new RegExp(`\\b(?:${[...list].sort((a, b) => b.length - a.length).map(esc).join('|')})\\b`), tag }); };
  words(o.keywords, 'keyword'); words(o.types, 'type'); words(o.constants, 'constant'); words(o.builtins, 'function');
  root.push({ match: o.numbers ?? /\b(?:0x[\da-f_]+(?:[a-z]\w*)?|\d[\d_]*(?:\.[\d_]*)?(?:e[+-]?[\d_]+)?(?:[a-z]\w*)?)/i, tag: 'number' }, { match: /[A-Za-z_]\w*(?=\s*\()/, tag: 'function' });
  return { name: o.name, states: { root, ...states, ...o.extra?.states }, eolPop };
}
