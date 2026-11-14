# P09 `vim-p09-keymap-store`: generic `KeymapStore` + `LocalKeymapStore`

- **Wave:** 1
- **dependsOn:** none
- **Design:** `design-docs/specs/design-vim.md` rev 4 §5.5 ("KeymapStore"), §6 (keymap-store cases), §9 D12
- **Contracts:** overview C7 (owner)
- **writePaths:**
  - `src/vim/keymap-store.ts`
  - `test/vim/keymap-store.test.ts`
  - `test/vim/purity.test.ts` (added by the 2026-11-11 amendment, UF-1)
  - `tmp/vim-20261111/vim-p09-keymap-store` (artifact)
  - `impl-plans/progress/vim-p09-keymap-store.md`
- **sharedPaths:** none

## Intent

Provide framework-independent keymap persistence that apps connect to `vim({keymap})` and `setKeymap` themselves.
- The behavior reference is the read-only `LocalKeymapStore`. Leave out the app settings and the Tauri transport. Do not copy any provenance text.
- Design §5.5 is authoritative if the two differ.

## Contract (C7, consumed by p03 re-export and p06)

```ts
export type KeymapStoreSaveResult = { ok: true } | { ok: false; reason: 'too-large' | 'unavailable' };
export interface KeymapStore { load(): Promise<string | null>; save(text: string): Promise<KeymapStoreSaveResult>; clear(): Promise<void> }
export class LocalKeymapStore implements KeymapStore {
  constructor(options?: { key?: string; storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> });
}
```

## Changes: `src/vim/keymap-store.ts` (new)

- `key` defaults to `'emaki.vim.keymap'`.
- **Resolving storage.** Use the `options.storage` if one is given. Otherwise read `globalThis.localStorage` **inside each method's `try`**: the getter can throw, and under Node `localStorage` can be undefined. A missing storage counts as "unavailable".
- **Byte size.** Measure UTF-8 bytes with `new TextEncoder().encode(text).length`, compared against `KEYMAP_MAX_BYTES`. Imitate `src/vim/keymap-schema.ts:compileKeymap`, which measures the same way. Import `KEYMAP_MAX_BYTES` as a value from `./keymap-schema`.
- **`load()`:**
  - any exception → `null`
  - a value that is not a string → `null`
  - a value over the byte limit → `null`, and it is not deleted
  - otherwise the stored text, verbatim
- **`save(text)`:**
  - over the limit → `{ok: false, reason: 'too-large'}`, with no `setItem` call
  - storage missing, or `setItem` throws → `{ok: false, reason: 'unavailable'}`
  - otherwise store the text verbatim and return `{ok: true}`
- **`clear()`:** `removeItem` in `try`, swallowing all errors.
- **No compiling or JSON parsing.** The store holds JSON *text* and does no validation (D12).

## Non-goals

- No `index.ts` export (p03 adds the re-export). No change to `keymap-schema.ts`.
- No file- or IPC-backed store and no config-dir support.
- No `vactr`, `solid-js` or `/editor/` strings.

## Pitfalls

- Methods return promises but must never reject. Wrap each method's whole body.
- Do not `JSON.stringify` the text again.
- Keep the existing cases in `test/vim/keymap-store.test.ts` byte-for-byte. Append a new `describe('LocalKeymapStore', …)` block.

## Tests (append to `test/vim/keymap-store.test.ts`)

Use an in-memory `storage` stub with `getItem`, `setItem` and `removeItem`, plus throwing variants.

| situation | expected |
|---|---|
| `save('{"version":1}')`, then `load()` | `{ok: true}`, then the exact same text |
| `load()` on an empty stub | `null` |
| `getItem` throws | `load()` resolves `null` |
| `setItem` throws | `save` → `{ok: false, reason: 'unavailable'}` |
| text of `KEYMAP_MAX_BYTES + 1` ASCII bytes | `save` → `{ok: false, reason: 'too-large'}`; `setItem` not called |
| multi-byte text whose UTF-8 size exceeds the limit while its `.length` does not | `too-large` |
| stub pre-seeded with an oversized value | `load()` → `null`; the value is still in the stub |
| `clear()`, then `load()` | `null` |
| `removeItem` throws | `clear()` resolves |
| two stores with keys `a` and `b` on one stub | isolated values |
| no `storage` option and `vi.stubGlobal('localStorage', …)` with a throwing getter (`Object.defineProperty`) | `load()` → `null`, `save` → `unavailable` |
| no `storage` option and a working stubbed `localStorage` | round trip works under the default key `emaki.vim.keymap` |

