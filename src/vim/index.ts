import type { EditorHandle } from '../editor';
import type { ModalKeyHook, ModalKeyInput, PluginHost } from '../types';
import { createVimHost, createScheduler } from './adapter';
import { createVimController as createEngineController } from './controller';
import { cursorMarks, cursorShapeFor } from './cursor';
import type { VimActionHandler, VimController, VimEngineOptions, VimExCommand, VimExResult, VimHooks, VimHost, VimMode, VimPlatform, VimPromptKind, VimRenderOptions, VimSnapshot } from './host';
import { compileKeymap, type CompiledKeymap, type KeymapIssue } from './keymap-schema';
import { KEYMAP_PRESETS, type KeymapPresetId } from './presets';
import { PromptLine } from './prompt';

export { compileKeymap, KEYMAP_MAX_BYTES } from './keymap-schema';
export type { CompiledKeymap, KeymapIssue } from './keymap-schema';
export { KEYMAP_PRESETS } from './presets';
export type { KeymapPreset, KeymapPresetId } from './presets';
export { LocalKeymapStore } from './keymap-store';
export type { KeymapStore, KeymapStoreSaveResult } from './keymap-store';
export type { ModalKeyHook, ModalKeyInput } from '../types';
export type { VimMode, VimPromptKind, VimExCommand, VimHost, VimController, VimEngineOptions, VimSnapshot, VimHooks, VimActionHandler, VimActionContext, VimRenderOptions, VimPlatform, VimExResult, HintView, HintEntry, HopView, HopLabel } from './host';
export { normalizeKey } from './keys';
export type { VimKey, VimKeyInput } from './types';

export interface VimPrompt { kind: VimPromptKind; text: string }
export interface VimState { mode: VimMode; pending: string; message: string | null; prompt: VimPrompt | null }
export interface VimOptions {
  actions?: Readonly<Record<string, VimActionHandler>>;
  hooks?: VimHooks;
  render?: VimRenderOptions;
  ex?: (command: VimExCommand) => VimExResult;
  clipboard?: { read(): string | Promise<string>; write(text: string): void };
  keymap?: string | object;
  preset?: KeymapPresetId;
}
export interface KeymapApplyResult { applied: boolean; issues: readonly KeymapIssue[] }
export interface Vim extends ModalKeyHook {
  attach(editor: EditorHandle, host: HTMLElement): () => void;
  readonly state: VimSnapshot;
  readonly cursorShape: 'bar' | 'block' | 'underline';
  readonly keymapIssues: readonly KeymapIssue[];
  onChange(cb: (state: VimSnapshot) => void): () => void;
  tapMode(): void;
  setKeymap(keymap: string | object | null): KeymapApplyResult;
}

function detectPlatform(): VimPlatform {
  try {
    const navigator = globalThis.navigator;
    return /Mac|iPhone|iPad|iPod/.test(`${navigator?.platform ?? ''} ${navigator?.userAgent ?? ''}`) ? 'apple' : 'other';
  } catch { return 'other'; }
}

export function createVimController(host: VimHost, options: VimEngineOptions = {}): VimController {
  const scheduler = options.timer ? null : createScheduler();
  const controller = createEngineController(host, { ...options, timer: options.timer ?? scheduler!.timer,
    hooks: { ...options.hooks, platform: options.hooks?.platform ?? detectPlatform() } });
  if (scheduler) {
    const dispose = controller.dispose;
    let disposed = false;
    controller.dispose = () => { if (disposed) return; disposed = true; scheduler.cancelAll(); dispose(); };
  }
  return controller;
}

const defaultSnapshot: VimSnapshot = { mode: 'normal', label: 'NORMAL', pending: '', recording: null, search: null,
  message: null, messageKind: null, prompt: null, cursorShape: 'block', displayCursor: 0, displayCursorEnd: 0, hints: null, hop: null };

function compile(input: unknown): { keymap: CompiledKeymap | null; issues: KeymapIssue[] } {
  if (typeof input !== 'string' && (typeof input !== 'object' || input === null)) {
    return { keymap: null, issues: [{ path: '$', severity: 'error', message: 'keymap must be JSON text or an object' }] };
  }
  try {
    const text = typeof input === 'string' ? input : JSON.stringify(input);
    if (typeof text !== 'string') throw new Error('not JSON');
    return compileKeymap(text);
  } catch {
    return { keymap: null, issues: [{ path: '$', severity: 'error', message: 'keymap must be JSON text or an object' }] };
  }
}

