import type { ModalKeyInput } from '../types';
import type { VimPromptKind } from './host';
import { normalizeKey } from './keys';
import type { VimKey } from './types';

export class PromptLine {
  kind: VimPromptKind = ':';
  text = '';

  open(kind: VimPromptKind, initial: string): void {
    this.kind = kind;
    this.text = initial;
  }

  key(input: ModalKeyInput, cmdline: ReadonlyMap<VimKey, VimKey>): 'consumed' | 'submit' | 'cancel' {
    const normalized = normalizeKey(input, true);
    if (normalized !== null && cmdline.has(normalized)) {
      const mapped = cmdline.get(normalized)!;
      if (mapped === '<Esc>') return 'cancel';
      if (mapped === '<CR>') return 'submit';
      if (mapped === '<BS>') this.deleteLast();
      else if (mapped.length === 1) this.text += mapped;
      return 'consumed';
    }
    if (input.key === 'Backspace' && !input.ctrlKey && !input.altKey && !input.metaKey) {
      if (!this.text) return 'cancel';
      this.deleteLast();
    } else if (normalized === '<C-u>') {
      this.text = '';
    } else if (normalized === '<CR>') {
      return 'submit';
    } else if (normalized === '<Esc>' || normalized === '<C-c>') {
      return 'cancel';
    } else if (input.key.length === 1 && !input.ctrlKey && !input.altKey && !input.metaKey) {
      this.text += input.key;
    }
    return 'consumed';
  }

  paste(text: string): void {
    this.text += text.split('\n', 1)[0].replace(/\r/g, '');
  }

  private deleteLast(): void {
    this.text = Array.from(this.text).slice(0, -1).join('');
  }
}
