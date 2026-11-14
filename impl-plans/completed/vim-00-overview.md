# emaki/vim and Tauri dirty fix: overview and shared contracts

> **Revision 4 dispatch (2026-11-11, session 829).**
> - **Design:** `design-vim.md` rev 4, accepted with DR-06 resolved.
> - **Already landed at `f204032`:** p01, p02, p04 and p05.
> - **Remaining plans:**
>
>   | planId | wave | dependsOn | summary |
>   |---|---|---|---|
>   | `vim-p08-engine-keymap-contract` | 1 | none | additive C1 `setKeymap`/`cmdline`, `:q!` bang fix |
>   | `vim-p09-keymap-store` | 1 | none | C7 `KeymapStore` + `LocalKeymapStore` |
>   | `vim-p03-adapter` | 2 | p08, p09 | C2 rev 4, DR-06 scheduler, keymap and timing tests |
>   | `vim-p06-tauri-vim` | 3 | p03 | toggle, ex, `:e`, user keymap, smoke |
>   | `vim-p10-readme` | 3 | p03 | README |
>   | `vim-p07-docs-verify` | 4 | p03, p06, p08, p09, p10 | root-cause note, gates V0–V9 |
>
> - **Base commit for rev 4 diffs:** `f204032b695104f402d3217542d7fb06f56feeed`.
> - **Superseded:** `vim-20261111-dispatch.json` records the rev 3 dispatch only. For p03, p06 and p07, the plan files are authoritative.
>
> **C1 rev 4 (p08), added to `VimController`:**
> - `setKeymap(keymap: CompiledKeymap | null): void`
> - `readonly cmdline: ReadonlyMap<VimKey, VimKey>`
>
> **C2 rev 4 (p03), added to `Vim`:**
> - `setKeymap(keymap: string | object | null): { applied: boolean; issues: readonly KeymapIssue[] }`
> - `readonly keymapIssues: readonly KeymapIssue[]`
> - `VimOptions.keymap?: string | object` and `preset?: KeymapPresetId`
> - re-exports: `compileKeymap`, `KEYMAP_MAX_BYTES`, `KEYMAP_PRESETS`, `LocalKeymapStore`, and their types
>
> **C6 rev 4 (p06):**
> - DOM: `#vim-keymap`, `#vim-keymap-clear`
> - storage: `emaki-tauri-editor.vim.keymap`
> - mock: `confirmOpen`
>
> **C7 (p09).** `KeymapStore { load(): Promise<string|null>; save(text): Promise<{ok:true}|{ok:false;reason:'too-large'|'unavailable'}>; clear(): Promise<void> }`, and `LocalKeymapStore({key?, storage?})` with the default key `emaki.vim.keymap`.

- **Design (source of truth).** `design-docs/specs/design-vim.md`, revision 3 (now revision 4; see above). Step 3 accepted it, with DR-01 through DR-05 resolved. Related documents:
  - `design-docs/specs/design-tauri-editor.md`: its §7 dirty rule is superseded.
  - `design-docs/user-qa/vim-qa.md`: item #1 is a PENDING, unapproved scope amendment. Do not implement it.
- **Issue.** There is none. This is a local workflowInput request (dispatch comm-018940, session opus-terra-design-and-implement-review-loop-session-825).
- **Base commit.** `283d6bc32cc5c35544a1c7498bc4e307d8e0a160` on `main`.
- **Evidence.**
  - Root: `tmp/vim-20261111/<planId>/`. `tmp/` is git-ignored.
  - Every command writes a complete log there, and the plan's progress log at `impl-plans/progress/<planId>.md` records the exit status.
- **Git policy.**
  - Workers never create branches, worktrees or stashes, and never commit or push. Workflow finalization makes one local commit and does not push (`gitPush=false`).
  - Never commit `node_modules`, `dist`, `examples/tauri-editor/src-tauri/target` or `tmp`.
