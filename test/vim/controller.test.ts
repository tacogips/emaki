import { describe, expect, it } from 'vitest';
import { createVimController } from '../../src/vim/controller';
import { createVimHost } from '../support/vim-host';

const key = (key: string, metaKey = false) => ({ key, ctrlKey: false, metaKey, altKey: false, shiftKey: false });

describe('public controller', () => {
  it('reports unknown ex without editing', () => {
    const host = createVimHost('hello'), vim = createVimController(host);
    vim.handleKey(key(':')); vim.submitPrompt('foo');
    expect(vim.message).toMatch(/^E492/);
    expect(host.state.doc.toString()).toBe('hello');
  });
  it('reports a missing search', () => {
    const host = createVimHost('hello'), vim = createVimController(host);
    vim.handleKey(key('/')); vim.submitPrompt('zz');
    expect(vim.message).toMatch(/^E486/);
  });
  it('cancels a prompt without changing document or selection', () => {
    const host = createVimHost('hello'), vim = createVimController(host);
    const { doc, selection } = host.state;
    vim.handleKey(key('/')); vim.cancelPrompt();
    expect(host.state.doc).toBe(doc); expect(host.state.selection).toBe(selection);
  });
  it('passes meta keys through', () => {
    const vim = createVimController(createVimHost('hello'));
    expect(vim.handleKey(key('s', true))).toBe(false);
  });
  it('uses an optional keymap', () => {
    const host = createVimHost('abc'), vim = createVimController(host, { keymap: { version: 1, maps: { n: [{ lhs: 'Q', rhs: 'l' }] } } });
    vim.handleKey(key('Q'));
    expect(host.state.selection.main.head).toBe(1);
  });
  it('notifies once for each public state change', () => {
    const vim = createVimController(createVimHost('hello'));
    let calls = 0; vim.subscribe(() => calls++);
    vim.handleKey(key('i'));
    expect(calls).toBe(1);
  });
  it('updates and clears search marks', () => {
    const host = createVimHost('one one'), vim = createVimController(host);
    host.onUpdate = tr => vim.noteUpdate({ state: tr.state, changes: tr.changes, docChanged: tr.docChanged, selectionSet: tr.selection !== undefined });
    vim.handleKey(key('/')); vim.submitPrompt('one');
    expect(host.markSets.get('emaki-vim-search')?.map(mark => [mark.from, mark.to])).toEqual([[0, 3], [4, 7]]);
    host.dispatch({ changes: { from: 0, to: 3, insert: 'two' } });
    expect(host.markSets.get('emaki-vim-search')?.map(mark => [mark.from, mark.to])).toEqual([[4, 7]]);
    vim.handleKey(key(':')); vim.submitPrompt('noh');
    expect(host.markSets.get('emaki-vim-search')).toEqual([]);
    vim.dispose(); expect(host.markSets.has('emaki-vim-search')).toBe(false);
  });
  it('clears a message when the next command starts', () => {
    const vim = createVimController(createVimHost('hello'));
    vim.handleKey(key(':')); vim.submitPrompt('foo');
    vim.handleKey(key('l')); expect(vim.message).toBeNull();
  });
});