## Verification

Run from the repository root. Write each log to `tmp/vim-20261111/vim-p09-keymap-store/`.

| command | log | must show |
|---|---|---|
| `npx vitest run test/vim/keymap-store.test.ts` | `vitest.log` | exit 0; old and new cases pass |
| `npx tsc --noEmit` | `tsc.log` | exit 0, or errors only in sibling-owned files that are still in progress (record them) |
| `rg -n 'vactr\|solid-js\|/editor/' src/vim/keymap-store.ts test/vim/keymap-store.test.ts` | `forbidden.log` | no matches (rg exit 1) |

## Done criteria

- The C7 contract is exported from `src/vim/keymap-store.ts` exactly as pinned.
- Every test row passes.
- The progress log records the commands, exit codes, log paths and per-edit hashes.

## Implementation status

C7 implementation and focused verification are complete on the shared working tree; see `impl-plans/progress/vim-p09-keymap-store.md`. Formal review and downstream integration remain pending.

## Amendment 2026-11-11 (integration-paths-outside-writePaths, round 1)

**Trigger.** Integration-review finding UF-1 (high). The ported `test/vim/purity.test.ts` scans every `src/vim/**/*.ts` file and rejects `document`, `window`, `navigator`, `localStorage`, `HTMLElement` and the timer globals. Accepted rev 4 deliberately places host-global use in three adapter and persistence files:
- `src/vim/keymap-store.ts`: the `globalThis.localStorage` default (§5.5, C7, D12)
- `src/vim/adapter.ts`: the `setTimeout`/`clearTimeout` scheduler (§5.6, D15)
- `src/vim/index.ts`: `attach(editor, host: HTMLElement)` and the capture listeners (§5.1, C2)

**Current failure.** `npx vitest run test/vim` exits 1 (1 failed, 1151 passed, 1152 total), with `src/vim/keymap-store.ts: DOM global`. The evidence is `tmp/vim-20261111/serial-reconcile-wave-001/session-829/vitest-vim-before.log`.

**Decision.** `test/vim/purity.test.ts` is added to this plan's writePaths, and this plan is its only owner. p03 depends on p09, so the exemption lands before p03 adds `index.ts` and `adapter.ts`.

**Changes (`test/vim/purity.test.ts`).**
1. Add a fixed exemption set of exact paths relative to `src/vim`: `index.ts`, `adapter.ts`, `keymap-store.ts`. Compare by exact path equality; no globs, prefixes or directories.
2. For exempt files, skip only the DOM-global regex and the timer-global regex. The `@codemirror/view` import check still runs for **every** file.
3. Leave the three regexes, `withoutComments`, the recursive visit and `files.length >= 3` byte-identical.
4. Add one assertion that the full-check set still contains engine files: `controller.ts`, `keymap-runtime.ts` and `mapper.ts` are scanned with all three checks. `cursor.ts` and `prompt.ts` are deliberately **not** exempt.
5. Record the pre and post sha256 and the intent in `tmp/vim-20261111/vim-p09-keymap-store/`, and in the progress log.

**Forbidden.**
- Do not rename, alias, split or obfuscate `localStorage`, `setTimeout` or `HTMLElement` anywhere (for example `globalThis['local' + 'Storage']`).
- `src/vim/keymap-store.ts` stays at sha256 `b6a6aa6e…` and keeps its C7 behavior.
- Do not edit p08 files (`src/vim/host.ts`, `controller.ts`, `test/vim/search-ex.test.ts`).
- Do not loosen any check for non-exempt files.

**Additional verification.** Run from the repository root; write each log to `tmp/vim-20261111/vim-p09-keymap-store/`.

| command | log | must show |
|---|---|---|
| `npx vitest run test/vim` | `vitest-vim.log` | exit 0; positive test count; purity passes |
| `npx vitest run test/vim/keymap-store.test.ts test/vim/purity.test.ts` | `focused.log` | exit 0 |
| `npx tsc --noEmit` | `tsc.log` | exit 0 |
| `git diff -U0 2eeb0c8edd16b781e2365ebfc23bca2f08f14335 -- test/vim/purity.test.ts` | `purity-diff.log` | only the exemption set, guarded checks and the new assertion; the regex lines are unchanged |

**Added done criteria.**
- The full `test/vim` suite is green on the combined tree.
- A DOM or timer token added to any non-exempt `src/vim` file would still fail the test.
