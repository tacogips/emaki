# vimhost-20261111: emaki/vim host extension points (design-vim.md revision 5)

**Source of truth:** `design-docs/specs/design-vim.md` §12 (and §8 README, §9 D16–D24, §10 V9–V12, §11 risks), plus `design-docs/user-qa/vim-qa.md` #6 and #7 (both have defaults; implement the defaults).

**Base:** `main` at `6351463a6ef64c9c73bf5216e23a3943f438e79c`. The run ends in one local commit. **No push.**

**User intent.** A host with its own surface and UI must be able to replace a private vim engine with `emaki/vim` without behavior loss. To do that, `emaki/vim` exposes:
- a host action registry
- optional host hooks
- the full snapshot
- a public `tapMode`
- `noteUpdate` userEvent forwarding
- switchable default renderers
- the low-level `createVimController`

The engine stays framework-free, and core is untouched.

## Plans, waves and the DAG

| wave | planId | dependsOn | owns |
|---|---|---|---|
| 1 | `vimhost-p01-engine-contract` | – | `src/vim/host.ts`, `src/vim/types.ts`, `src/vim/controller.ts` |
| 1 | `vimhost-p02-action-schema` | – | `src/vim/actions.ts`, `src/vim/keymap-schema.ts`, `test/vim/actions.test.ts` |
| 2 | `vimhost-p03-public-adapter` | p01 | `src/vim/index.ts`, `test/vim/public-api.test.ts` |
| 2 | `vimhost-p04-readme` | p01, p02 | `README.md` |
| 3 | `vimhost-p05-actions-tests` | p01, p02, p03 | `test/vim/host-actions.test.ts` |
| 3 | `vimhost-p06-hooks-tests` | p01, p03 | `test/vim/host-hooks.test.ts`, `src/vim/keys.ts` (conditional) |
| 3 | `vimhost-p07-snapshot-tests` | p01, p03 | `test/vim/snapshot.test.ts` |
| 3 | `vimhost-p08-surface-host-tests` | p01, p03 | `test/vim/surface-host.test.ts`, `test/vim/note-update.test.ts` |
| 3 | `vimhost-p09-tapmode-tests` | p01, p03 | `test/vim/tap-mode.test.ts` |

Each plan also owns `impl-plans/progress/<planId>.md` and its artifact root `tmp/vim-host-20261111/<planId>`.

## Pinned cross-plan contracts

### C-R5-1 (owner p01, `src/vim/host.ts`; all changes additive)

```ts
export type VimPlatform = 'apple' | 'other';
export interface VimActionContext { id: string; mode: VimMode; cursor: number; state: EditorState }
export type VimActionHandler = (context: VimActionContext) => number | null | void;
export interface VimHooks { announce?(message: string, assertive: boolean): void; closePopupWithEscape?(): boolean; platform?: VimPlatform;
  matchesDefaultKeymap?(input: ModalKeyInput): boolean; compositionActive?(): boolean; isVisible?(pos: number): boolean; historyReduced?(): boolean;
  scrollCaret?(): void; scrollLines?(lines: number): void; typeText?(text: string): void; defaultKey?(key: string): boolean }
export interface VimRenderOptions { search?: boolean; hints?: boolean; hop?: boolean }
export type { HintEntry, HintView, HopLabel, HopView } from './types';
export interface VimSnapshot { mode: VimMode; label: string; pending: string; recording: string | null; search: string | null;
  message: string | null; messageKind: 'info' | 'error' | null; prompt: { kind: VimPromptKind; text: string } | null;
  cursorShape: 'bar' | 'block' | 'underline'; displayCursor: number; displayCursorEnd: number; hints: HintView | null; hop: HopView | null }
// VimEngineOptions gains: actions?: Readonly<Record<string, VimActionHandler>>; hooks?: VimHooks; render?: VimRenderOptions;
// VimController gains: readonly snapshot: VimSnapshot; tapMode(): void;
//   subscribe(cb: (snapshot: VimSnapshot) => void): () => void;
//   noteUpdate(update: { state; changes; docChanged; selectionSet; userEvent?: string | null }): void;
```

### C-R5-2 (owner p02, `src/vim/actions.ts`)

- `export type BuiltinActionId` is the current 11-id union.
- `export type ActionId = string`.
- `ACTION_MODES: Record<BuiltinActionId, …>` is unchanged.
- `isActionId(value: string): value is BuiltinActionId` keeps the same logic.
- `isHopAction(id: string): boolean`.
- `isHostActionId(value: string): boolean` is new.

p01 keeps typing `runMappedAction(id: ActionId)` against the imported `ActionId`, so p01 compiles both before and after p02 lands.

### C-R5-3 (owner p03, `src/vim/index.ts`)

- `VimOptions` gains `actions`, `hooks` and `render`.
- `Vim` gains `tapMode(): void`.
- `Vim.state` is typed `VimSnapshot`, and `onChange(cb: (state: VimSnapshot) => void)`.
- New value export: `createVimController(host: VimHost, options?: VimEngineOptions): VimController` (the wrapper).
- New type exports: `VimHost`, `VimController`, `VimEngineOptions`, `VimSnapshot`, `VimHooks`, `VimActionHandler`, `VimActionContext`, `VimRenderOptions`, `VimPlatform`, `HintView`, `HintEntry`, `HopView`, `HopLabel`.

## Global invariants (every plan)

- **No core edits.** `git diff --name-only 6351463 -- src ':!src/vim'` must be empty.
- **No `vactr`, `solid-js` or `/editor/` text** in any `src`, `test` or `scripts` file, including test names and comments. The boundary test walks the whole repository for `.ts`, `.mjs` and `.html` files, which includes `tmp/`. **Evidence directories must contain only `.log`, `.txt` or `.json` files.**
- **Purity gate.** Only `index.ts`, `adapter.ts` and `keymap-store.ts` may reference DOM or timer globals. `navigator` appears only in `index.ts`.
- **Peers** stay `@codemirror/state` and `@codemirror/commands`.
- **Read-only references.** The reference tests live under `/Users/taco/gits/tacogips/vactr/editor/test/**`; read them only. Do not modify vactr or chilla.
- **No git operations by workers.** No branch, worktree, stash, commit or push.

## Edit discipline (shared working directory)

- Before each edit, read the file fresh and record `shasum -a 256 <file>` in the progress log.
- After the edit, record the new hash.
- If a file you own changed since your last read, and the change is not yours, stop. Log it as drift, and do not overwrite.
- Never edit files outside your `writePaths`. A defect found in another plan's file is recorded in your progress log as a blocker, with a failing test case, for serial repair after the join.

## Serial reconciliation (after wave 3; not a worker plan)

1. Run `npm run check && npm test && npm run build && node scripts/bundle-size.mjs`.
2. Write `node scripts/bundle-size.mjs --entries core --out tmp/vim-host-20261111/reconcile/core-after.json`, and compare the raw and gzip bytes of `.`, `./engine`, `./json` and `./diff` with `tmp/vim-host-20261111/vimhost-p01-engine-contract/core-before.json`. They must be identical.
3. `git diff --name-only 6351463 -- src ':!src/vim'` must be empty.
4. `cd examples/tauri-editor && npm run check && npm run smoke` must exit 0.
5. Optionally run `npm run perf`. On failure, re-run at 6351463 under the same load before drawing conclusions.
6. Build the commit message's class-2 table (one row per reference case: target file, ported or excluded, reason) from the p05–p09 progress logs.
7. Make one local commit. Do not push.