export function vim(options: VimOptions = {}): Vim {
  let controller: VimController | null = null;
  let pluginHost: PluginHost | null = null;
  let pendingKeymap: CompiledKeymap | null = null;
  let issues: readonly KeymapIssue[] = [];
  let detached = true;
  const prompt = new PromptLine();
  let promptOpen = false;
  const listeners = new Set<(state: VimSnapshot) => void>();
  if (options.keymap !== undefined) {
    const result = compile(options.keymap); pendingKeymap = result.keymap; issues = result.issues;
  } else if (options.preset !== undefined) {
    const preset = KEYMAP_PRESETS.find(item => item.id === options.preset);
    if (preset) { const result = compile(preset.text); pendingKeymap = result.keymap; issues = result.issues; }
    else issues = [{ path: 'preset', severity: 'error', message: `unknown preset: ${options.preset}` }];
  }
  const state = (): VimSnapshot => ({ ...(controller?.snapshot ?? defaultSnapshot),
    prompt: promptOpen ? { kind: prompt.kind, text: prompt.text } : null });
  let previous = JSON.stringify(state());
  const refreshCursor = () => {
    if (!controller || !pluginHost || detached) return;
    pluginHost.marks('emaki-vim').set(cursorMarks(createVimHostForCursor(), cursorShapeFor(controller.mode), pluginHost.theme.palette.cursor));
  };
  let attachedEditor: EditorHandle | null = null;
  const createVimHostForCursor = () => createVimHost(attachedEditor!, pluginHost!);
  const notify = () => {
    if (detached) return;
    const enginePrompt = controller?.prompt;
    if (enginePrompt && !promptOpen) { prompt.open(enginePrompt.kind, enginePrompt.initial); promptOpen = true; }
    if (!enginePrompt) promptOpen = false;
    refreshCursor();
    const next = state(), serialized = JSON.stringify(next);
    if (serialized !== previous) { previous = serialized; for (const cb of [...listeners]) cb(next); }
  };
  return {
    get state() { return state(); },
    get cursorShape() { return cursorShapeFor(controller?.mode ?? 'normal'); },
    get keymapIssues() { return issues; },
    tapMode() { if (!controller || promptOpen) return; controller.tapMode(); notify(); },
    onChange(cb) { listeners.add(cb); return () => { listeners.delete(cb); }; },
    setKeymap(input) {
      if (input === null) { pendingKeymap = null; issues = []; controller?.setKeymap(null); notify(); return { applied: true, issues }; }
      const result = compile(input); issues = result.issues;
      if (!result.keymap) { notify(); return { applied: false, issues }; }
      pendingKeymap = result.keymap; controller?.setKeymap(result.keymap); notify(); return { applied: true, issues };
    },
    handleKey(input: ModalKeyInput) {
      if ((input.metaKey && !options.hooks?.routeMetaKeys) || !controller) return false;
      if (promptOpen) {
        const result = prompt.key(input, controller.cmdline);
        if (result === 'submit') controller.submitPrompt(prompt.text);
        else if (result === 'cancel') controller.cancelPrompt();
        notify(); return true;
      }
      const handled = controller.handleKey(input); notify(); return handled;
    },
    allowsTextInput() { return promptOpen ? false : controller?.allowsTextInput() ?? true; },
    overwriteRange(text) { return controller?.overwriteRange(text) ?? null; },
    noteCompositionDiscarded() { controller?.noteCompositionDiscarded(); },
    flushPendingInput() { controller?.flushPendingInput(); },
    attach(editor, host) {
      if (controller || !detached) throw new Error('vim is already attached');
      detached = false; attachedEditor = editor;
      const scheduler = createScheduler();
      const removePlugin = editor.addPlugin({ name: 'emaki-vim', attach(ph) {
        pluginHost = ph;
        controller = createVimController(createVimHost(editor, ph), { ex: options.ex, clipboard: options.clipboard, timer: scheduler.timer, actions: options.actions, hooks: options.hooks, render: options.render });
        if (pendingKeymap) controller.setKeymap(pendingKeymap);
      } });
      if (!controller) { scheduler.cancelAll(); detached = true; attachedEditor = null; pluginHost = null; removePlugin(); throw new Error('vim plugin failed to attach'); }
      const activeController: VimController = controller;
      const unsubscribe = activeController.subscribe(notify);
      const unupdate = editor.onUpdate(update => { if (!detached) { activeController.noteUpdate(update); refreshCursor(); } });
      const paste = (event: ClipboardEvent) => { if (!promptOpen) return; event.preventDefault(); event.stopPropagation(); prompt.paste(event.clipboardData?.getData('text/plain') ?? ''); notify(); };
      const cut = (event: ClipboardEvent) => { if (!promptOpen) return; event.preventDefault(); event.stopPropagation(); };
      host.addEventListener('paste', paste, true); host.addEventListener('cut', cut, true);
      previous = JSON.stringify(state()); refreshCursor();
      let closed = false;
      return () => {
        if (closed) return;
        closed = true; scheduler.cancelAll(); detached = true;
        host.removeEventListener('paste', paste, true); host.removeEventListener('cut', cut, true);
        unsubscribe(); unupdate(); activeController.dispose(); removePlugin();
        controller = null; pluginHost = null; attachedEditor = null; promptOpen = false;
      };
    },
  };
}
