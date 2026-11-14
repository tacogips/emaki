import { KEYMAP_MAX_BYTES } from './keymap-schema';

export type KeymapStoreSaveResult = { ok: true } | { ok: false; reason: 'too-large' | 'unavailable' };

export interface KeymapStore {
  load(): Promise<string | null>;
  save(text: string): Promise<KeymapStoreSaveResult>;
  clear(): Promise<void>;
}

export class LocalKeymapStore implements KeymapStore {
  private readonly key: string;
  private readonly storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

  constructor(options?: { key?: string; storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> }) {
    this.key = options?.key ?? 'emaki.vim.keymap';
    this.storage = options?.storage;
  }

  async load(): Promise<string | null> {
    try {
      const value = (this.storage ?? globalThis.localStorage)?.getItem(this.key);
      return typeof value === 'string' && new TextEncoder().encode(value).length <= KEYMAP_MAX_BYTES ? value : null;
    } catch {
      return null;
    }
  }

  async save(text: string): Promise<KeymapStoreSaveResult> {
    try {
      if (new TextEncoder().encode(text).length > KEYMAP_MAX_BYTES) return { ok: false, reason: 'too-large' };
      const storage = this.storage ?? globalThis.localStorage;
      if (!storage) return { ok: false, reason: 'unavailable' };
      storage.setItem(this.key, text);
      return { ok: true };
    } catch {
      return { ok: false, reason: 'unavailable' };
    }
  }

  async clear(): Promise<void> {
    try {
      (this.storage ?? globalThis.localStorage)?.removeItem(this.key);
    } catch {
      // Storage can be unavailable, including when accessing the global getter.
    }
  }
}
