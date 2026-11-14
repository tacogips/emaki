import type { EditorHandle } from '../editor';
import type { PluginHost } from '../types';
import type { VimHost } from './host';

export function createVimHost(editor: EditorHandle, plugin: PluginHost): VimHost {
  return {
    get state() { return editor.state; },
    dispatch: spec => editor.dispatch(spec),
    undo: () => editor.undo(),
    redo: () => editor.redo(),
    get scrollTop() { return editor.scrollTop; },
    scrollTo: target => editor.scrollTo(target),
    lineTop: line => editor.lineTop(line),
    lineAtHeight: y => editor.lineAtHeight(y),
    get viewport() { return plugin.viewport; },
    coordsAtPos: pos => plugin.coordsAtPos(pos),
    marks: owner => plugin.marks(owner),
  };
}

export function createScheduler(): { timer(ms: number, cb: () => void): () => void; cancelAll(): void } {
  const live = new Set<() => void>();
  let stopped = false;
  return {
    timer(ms, cb) {
      let active = !stopped;
      let timeout: ReturnType<typeof setTimeout> | undefined;
      const cancel = () => {
        if (!active) return;
        active = false;
        live.delete(cancel);
        if (timeout !== undefined) clearTimeout(timeout);
      };
      const run = () => {
        live.delete(cancel);
        if (!active || stopped) return;
        active = false;
        cb();
      };
      if (active) {
        live.add(cancel);
        if (ms > 0) timeout = setTimeout(run, ms);
        else queueMicrotask(run);
      }
      return cancel;
    },
    cancelAll() {
      stopped = true;
      for (const cancel of live) cancel();
    },
  };
}
