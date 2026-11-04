import { describe, expect, it } from 'vitest';
import { compileGrammar } from '../../src/language/grammar';
import { cLike } from '../../src/language/families/c-like';

describe('grammar engine', () => {
  it('terminates zero-width state cycles and does not split astral characters', () => {
    const cycle = compileGrammar({ name: 'cycle', states: { root: [{ match: /(?=x)/, next: 'other' }], other: [{ match: /(?=x)/, next: 'root' }] } });
    expect(cycle.tokenizeLine('xx', 'root').state).toBe('root');
    const astral = compileGrammar({ name: 'astral', states: { root: [{ match: /./, tag: 'comment' }] } });
    expect(astral.tokenizeLine('😀x', 'root').tokens).toEqual([{ from: 2, to: 3, tag: 'comment' }]);
  });
  it('carries multiline state, captures, zero-width rules and astral text', () => {
    const g = compileGrammar({ name: 'test', states: { root: [{ match: /(?=x)/ }, { match: /(let)\s+(\w+)/, tag: ['keyword', 'variable'] }, { match: /"/, tag: 'string', push: 'str' }, { match: /x/, tag: 'variable' }], str: [{ match: /"/, tag: 'string', pop: true }, { match: /./, tag: 'string' }] } });
    expect(g.tokenizeLine('😀x let foo', 'root').tokens).toEqual([{ from: 2, to: 3, tag: 'variable' }, { from: 4, to: 7, tag: 'keyword' }, { from: 8, to: 11, tag: 'variable' }]);
    const a = g.tokenizeLine('"a', 'root'); expect(a.state).toBe('root/str'); expect(g.tokenizeLine('b"', a.state)).toEqual({ tokens: [{ from: 0, to: 2, tag: 'string' }], state: 'root' });
    expect(() => compileGrammar({ name: 'bad', states: { root: [{ match: /x/, push: 'missing' }] } })).toThrow();
    const eol = compileGrammar({ name: 'eol', states: { root: [{ match: /#/, push: 'comment' }], comment: [{ match: /./, tag: 'comment' }] }, eolPop: ['comment'] }); expect(eol.tokenizeLine('#hi', 'root').state).toBe('root');
  });
  it('supports static and unresolved dynamic embeds and closing delimiters', () => {
    const inner = compileGrammar({ name: 'inner', states: { root: [{ match: /\w+/, tag: 'variable' }] } });
    const host = compileGrammar({ name: 'host', states: { root: [{ match: /<x>/, tag: 'tag', embed: { language: inner, end: /<\/x>/ } }, { match: /<\/x>/, tag: 'tag' }] } });
    expect(host.tokenizeLine('<x>abc</x>', 'root').tokens).toEqual([{ from: 0, to: 3, tag: 'tag' }, { from: 3, to: 6, tag: 'variable' }, { from: 6, to: 10, tag: 'tag' }]);
    const a = host.tokenizeLine('<x>', 'root'); const b = host.tokenizeLine('abc', a.state); expect(b.state).toContain('\u0001'); expect(host.tokenizeLine('</x>', b.state).state).toBe('root');
    for (const fallbackTag of [undefined, 'meta'] as const) { const g = compileGrammar({ name: 'dynamic', states: { root: [{ match: /</, embed: { language: () => undefined, end: />/, fallbackTag } }] } }); expect(g.tokenizeLine('<body>', 'root').tokens[0]?.tag).toBe(fallbackTag ?? 'string'); }
    const zero = compileGrammar({ name: 'zero', states: { root: [{ match: /(?=x)/, embed: { language: inner, end: /x/ } }] } }); expect(zero.tokenizeLine('xx', 'root').state).toBe('root');
  });
  it('round trips nested embeds and dynamic resolved language', () => {
    const inner = compileGrammar({ name: 'inner', states: { root: [{ match: /\w+/, tag: 'variable' }] } });
    const mid = compileGrammar({ name: 'mid', states: { root: [{ match: /\[/, embed: { language: () => inner, end: /\]/ } }, { match: /\]/, tag: 'punctuation' }] } });
    const outer = compileGrammar({ name: 'outer', states: { root: [{ match: /</, embed: { language: mid, end: />/ } }, { match: />/, tag: 'tag' }] } });
    const state = outer.tokenizeLine('<[', 'root').state; expect(state.match(/\u0001/g)).toHaveLength(2); const result = outer.tokenizeLine('hello]>', state); expect(result).toEqual(outer.tokenizeLine('hello]>', state)); expect(result.state).toBe('root'); expect(result.tokens[0]?.tag).toBe('variable');
  });
  it('scans comment transitions beyond offset 4096', () => {
    const g = compileGrammar(cLike({ name: 'c', keywords: [] }));
    const closed = g.tokenizeLine('/*' + 'a'.repeat(5000) + '*/', 'root'); expect(g.tokenizeLine('x', closed.state).tokens).toEqual([]);
    const opened = g.tokenizeLine('a'.repeat(5000) + '/*', 'root'); expect(g.tokenizeLine('x', opened.state).tokens[0]?.tag).toBe('comment');
  });
  it('closes a script embed beyond offset 4096', () => {
    const inner = compileGrammar({ name: 'script', states: { root: [{ match: /a+/, tag: 'variable' }] } });
    const host = compileGrammar({ name: 'host', states: { root: [{ match: /<script>/, embed: { language: inner, end: /<\/script>/ } }, { match: /<\/script>/, tag: 'tag' }] } });
    const result = host.tokenizeLine('<script>' + 'a'.repeat(5000) + '</script>', 'root');
    expect(result.state).toBe('root');
    expect(result.tokens.at(-1)).toEqual({ from: 5008, to: 5017, tag: 'tag' });
  });
});
