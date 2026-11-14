import type { ChangeSet, EditorState, TransactionSpec } from '@codemirror/state';
import type { Mark, ModalKeyInput, PluginViewport, Range, Rect } from '../types';
import type { CompiledKeymap } from './keymap-schema';
import type { VimKey } from './types';
import type { HintView, HopView } from './types';
export type { HintEntry, HintView, HopLabel, HopView } from './types';

export type VimMode = 'normal' | 'insert' | 'replace' | 'visual' | 'visual-line' | 'visual-block' | 'operator-pending';
export type VimPromptKind = ':' | '/' | '?';
export interface VimExCommand { name: string; args: string; bang: boolean; line: string }
export type VimPlatform = 'apple' | 'other';
export interface VimActionContext { id: string; mode: VimMode; cursor: number; state: EditorState }
export type VimActionHandler = (context: VimActionContext) => number | null | void;
export interface VimHooks {
  announce?(message: string, assertive: boolean): void; closePopupWithEscape?(): boolean; platform?: VimPlatform;
  matchesDefaultKeymap?(input: ModalKeyInput): boolean; compositionActive?(): boolean; isVisible?(pos: number): boolean; historyReduced?(): boolean;
  scrollCaret?(): void; scrollLines?(lines: number): void; typeText?(text: string): void; defaultKey?(key: string): boolean;
  /** Returns true when a transaction userEvent replaces or loads a whole document; the engine then drops undo, insert, dot-repeat and visual state. */
  isDocumentBoundary?(userEvent: string | null): boolean;
  /** Route Cmd/Meta-modified keys through the engine instead of returning them unhandled. */
  routeMetaKeys?: boolean;
}
export type VimExResult = boolean | { message: string; kind?: 'info' | 'error' };
export interface VimRenderOptions { search?: boolean; hints?: boolean; hop?: boolean }
export interface VimSnapshot {
  mode: VimMode; label: string; pending: string; recording: string | null; search: string | null;
  message: string | null; messageKind: 'info' | 'error' | null; prompt: { kind: VimPromptKind; text: string } | null;
  cursorShape: 'bar' | 'block' | 'underline'; displayCursor: number; displayCursorEnd: number; hints: HintView | null; hop: HopView | null;
}
export interface VimEngineOptions {
  actions?: Readonly<Record<string, VimActionHandler>>; hooks?: VimHooks; render?: VimRenderOptions;
  ex?: (command: VimExCommand) => VimExResult;
  clipboard?: { read(): string | Promise<string>; write(text: string): void };
  timer?: (ms: number, cb: () => void) => () => void;
  keymap?: unknown; preset?: string;
}
export interface VimHost {
  readonly state: EditorState; dispatch(spec: TransactionSpec): void; undo(): boolean; redo(): boolean;
  readonly scrollTop: number; scrollTo(target: { top: number } | { pos: number }): void;
  lineTop(line: number): number; lineAtHeight(y: number): number;
  readonly viewport: PluginViewport; coordsAtPos(pos: number): Rect | null;
  marks(owner: string): { set(marks: readonly Mark[]): void; clear(): void };
}
export interface VimController {
  setKeymap(keymap: CompiledKeymap | null): void;
  readonly cmdline: ReadonlyMap<VimKey, VimKey>;
  handleKey(input: ModalKeyInput): boolean; allowsTextInput(): boolean; overwriteRange(text: string): Range | null;
  noteCompositionDiscarded(): void; flushPendingInput(): void;
  noteUpdate(update: { state: EditorState; changes: ChangeSet; docChanged: boolean; selectionSet: boolean; userEvent?: string | null }): void;
  readonly mode: VimMode; readonly pending: string; readonly message: string | null;
  readonly prompt: { kind: VimPromptKind; initial: string } | null;
  submitPrompt(text: string): void; cancelPrompt(): void;
  readonly snapshot: VimSnapshot; tapMode(): void;
  blur(): void;
  subscribe(cb: (snapshot: VimSnapshot) => void): () => void; dispose(): void;
}
