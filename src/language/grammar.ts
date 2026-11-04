import type { LineLanguage, LineToken } from '../types';
import type { StandardTag } from './tags';

export interface Rule { match: RegExp; tag?: StandardTag | readonly (StandardTag | undefined)[]; push?: string; pop?: true; next?: string; embed?: EmbedSpec }
export interface EmbedSpec { language: LineLanguage<string> | ((m: RegExpExecArray) => LineLanguage<string> | undefined); end: RegExp | ((endArg: string) => RegExp); endArg?: (m: RegExpExecArray) => string; fallbackTag?: StandardTag }
export interface GrammarDef { name: string; start?: string; states: Record<string, readonly Rule[]>; eolPop?: readonly string[] }

function regex(re: RegExp, flag: string, indices = false): RegExp {
  return new RegExp(re.source, [...new Set((re.flags.replace(/[gmyd]/g, '') + flag + (indices ? 'd' : '')).split(''))].join(''));
}
export function compileGrammar(def: GrammarDef): LineLanguage<string> {
  const start = def.start ?? 'root';
  const states: Record<string, (Rule & { compiled: RegExp })[]> = {};
  for (const [name, rules] of Object.entries(def.states)) {
    if (!/^[\w-]+$/.test(name)) throw new Error(`Invalid state: ${name}`);
    states[name] = rules.map(rule => {
      for (const target of [rule.push, rule.next]) if (target && !(target in def.states)) throw new Error(`Unknown state: ${target}`);
      return { ...rule, compiled: regex(rule.match, 'y', Array.isArray(rule.tag)) };
    });
  }
  if (!(start in states)) throw new Error(`Unknown start state: ${start}`);
  const dynamic = new Map<string, LineLanguage<string>>();
  return { kind: 'lines', name: def.name, startState: () => start, sameState: (a, b) => a === b,
    tokenizeLine(text, input) {
      const sep = input.indexOf('\u0001');
      const stack = (sep < 0 ? input : input.slice(0, sep)).split('/');
      let key = '', inner = '';
      if (sep >= 0) { const second = input.indexOf('\u0002', sep + 1); key = input.slice(sep + 1, second); inner = input.slice(second + 1); }
      const tokens: LineToken[] = [];
      const boundary = (at: number) => !(at > 0 && at < text.length && /[\uD800-\uDBFF]/.test(text[at - 1]!) && /[\uDC00-\uDFFF]/.test(text[at]!));
      const emit = (from: number, to: number, tag: string) => { const last = tokens[tokens.length - 1]; if (to <= from || !boundary(from) || !boundary(to) || (last && from < last.to)) return; if (last && last.to === from && last.tag === tag) last.to = to; else tokens.push({ from, to, tag }); };
      let pos = 0;
      let zeroPos = -1; const zeroRules = new Set<string>();
      while (pos < text.length) {
        if (pos !== zeroPos) { zeroPos = pos; zeroRules.clear(); }
        if (key) {
          const colon = key.indexOf(':'); const dot = key.lastIndexOf('.', colon); const second = key.indexOf(':', colon + 1);
          const rule = states[key.slice(0, dot)]?.[Number(key.slice(dot + 1, colon))];
          const spec = rule?.embed;
          if (!spec) { key = ''; continue; }
          const arg = key.slice(second + 1); const end = regex(typeof spec.end === 'function' ? spec.end(arg) : spec.end, 'g');
          end.lastIndex = pos; let found = end.exec(text);
          while (found && (!boundary(found.index) || !boundary(found.index + found[0].length))) { end.lastIndex = found.index + 1; found = end.exec(text); }
          const limit = found?.index ?? text.length;
          const lang = typeof spec.language === 'function' ? dynamic.get(key) : spec.language;
          if (limit > pos) {
            if (lang) { const result = lang.tokenizeLine(text.slice(pos, limit), inner); for (const t of result.tokens) emit(pos + t.from, pos + t.to, t.tag); inner = result.state; }
            else emit(pos, limit, spec.fallbackTag ?? 'string');
          }
          pos = limit;
          if (found) { key = ''; inner = ''; continue; }
          break;
        }
        const current = stack[stack.length - 1]!; const rules = states[current] ?? [];
        let matched = false;
        for (let i = 0; i < rules.length; i++) {
          const rule = rules[i]!; rule.compiled.lastIndex = pos; const m = rule.compiled.exec(text); if (!m) continue;
          const endPos = pos + m[0].length;
          if (!boundary(endPos)) continue;
          const changes = (rule.pop && stack.length > 1) || rule.push || (rule.next && rule.next !== current);
          if (!m[0].length && !changes && !rule.embed) continue;
          const zeroRule = `${current}.${i}`;
          if (!m[0].length && zeroRules.has(zeroRule)) continue;
          let embedKey = '', embedLanguage: LineLanguage<string> | undefined;
          if (rule.embed) {
            const spec = rule.embed; const arg = spec.endArg?.(m) ?? '';
            embedLanguage = typeof spec.language === 'function' ? spec.language(m) : spec.language;
            embedKey = `${current}.${i}:${embedLanguage?.name ?? ''}:${arg}`;
            const end = regex(typeof spec.end === 'function' ? spec.end(arg) : spec.end, 'g'); end.lastIndex = endPos;
            if (!m[0].length && end.exec(text)?.index === pos) continue;
            if (typeof spec.language === 'function' && embedLanguage) dynamic.set(embedKey, embedLanguage);
          }
          if (typeof rule.tag === 'string') emit(pos, endPos, rule.tag);
          else if (rule.tag) { const indices = (m as RegExpExecArray & { indices?: ([number, number] | undefined)[] }).indices; for (let j = 0; j < rule.tag.length; j++) { const span = indices?.[j + 1]; const tag = rule.tag[j]; if (span && tag) emit(span[0], span[1], tag); } }
          if (rule.pop && stack.length > 1) stack.pop();
          if (rule.push) stack.push(rule.push); else if (rule.next) stack[stack.length - 1] = rule.next;
          pos = endPos; matched = true;
          if (!m[0].length) zeroRules.add(zeroRule);
          if (rule.embed) { key = embedKey; inner = embedLanguage?.startState() ?? ''; }
          break;
        }
        if (!matched) pos += (text.codePointAt(pos) ?? 0) > 0xffff ? 2 : 1;
      }
      while (stack.length > 1 && def.eolPop?.includes(stack[stack.length - 1]!)) stack.pop();
      return { tokens, state: stack.join('/') + (key ? `\u0001${key}\u0002${inner}` : '') };
    },
  };
}
