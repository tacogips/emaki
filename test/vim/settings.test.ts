import { expect, it } from 'vitest';
import { createVimController } from '../../src/vim/controller';
import { createVimHost } from '../support/vim-host';

it('applies a preset only to the controller given that option', () => {
  const first = createVimHost('(a)'), second = createVimHost('(a)');
  const preset = createVimController(first, { preset: 'mise-darwin' });
  const plain = createVimController(second);
  const key = { key: 'm', ctrlKey: false, metaKey: false, altKey: false, shiftKey: false };
  preset.handleKey(key); preset.handleKey(key);
  plain.handleKey(key); plain.handleKey(key);
  expect(first.state.selection.main.head).toBe(2);
  expect(second.state.selection.main.head).toBe(0);
  preset.dispose(); plain.dispose();
});
