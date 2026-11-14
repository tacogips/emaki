import { findClusterBreak } from '@codemirror/state';
import type { CursorShape, Mark, Rgba } from '../types';
import type { VimHost, VimMode } from './host';

export function cursorShapeFor(mode: VimMode): CursorShape {
  return mode === 'insert' ? 'bar' : mode === 'replace' ? 'underline' : 'block';
}

export function cursorMarks(host: VimHost, shape: CursorShape, color: Rgba): Mark[] {
  if (shape === 'bar') return [];
  const head = host.state.selection.main.head;
  const line = host.state.doc.lineAt(head);
  const to = head < line.to ? line.from + findClusterBreak(line.text, head - line.from) : head;
  const style: Mark['style'] = shape === 'block'
    ? { background: [color[0], color[1], color[2], 0.6] }
    : { underline: { color, thickness: 2 } };
  if (head === to) {
    const current = host.coordsAtPos(head);
    const next = head < line.to ? host.coordsAtPos(head + 1) : null;
    const width = current && next ? next.left - current.left : 0;
    style.minWidth = width > 0 ? width : 8;
  }
  return [{ from: head, to, style }];
}
