import { expect, it } from 'vitest';
import { defaultTokenColors, standardTags } from '../../src/language/tags';
it('defines the standard and JSON colors', () => { expect(standardTags).toHaveLength(23); expect(new Set(standardTags).size).toBe(23); expect(Object.isFrozen(defaultTokenColors)).toBe(true); for (const tag of [...standardTags, ...['key','string','number','bool','null','punct','invalid'].map(x => `json-${x}`)]) { const color = defaultTokenColors[tag]; expect(color).toHaveLength(4); expect(color!.every(x => x >= 0 && x <= 1)).toBe(true); } });
