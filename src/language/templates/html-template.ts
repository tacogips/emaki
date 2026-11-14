// HTML resumes from its start state after each server block; its prior inner state is not retained.
import type { LineLanguage } from '../../types';
import type { GrammarDef, Rule } from '../grammar';
import type { StandardTag } from '../tags';
import { htmlLanguage } from '../langs/html';
export function htmlTemplate(o: { name: string; open: RegExp; close: RegExp; server: LineLanguage<string>; openTag?: StandardTag; commentOpen?: RegExp }): GrammarDef {
  const root: Rule[] = [];
  if (o.commentOpen) root.push({ match: o.commentOpen, tag: 'comment', push: 'comment' });
  root.push({ match: o.open, tag: o.openTag ?? 'meta', push: 'server', embed: { language: o.server, end: o.close } });
  root.push({ match: /(?:)/, embed: { language: htmlLanguage, end: o.open } });
  return { name: o.name, states: { root, server: [{ match: o.close, tag: 'meta', pop: true }], comment: [{ match: o.name === 'jsp' ? /--%>/ : /%>/, tag: 'comment', pop: true }, { match: /./, tag: 'comment' }] } };
}
