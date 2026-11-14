import { history, redo, undo } from '@codemirror/commands';
import { EditorState, type Transaction, type TransactionSpec } from '@codemirror/state';
import type { Mark, PluginViewport, Rect } from '../../src/types';
import type { VimHost } from '../../src/vim/host';

export class TestVimHost implements VimHost {
  state: EditorState;
  scrollTop = 0;
  viewport: PluginViewport = { fromLine: 1, toLine: 1, top: 0, height: 400 };
  readonly markSets = new Map<string, readonly Mark[]>();
  onUpdate?: (transaction: Transaction) => void;

  constructor(doc = '') {
    this.state = EditorState.create({ doc, extensions: [history()] });
  }

  private apply = (transaction: Transaction): void => {
    this.state = transaction.state;
    this.onUpdate?.(transaction);
  };

  dispatch(spec: TransactionSpec): void { this.apply(this.state.update(spec)); }
  undo(): boolean { return undo({ state: this.state, dispatch: this.apply }); }
  redo(): boolean { return redo({ state: this.state, dispatch: this.apply }); }
  scrollTo(target: { top: number } | { pos: number }): void {
    this.scrollTop = 'top' in target ? target.top : this.lineTop(this.state.doc.lineAt(target.pos).number);
  }
  lineTop(line: number): number { return (line - 1) * 20; }
  lineAtHeight(y: number): number { return Math.max(1, Math.min(this.state.doc.lines, Math.floor(y / 20) + 1)); }
  coordsAtPos(pos: number): Rect | null {
    const line = this.state.doc.lineAt(pos), left = (pos - line.from) * 8, top = this.lineTop(line.number);
    return { left, right: left + 8, top, bottom: top + 20 };
  }
  marks(owner: string): { set(marks: readonly Mark[]): void; clear(): void } {
    return { set: marks => { this.markSets.set(owner, [...marks]); }, clear: () => { this.markSets.delete(owner); } };
  }
}

export function createVimHost(doc = ''): TestVimHost { return new TestVimHost(doc); }
