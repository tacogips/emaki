// Heredoc delimiters are carried in the embed end argument; the host consumes the closing line.
import type { GrammarDef, Rule } from '../grammar';
export function shellLike(o: { name: string; keywords: readonly string[]; builtins: readonly string[]; comment?: string; variables: RegExp; heredoc?: boolean; caseInsensitive?: boolean }): GrammarDef {
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); const flags = o.caseInsensitive ? 'i' : '';
  const root: Rule[] = [];
  if (o.heredoc) root.push({ match: /<<-?['"]?([A-Za-z_]\w*)['"]?/, tag: 'operator', embed: { language: () => undefined, endArg: m => m[1]!, end: arg => new RegExp(`^\\s*${esc(arg)}\\s*$`), fallbackTag: 'string' } });
  root.push({ match: new RegExp(esc(o.comment ?? '#') + '.*'), tag: 'comment' }, { match: o.variables, tag: 'variable' }, { match: /\$\(|\)/, tag: 'punctuation' }, { match: /'/, tag: 'string', push: 'single' }, { match: /"/, tag: 'string', push: 'double' });
  for (const [list, tag] of [[o.keywords, 'keyword'], [o.builtins, 'function']] as const) if (list.length) root.push({ match: new RegExp(`\\b(?:${list.map(esc).join('|')})\\b`, flags), tag });
  root.push({ match: /\b\d+(?:\.\d+)?\b/, tag: 'number' });
  return { name: o.name, states: { root, single: [{ match: /'/, tag: 'string', pop: true }, { match: /./, tag: 'string' }], double: [{ match: /"/, tag: 'string', pop: true }, { match: o.variables, tag: 'variable' }, { match: /\\./, tag: 'escape' }, { match: /./, tag: 'string' }] }, eolPop: ['single', 'double'] };
}
