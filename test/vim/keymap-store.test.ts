import { expect, it } from 'vitest';
import { createVimController } from '../../src/vim/controller';
import { createVimHost } from '../support/vim-host';

it('keeps plain keymap options local to each controller', () => {
  const first = createVimHost('abc'), second = createVimHost('abc');
  const mapped = createVimController(first, { keymap: { version: 1, maps: { n: [{ lhs: 'Q', rhs: 'l' }] } } });
  const plain = createVimController(second);
  const key = { key: 'Q', ctrlKey: false, metaKey: false, altKey: false, shiftKey: false };
  mapped.handleKey(key); plain.handleKey(key);
  expect(first.state.selection.main.head).toBe(1);
  expect(second.state.selection.main.head).toBe(0);
  mapped.dispose(); plain.dispose();
});


import { afterEach, describe, vi } from 'vitest';
import { LocalKeymapStore } from '../../src/vim/keymap-store';
import { KEYMAP_MAX_BYTES } from '../../src/vim/keymap-schema';

describe('LocalKeymapStore', () => {
  function makeStorage() {
    const values = new Map<string, string>();
    return {
      values,
      getItem: vi.fn((key: string) => values.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => { values.set(key, value); }),
      removeItem: vi.fn((key: string) => { values.delete(key); }),
    };
  }

  afterEach(() => { vi.unstubAllGlobals(); });

  it('round trips verbatim text and returns null when empty or cleared', async () => {
    const storage = makeStorage();
    const store = new LocalKeymapStore({ storage });
    expect(await store.load()).toBeNull();
    const text = '{"version":1}';
    expect(await store.save(text)).toEqual({ ok: true });
    expect(await store.load()).toBe(text);
    await store.clear();
    expect(await store.load()).toBeNull();
  });

  it('handles throwing storage methods without rejecting', async () => {
    const storage = { getItem: () => { throw new Error(); }, setItem: () => { throw new Error(); }, removeItem: () => { throw new Error(); } };
    const store = new LocalKeymapStore({ storage });
    expect(await store.load()).toBeNull();
    expect(await store.save('text')).toEqual({ ok: false, reason: 'unavailable' });
    await expect(store.clear()).resolves.toBeUndefined();
  });

  it('rejects oversized ASCII and multibyte text without writing', async () => {
    const storage = makeStorage();
    const store = new LocalKeymapStore({ storage });
    expect(await store.save('a'.repeat(KEYMAP_MAX_BYTES + 1))).toEqual({ ok: false, reason: 'too-large' });
    const multibyte = 'é'.repeat(KEYMAP_MAX_BYTES / 2 + 1);
    expect(multibyte.length).toBeLessThan(KEYMAP_MAX_BYTES);
    expect(await store.save(multibyte)).toEqual({ ok: false, reason: 'too-large' });
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('keeps an oversized stored value and accepts the exact byte limit', async () => {
    const storage = makeStorage();
    const store = new LocalKeymapStore({ storage });
    const oversized = 'a'.repeat(KEYMAP_MAX_BYTES + 1);
    storage.values.set('emaki.vim.keymap', oversized);
    expect(await store.load()).toBeNull();
    expect(storage.values.get('emaki.vim.keymap')).toBe(oversized);
    const boundary = 'a'.repeat(KEYMAP_MAX_BYTES);
    expect(await store.save(boundary)).toEqual({ ok: true });
    expect(await store.load()).toBe(boundary);
  });

  it('isolates custom keys', async () => {
    const storage = makeStorage();
    const a = new LocalKeymapStore({ key: 'a', storage });
    const b = new LocalKeymapStore({ key: 'b', storage });
    await a.save('first');
    await b.save('second');
    expect(await a.load()).toBe('first');
    expect(await b.load()).toBe('second');
  });

  it('handles a throwing global storage getter and missing storage', async () => {
    vi.stubGlobal('localStorage', undefined);
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error(); } });
    const store = new LocalKeymapStore();
    expect(await store.load()).toBeNull();
    expect(await store.save('text')).toEqual({ ok: false, reason: 'unavailable' });
    await expect(store.clear()).resolves.toBeUndefined();
    vi.stubGlobal('localStorage', undefined);
    expect(await store.load()).toBeNull();
    expect(await store.save('text')).toEqual({ ok: false, reason: 'unavailable' });
  });

  it('uses global storage and the default key', async () => {
    const storage = makeStorage();
    vi.stubGlobal('localStorage', storage);
    const store = new LocalKeymapStore();
    expect(await store.save('raw')).toEqual({ ok: true });
    expect(storage.values.get('emaki.vim.keymap')).toBe('raw');
    expect(await store.load()).toBe('raw');
  });
});