const scenarios = [
  ['h', 'ab|cd', ['h'], 'abcd', 1], ['j', 'ab|cd\nef', ['j'], 'abcd\nef', 6],
  ['k', 'ab\nef|gh', ['k'], 'ab\nefgh', 1], ['l', 'a|bc', ['l'], 'abc', 2],
  ['w', '|one two', ['w'], 'one two', 4], ['b', 'one |two', ['b'], 'one two', 0],
  ['e', '|one two', ['e'], 'one two', 2], ['W', '|one-two three', ['W'], 'one-two three', 8],
  ['B', 'one-two |three', ['B'], 'one-two three', 0], ['E', '|one-two three', ['E'], 'one-two three', 6],
  ['ge', 'one |two', ['g', 'e'], 'one two', 2], ['0', '  abc|', ['0'], '  abc', 0],
  ['^', '  |abc', ['^'], '  abc', 2], ['$ clamped', '|abc', ['$'], 'abc', 2],
  ['gg', 'a\nb|c', ['g', 'g'], 'a\nbc', 0], ['G', '|a\nbc', ['G'], 'a\nbc', 2],
  ['3G', '|a\nb\nc', ['3', 'G'], 'a\nb\nc', 4], ['f', '|a-b-a', ['f', 'a'], 'a-b-a', 4],
  ['F', 'a-b-|a', ['F', 'a'], 'a-b-a', 0], ['t', '|a-b', ['t', '-'], 'a-b', 0],
  ['T', 'a-b-|a', ['T', '-'], 'a-b-a', 4], [';', '|a-b-a', ['f', 'a', ';'], 'a-b-a', 4],
  [',', '|a-b-a', ['f', 'a', ','], 'a-b-a', 0], ['%', '|(x)', ['%'], '(x)', 2],
  ['}', '|a\n\nb', ['}'], 'a\n\nb', 2], ['{', 'a\n\n|b', ['{'], 'a\n\nb', 2],
  ['H', '|a\nb\nc', ['H'], 'a\nb\nc', 0], ['M', '|a\nb\nc', ['M'], 'a\nb\nc', 4],
  ['L', '|a\nb\nc', ['L'], 'a\nb\nc', 4], ['*', '|foo bar foo', ['*'], 'foo bar foo', 8],
  ['#', 'foo bar |foo', ['#'], 'foo bar foo', 0], ['counted l', '|abcdef', ['3', 'l'], 'abcdef', 3],
  ['j desired column', 'abcde|\nx\nabcde', ['j', 'j'], 'abcde\nx\nabcde', 12],
  ['k desired column', 'abcde\nx\nabc|de', ['k', 'k'], 'abcde\nx\nabcde', 3],
  ['d motion', '|one two', ['d', 'w'], 'two', 0], ['d text object', '|one two', ['d', 'i', 'w'], ' two', 0],
  ['dd', '|one\ntwo', ['d', 'd'], 'two', 0], ['c motion', '|one two', ['c', 'w'], ' two', 0],
  ['c text object', '|one two', ['c', 'i', 'w'], ' two', 0], ['cc', '|one\ntwo', ['c', 'c'], '\ntwo', 0],
  ['y motion then put', '|one two', ['y', 'w', 'p'], 'oone ne two', 4],
  ['y object then put', '|one two', ['y', 'i', 'w', 'p'], 'oonene two', 3],
  ['yy then put', '|one\ntwo', ['y', 'y', 'p'], 'one\none\ntwo', 4],
  ['> motion', '|one\ntwo', ['>', 'j'], '  one\n  two', 2],
  ['> object', '|one two', ['>', 'i', 'w'], '  one two', 2], ['>>', '|one\ntwo', ['>', '>'], '  one\ntwo', 2],
  ['visual-line indent last line', 'a\n|x', ['V', '>'], 'a\n  x', 4],
  ['visual indent single char doc', '|x', ['v', '>'], '  x', 2],
  ['< motion', '  |one\n  two', ['<', 'j'], 'one\ntwo', 0],
  ['< object', '  |one two', ['<', 'i', 'w'], 'one two', 0], ['<<', '  |one\ntwo', ['<', '<'], 'one\ntwo', 0],
  ['g~ motion', '|one two', ['g', '~', 'w'], 'ONE two', 0], ['g~ object', '|one two', ['g', '~', 'i', 'w'], 'ONE two', 0],
  ['g~~', '|one two', ['g', '~', 'g', '~'], 'ONE TWO', 0], ['gu motion', '|ONE two', ['g', 'u', 'w'], 'one two', 0],
  ['gu object', '|ONE two', ['g', 'u', 'i', 'w'], 'one two', 0], ['gugu', '|ONE two', ['g', 'u', 'g', 'u'], 'one two', 0],
  ['gU motion', '|one two', ['g', 'U', 'w'], 'ONE two', 0], ['gU object', '|one two', ['g', 'U', 'i', 'w'], 'ONE two', 0],
  ['gUgU', '|one two', ['g', 'U', 'g', 'U'], 'ONE TWO', 0], ['cw acts as ce', '|one two', ['c', 'w'], ' two', 0],
  ['cw one-grapheme word changes only that character', '|a bc', ['c', 'w', 'X', 'Escape'], 'X bc', 0],
  ['cw keeps a combining-mark grapheme intact', '|e\u0301 bc', ['c', 'w', 'X', 'Escape'], 'X bc', 0],
  ['cw from final grapheme stops at the current word end', 'a|b cd', ['c', 'w', 'X', 'Escape'], 'aX cd', 1],
  ['cw on punctuation run changes only that run', '|.. foo', ['c', 'w', 'X', 'Escape'], 'X foo', 0],
  ['cw on punctuation between words', 'a |=> b', ['c', 'w', 'X', 'Escape'], 'a X b', 2],
  ['cw on single punctuation grapheme', 'f|(x)', ['c', 'w', 'X', 'Escape'], 'fXx)', 1],
  ['counted operator', '|one two three', ['d', '2', 'w'], 'three', 0],
  ['x', 'a|bc', ['x'], 'ac', 1], ['X', 'ab|c', ['X'], 'ac', 1],
  ['s', 'a|bc', ['s', 'x', 'Escape'], 'axc', 1], ['S', 'a|bc', ['S', 'x', 'Escape'], 'x', 0],
  ['D', 'ab|cd', ['D'], 'ab', 2], ['C', 'ab|cd', ['C', 'x', 'Escape'], 'abx', 2],
  ['Y then put', '|one\ntwo', ['Y', 'p'], 'one\none\ntwo', 4], ['r', 'a|bc', ['r', 'X'], 'aXc', 1],
  ['~', '|one', ['~'], 'One', 1], ['J', '|one\ntwo', ['J'], 'one two', 3],
  ['p', 'one |two', ['y', 'w', 'p'], 'one ttwowo', 7], ['P', 'one |two', ['y', 'w', 'P'], 'one twotwo', 6],
  ['o', '|one', ['o', 'x', 'Escape'], 'one\nx', 4], ['O', '|one', ['O', 'x', 'Escape'], 'x\none', 0],
  ['a', 'a|bc', ['a', 'x', 'Escape'], 'abxc', 2], ['A', 'ab|\ncd', ['A', 'x', 'Escape'], 'abx\ncd', 2],
  ['i', 'a|bc', ['i', 'x', 'Escape'], 'axbc', 1], ['I', '  |abc', ['I', 'x', 'Escape'], '  xabc', 2],
  ['visual x', '|abcd', ['v', 'l', 'x'], 'cd', 0], ['visual X', '|abcd', ['v', 'l', 'X'], '', 0],
  ['visual s', '|abcd', ['v', 'l', 's', 'x', 'Escape'], 'xcd', 0], ['visual S', '|abcd', ['v', 'l', 'S', 'x', 'Escape'], 'x', 0],
  ['visual D', '|abcd', ['v', 'l', 'D'], '', 0], ['visual C', '|abcd', ['v', 'l', 'C', 'x', 'Escape'], 'x', 0],
  ['visual Y then put', '|one\ntwo', ['V', 'j', 'Y', 'p'], 'one\none\ntwo\ntwo', 4],
  ['visual r', '|abcd', ['v', 'l', 'r', 'X'], 'XXcd', 0], ['visual tilde', '|abc', ['v', 'l', '~'], 'ABc', 0],
  ['visual J', '|one\ntwo\nthree', ['V', 'j', 'J'], 'one two\nthree', 3],
  ['visual p', '|abcd', ['y', 'l', 'v', 'l', 'p'], 'abacd', 2], ['visual P', '|abcd', ['y', 'l', 'v', 'l', 'P'], 'aabcd', 1],
  ['visual o swap', '|abcd', ['v', 'l', 'o'], 'abcd', 0], ['visual inner-word delete', '|one two', ['v', 'i', 'w', 'd'], ' two', 0],
  ['visual around-word delete', '|one two', ['v', 'a', 'w', 'd'], 'two', 0], ['visual v exit', '|abc', ['v', 'l', 'v'], 'abc', 1],
  ['visual-line D range', '|a\nb\nc', ['V', 'j', 'D'], 'c', 0],
  ['visual-line V flow', '|abc\ndef', ['V', 'j', 'Escape'], 'abc\ndef', 4],
  ['named yank put', '|one two', ['"', 'a', 'y', 'w', '"', 'a', 'p'], 'oone ne two', 4],
  ['uppercase append', '|one two', ['"', 'a', 'y', 'w', '"', 'A', 'y', 'w', '"', 'a', 'p'], 'oone one ne two', 8],
  ['black hole preserves unnamed', '|one two', ['y', 'w', '"', '_', 'd', 'w', 'P'], 'one two', 3],
  ['zero register survives delete', '|one two', ['y', 'w', 'd', 'w', '"', '0', 'P'], 'one two', 3],
  ['` mark jump', '|abc\ndef', ['m', 'a', 'j', '`', 'a'], 'abc\ndef', 0],
  ['apostrophe mark line jump', '|abc\n  def', ['m', 'a', 'j', "'", 'a'], 'abc\n  def', 0],
  ['context mark', '|abc\ndef', ['j', 'G', "'", "'"], 'abc\ndef', 4],
  ['failed find cancels operator', '|abc', ['d', 'f', 'z'], 'abc', 0],
] as const;