- **Reference repository.** `/Users/taco/gits/tacogips/vactr` is **read-only**. Never write there.
  - Source: `editor/src/code/vim/**` and `editor/src/code/surface.ts`.
  - Tests: `editor/test/code/vim/*.test.ts` (31 suites), plus `editor/test/code/vim-clipboard.test.ts`, `vim-settings.test.ts` and `vim-keymap-store.test.ts`.
- **Boundary rule.** No file under `src/`, `test/` or `scripts/` may contain the strings `vactr`, `solid-js` or `/editor/` (`test/boundary.test.ts`). Provenance goes only in progress logs, which feed the commit message.
- **Toolchain.**
  - Rust: `~/.cargo/bin/cargo`, run with `PATH="$HOME/.cargo/bin:$PATH"`. Never use the mise shim.
  - Node: the repository's Node. `node_modules` (root) and `examples/tauri-editor/node_modules` already exist. Do not run `npm install`.

## Per-edit safety (all plans)

All ready plans of a wave share one branch and working directory.

1. **Before every edit,** re-read the target file fresh and record its `shasum -a 256` (the pre-hash) and a one-line intent in `tmp/vim-20261111/<planId>/edits.log`.
2. **After the edit,** record the post-hash.
3. **On drift** (the pre-hash differs from your last post-hash for a file you own), stop editing that file. Log the drift and re-read the file. Re-apply only your intended change. Never revert another plan's content.
4. **Out-of-scope files.** Edit only your own `writePaths`. A file a sibling plan owns may be read but never written. An out-of-scope need is recorded as a blocker in the progress log for serial reconciliation.

## Plans and waves

| planId | wave | dependsOn | summary |
|---|---|---|---|
| `vim-p01-engine` | 1 | none | port engine modules plus 31 + 3 suites; owns `src/vim/host.ts` contract C1 |
| `vim-p02-packaging` | 1 | none | `package.json` `./vim`, `bundle-size.mjs` `./vim`, boundary isolation assertion |
| `vim-p04-tauri-dirty` | 1 | none | clean-baseline dirty fix, `setTitle` chain, dirty trace, mock seed, smoke launch regression |
| `vim-p05-rust-confirm-open` | 1 | none | Rust `confirm_open_path` plus `absolutize` helper and test |
| `vim-p03-adapter` | 2 | p01 | `vim()` public API, attach adapter, cursor marks, prompt editing, clipboard isolation, integration test |
| `vim-p06-tauri-vim` | 3 | p03, p04, p05 | example toggle, indicator, ex mapping, `openNamed`, mock `confirm_open_path`, smoke vim/`:e` scenarios |
| `vim-p07-docs-verify` | 4 | all | README, conditional `src/input` fix, all gates V0–V7, root-cause record |

## Shared contracts (pinned)

### C1. Engine contract

`src/vim/host.ts` is owned by p01 and consumed by p03. It is type-only, except where noted.

```ts
export type VimMode = 'normal' | 'insert' | 'replace' | 'visual' | 'visual-line' | 'visual-block' | 'operator-pending';
export type VimPromptKind = ':' | '/' | '?';
export interface VimExCommand { name: string; args: string; bang: boolean; line: string }
export interface VimEngineOptions {
  ex?: (command: VimExCommand) => boolean;
  clipboard?: { read(): string | Promise<string>; write(text: string): void };
  keymap?: unknown; preset?: string;
}
export interface VimHost {           // built by p03 from EditorHandle + PluginHost; faked by test/support/vim-host.ts
  readonly state: EditorState; dispatch(spec: TransactionSpec): void; undo(): boolean; redo(): boolean;
  readonly scrollTop: number; scrollTo(target: { top: number } | { pos: number }): void;
  lineTop(line: number): number; lineAtHeight(y: number): number;
  readonly viewport: PluginViewport; coordsAtPos(pos: number): Rect | null;
  marks(owner: string): { set(marks: readonly Mark[]): void; clear(): void };
}
export interface VimController {
  handleKey(input: ModalKeyInput): boolean; allowsTextInput(): boolean; overwriteRange(text: string): Range | null;
  noteCompositionDiscarded(): void; flushPendingInput(): void;
  noteUpdate(update: { state: EditorState; changes: ChangeSet; docChanged: boolean; selectionSet: boolean }): void;
  readonly mode: VimMode; readonly pending: string; readonly message: string | null;
  readonly prompt: { kind: VimPromptKind; initial: string } | null;   // opened by ':', '/', '?'; initial is "'<,'>" from visual ':'
  submitPrompt(text: string): void; cancelPrompt(): void;
  subscribe(cb: () => void): () => void; dispose(): void;
}
```

