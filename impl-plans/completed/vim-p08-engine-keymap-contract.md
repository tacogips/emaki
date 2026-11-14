# P08 `vim-p08-engine-keymap-contract`: additive C1 `setKeymap`/`cmdline`, ex bang fix

- **Wave:** 1
- **dependsOn:** none (p01 is landed at HEAD f204032)
- **Design:** `design-docs/specs/design-vim.md` rev 4 §1.1, §5.6 ("Additive C1 change", "Engine bug found during integration"), §9 D10/D14
- **Contracts:** overview C1 rev 4 (owner)
- **writePaths:**
  - `src/vim/host.ts`
  - `src/vim/controller.ts`
  - `test/vim/search-ex.test.ts`
  - `tmp/vim-20261111/vim-p08-engine-keymap-contract` (artifact)
  - `impl-plans/progress/vim-p08-engine-keymap-contract.md`
- **sharedPaths:** none

## Intent

Expose two members on the public engine facade that the adapter (p03) needs:
- runtime keymap replacement
- the compiled cmdline map

Also fix the `:q!` bang forwarding. These are the only engine edits in revision 4.

## Repository context

- `src/vim/host.ts:20-27`: the `VimController` interface (C1).
- `src/vim/controller.ts:93-108`: `ReferenceController.setKeymap(keymap: CompiledKeymap | null)`. It already flushes, closes hints and hop, and swaps the runtime. It is private to the facade.
- `src/vim/controller.ts:930-946`: the `facade` object returned by `createVimController`. Imitate its one-line forwarding members, for example `submitPrompt: (text) => engine.submitPrompt(text)`.
- `src/vim/controller.ts:655`: the `applyEx` branch `noop-write`, which forwards `{name: command.name, bang: false, ...}`. With `command.name === 'q!'`, `bang` is wrong.
- `src/vim/keymap-schema.ts:16`: `CompiledKeymap.cmdline: ReadonlyMap<VimKey, VimKey>`.

## Non-goals

- Do not change any existing C1 member, `VimEngineOptions` (its `keymap`, `preset` and `timer` stay), or the fallback `timer` in `createVimController`. The DR-06 production scheduler belongs to p03.
- No public `src/vim/index.ts` (p03 owns it).
- Do not re-port or re-audit engine test parity. Do not touch other test files.
- No core `src/**` edits outside `src/vim`.

## Changes

### `src/vim/host.ts` (additive only)

Add two members to `VimController`:
- `setKeymap(keymap: CompiledKeymap | null): void`
- `readonly cmdline: ReadonlyMap<VimKey, VimKey>`

Use `import type` for `CompiledKeymap` from `./keymap-schema` and `VimKey` from `./types`.

### `src/vim/controller.ts`

**Facade.**
- `setKeymap: (k) => { engine.setKeymap(k); activeCmdline = k?.cmdline ?? EMPTY; }`
- `get cmdline() { return activeCmdline; }`

`EMPTY` is a frozen empty `Map`. The keymap applied from `options.keymap`/`preset` at construction (`controller.ts:907-912`) must also set `activeCmdline`. A failed compile there leaves it `EMPTY`.

**Bang fix (`applyEx`, `noop-write`).** Forward `{ name: command.name.replace(/!$/, ''), bang: command.name.endsWith('!'), args: '', line: command.name }`. Keep the E492 fallback message unchanged.

## Pitfalls

- `setKeymap(null)` must leave `cmdline` empty and the engine in base bindings. That already happens inside `ReferenceController.setKeymap`.
- Do not compile inside `facade.setKeymap`. It takes an already compiled keymap.
- Do not add the string `vactr` or `/editor/` anywhere.

## Tests (append to `test/vim/search-ex.test.ts`)

Use `createVimController(createVimHost('a'), { ex: spy })` from `test/support/vim-host.ts`, as in `test/vim/keymap-store.test.ts`. Drive `:` through `controller.prompt` / `submitPrompt`, or through the existing helper in that file.

| situation | expected |
|---|---|
| `submitPrompt('q!')` | spy called with `{name: 'q', bang: true, args: '', line: 'q!'}` |
| `submitPrompt('w')` | spy called with `{name: 'w', bang: false}` |
| `submitPrompt('wq!')` | `{name: 'wq', bang: true}` |
| spy returns `false` for `q!` | message starts with `E492` |
| `setKeymap(compileKeymap('{"version":1,"maps":{"c":[{"lhs":"<C-g>","rhs":"<Esc>"}]}}').keymap)` | `controller.cmdline.get('<C-g>') === '<Esc>'` |
| then `setKeymap(null)` | `controller.cmdline.size === 0` |
| `setKeymap(compiled jj→<Esc> insert map)`, then `i`, `j`, `j` | mode `normal` (controller-level smoke test of forwarding) |

## Verification

Run from the repository root. Write each log to `tmp/vim-20261111/vim-p08-engine-keymap-contract/`.

| command | log | must show |
|---|---|---|
| `npx vitest run test/vim` | `vitest.log` | exit 0; all 34 existing suites plus the new cases pass |
| `npx tsc --noEmit` | `tsc.log` | exit 0, or errors only in files a sibling wave-1 plan is still writing (record them) |
| `git diff --name-only f204032 -- src ':!src/vim'` | `core-diff.log` | empty |
| `git diff -U0 f204032 -- src/vim/host.ts` | `c1-diff.log` | only added lines (`^+`) inside `VimController`, plus import lines |

## Done criteria

- The C1 additions exist with the exact signatures above.
- `:q!` reaches `ex` with `bang: true`.
- All four verification rows meet their expectation.
- `impl-plans/progress/vim-p08-engine-keymap-contract.md` records each command, its exit code and its log path, plus the per-edit pre/post hashes (see overview "Per-edit safety").

## Implementation status

C1 additions, bang forwarding, and regression cases are implemented. Focused tests and TypeScript pass; the full Vim suite is pending resolution of the sibling-owned `src/vim/keymap-store.ts` purity failure. See `impl-plans/progress/vim-p08-engine-keymap-contract.md`. Formal review and finalization remain downstream.