function runScenario(source: string, keys: readonly string[]) {
  const cursor = source.indexOf('|'), host = createVimHost(source.replace('|', ''));
  host.viewport = { fromLine: 1, toLine: 10, top: 0, height: 400 };
  if (cursor >= 0) host.dispatch({ selection: { anchor: cursor } });
  const vim = createVimController(host);
  host.onUpdate = tr => vim.noteUpdate({ state: tr.state, changes: tr.changes, docChanged: tr.docChanged, selectionSet: tr.selection !== undefined });
  for (const value of keys) {
    if (vim.allowsTextInput() && value.length === 1) {
      const pos = host.state.selection.main.head, overwrite = vim.overwriteRange(value), from = overwrite?.from ?? pos;
      host.dispatch({ changes: { from, to: overwrite?.to ?? pos, insert: value }, selection: { anchor: from + value.length }, userEvent: 'input.type' });
    } else vim.handleKey(key(value));
  }
  return { host, vim, doc: host.state.doc.toString(), cursor: host.state.selection.main.head };
}

describe('controller reference motions and editing', () => {
  it('exposes mode and subscription lifecycle', () => {
    const { vim } = runScenario('abc|', []), seen: string[] = [];
    const unsubscribe = vim.subscribe(() => seen.push(vim.mode));
    vim.handleKey(key('i')); expect(vim.mode).toBe('insert'); expect(seen).toContain('insert');
    unsubscribe(); vim.handleKey(key('Escape')); expect(seen).toEqual(['insert']);
    vim.dispose();
  });
  it.each(scenarios)('%s', (_name, doc, keys, expectedDoc, expectedCursor) => {
    const result = runScenario(doc, keys);
    expect(result.doc).toBe(expectedDoc);
    expect(result.cursor).toBe(expectedCursor);
  });
  it('covers counted h independently of the motion matrix', () => {
    const result = runScenario('abcdef|', ['$', '2', 'h']);
    expect(result.doc).toBe('abcdef'); expect(result.cursor).toBe(3);
  });
  it('deletes and yanks ranges, enters insert on change, and clamps normal cursor', () => {
    expect(runScenario('|one two', ['d', 'w']).doc).toBe('two');
    expect(runScenario('|one two', ['y', 'w']).doc).toBe('one two');
    const changed = runScenario('|one two', ['c', 'w']);
    expect(changed.vim.mode).toBe('insert');
    expect(changed.host.state.doc.toString()).toBe(' two');
    expect(changed.cursor).toBe(0);
    expect(runScenario('abc|', ['$']).cursor).toBe(2);
  });
  it('supports visual selection, swap, exit and prompt entry', () => {
    const { vim, host } = runScenario('abcd|', ['v', 'l']);
    expect(vim.mode).toBe('visual');
    vim.handleKey(key('o')); expect(vim.mode).toBe('visual');
    vim.handleKey(key('Escape')); expect(vim.mode).toBe('normal');
    vim.handleKey(key(':')); expect(vim.prompt?.kind).toBe(':');
    vim.cancelPrompt(); expect(host.state.doc.toString()).toBe('abcd');
  });
  it('rejects numbered registers instead of silently dropping edits', () => {
    const { vim, host } = runScenario('one two|', ['"', '1', 'd', 'd']);
    expect(host.state.doc.toString()).toBe('one two'); expect(vim.message).toContain('E354');
  });
  it('executes ex navigation and substitutions', () => {
    const { host, vim } = runScenario('a a\nb|', []);
    vim.handleKey(key(':')); vim.submitPrompt('%s/a/x/g'); expect(host.state.doc.toString()).toBe('x x\nb');
    vim.handleKey(key(':')); vim.submitPrompt('2'); expect(host.state.selection.main.head).toBe(4);
  });
  it('uses counted text objects, explicit registers and marks', () => {
    const { host, vim } = runScenario('|one two three', ['d', '2', 'a', 'w']);
    expect(host.state.doc.toString()).toBe('three');
    for (const value of ['m', 'a', '0', '"', 'a', 'y', 'y']) vim.handleKey(key(value));
    expect(vim.mode).toBe('normal');
  });
});