`src/vim/controller.ts` (p01) exports `createVimController(host: VimHost, options?: VimEngineOptions): VimController`.

### C2. Public API

`src/vim/index.ts` is owned by p03, and is the shape p06 consumes. It follows design §5.1 exactly:
- `vim(options?: VimOptions): Vim`, where `VimOptions = VimEngineOptions`.
- `Vim` extends `ModalKeyHook` and adds:
  - `attach(editor: EditorHandle, host: HTMLElement): () => void`
  - `readonly state: { mode: VimMode; pending: string; prompt: { kind: VimPromptKind; text: string } | null; message: string | null }`
  - `readonly cursorShape: 'bar' | 'block' | 'underline'`
  - `onChange(cb: (state) => void): () => void`
- Type re-exports: `ModalKeyHook`, `ModalKeyInput`, `VimMode`, `VimPromptKind`, `VimExCommand`.

### C3. Mark owners

| owner | used for | plan |
|---|---|---|
| `emaki-vim` | cursor | p03 |
| `emaki-vim-search` | search highlights | p01 |
| `emaki-vim-hop` | hop labels | p01 |
| `emaki-vim-hints` | hints | p01, only if kept |

### C4. IPC

| command | JS call | resolves to |
|---|---|---|
| `confirm_open_path` | `invoke('confirm_open_path', { path })` | `string \| null` (granted absolute path, or `null` if declined) |

On failure, `confirm_open_path` rejects with an error string.

### C5. Mock (`examples/tauri-editor/src/mock-ipc.ts`)

p04 adds:
- `window.__tauriEditorMockSeed?: { initialPath?: string; files?: Record<string, string> }`, read once by `install()`
- `initial_path` returns the seeded `initialPath ?? null`
- `__tauriEditorMock.dispatchIdentity(): void`, registered by `main.ts` in mock mode only
- `__tauriEditorMock.dirtyAtFocus?: boolean`, written by `mount()` right after `focus()`, in mock mode only

p06 adds:
- `__tauriEditorMock.confirmOpen: boolean` (default `true`)
- `confirm_open_path`, which returns `confirmOpen ? path : null`

### C6. Example DOM and storage

- `#vim`: a checkbox inside a `<label>`.
- `#vim-mode`: a span, hidden through the `hidden` attribute when vim is off.
- `localStorage` keys:
  - `emaki-tauri-editor.vim`: `'1'` or `'0'`
  - `emaki-tauri-editor.traceDirty`: `'1'` enables the trace

## Serial reconciliation (after every plan joins)

Logs go to `tmp/vim-20261111/reconcile/`. The reconciler runs p07's gate list again. Any drift repair is serial.

## Amendment 2026-11-11 (integration-paths-outside-writePaths, round 1)

UF-1 adds `test/vim/purity.test.ts` to the `vim-p09-keymap-store` writePaths (in the plan file and the dispatch manifest). The purity gate exempts exactly `src/vim/index.ts`, `src/vim/adapter.ts` and `src/vim/keymap-store.ts` from the DOM-global and timer-global checks; this is the adapter and persistence layer of design §3. Every other `src/vim` file keeps the full checks, and the `@codemirror/view` check still applies to all files. The DAG is unchanged.
