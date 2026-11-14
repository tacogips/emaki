import { describe, expect, it } from 'vitest';
import { createVimController } from '../../src/vim/controller';
import { createVimHost } from '../support/vim-host';

const key = (key: string) => ({ key, ctrlKey: false, metaKey: false, altKey: false, shiftKey: false });
const press = (vim: ReturnType<typeof createVimController>, ...keys: string[]) => { for (const value of keys) vim.handleKey(key(value)); };

describe('clipboard registers through C1', () => {
  it('writes yanked text to the provided clipboard', async () => {
    const host = createVimHost('word'), writes: string[] = [];
    const vim = createVimController(host, { clipboard: { read: () => '', write: text => { writes.push(text); } } });
    press(vim, 'y', 'w'); await Promise.resolve();
    expect(writes).toEqual(['word']);
  });
  it('reads an explicit clipboard register', async () => {
    const host = createVimHost('a');
    const vim = createVimController(host, { clipboard: { read: () => 'X', write: () => {} } });
    press(vim, '"', '+', 'p'); await Promise.resolve(); await Promise.resolve();
    expect(host.state.doc.toString()).toBe('aX');
  });
  it('uses the internal clipboard when no option is supplied', async () => {
    const host = createVimHost('word'); const vim = createVimController(host);
    press(vim, 'y', 'w', '"', '+', 'p'); await Promise.resolve(); await Promise.resolve();
    expect(host.state.doc.toString()).toBe('wwordord');
  });
  it('preserves linewise register metadata without a clipboard option', () => {
    const host = createVimHost('one\ntwo'); const vim = createVimController(host);
    press(vim, 'y', 'y', '"', '+', 'p');
    expect(host.state.doc.toString()).toBe('one\none\ntwo');
    vim.dispose();
  });
  it('uses the linewise internal register when clipboard reading fails', async () => {
    const host = createVimHost('one\ntwo');
    const vim = createVimController(host, { clipboard: { read: () => Promise.reject(new Error('denied')), write: () => {} } });
    press(vim, '"', '+', 'y', 'y', '"', '+', 'p');
    await new Promise<void>(resolve => queueMicrotask(resolve));
    await new Promise<void>(resolve => queueMicrotask(resolve));
    await new Promise<void>(resolve => queueMicrotask(resolve));
    expect(host.state.doc.toString()).toBe('one\none\ntwo');
    expect(vim.message).toContain('clipboard unavailable'); vim.dispose();
  });
});
