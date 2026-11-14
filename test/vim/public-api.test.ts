import { describe, expect, it } from 'vitest';
import * as api from '../../src/vim/index';

const snapshotAsState = (snapshot: api.VimSnapshot): api.VimState => snapshot;
void snapshotAsState;

describe('vim public API', () => {
  it('exports only the documented values', () => {
    expect(Object.keys(api).sort()).toEqual(['KEYMAP_MAX_BYTES', 'KEYMAP_PRESETS', 'LocalKeymapStore', 'compileKeymap', 'createVimController', 'normalizeKey', 'vim'].sort());
    for (const value of Object.values(api)) expect(value).toBeDefined();
    expect(api.KEYMAP_PRESETS.map(preset => preset.id)).toEqual(['default', 'mise-darwin']);
  });
});
