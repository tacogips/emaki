# vimhost-p04-readme: README "Host extension points" subsection

- **Wave:** 2
- **dependsOn:** `vimhost-p01-engine-contract`, `vimhost-p02-action-schema`
- **Design:** `design-vim.md` §8 (revision 5 bullet) and §12
- **writePaths:**
  - `README.md`
  - `tmp/vim-host-20261111/vimhost-p04-readme` (artifact)
  - `impl-plans/progress/vimhost-p04-readme.md`
- **sharedPaths:** none

## Intent

Document the extension points so a host can adopt them without reading the source.

## Changes

Add one subsection, "Host extension points", inside the existing `emaki/vim` README section. Write it from the contracts pinned in `impl-plans/active/vimhost-00-overview.md` (C-R5-1, C-R5-2 and C-R5-3) and design §12. It covers:

1. **`actions`**
   - the handler signature and the context `{id, mode, cursor, state}`
   - the return contract: a number moves the cursor, `null` is "no target" (`no diagnostics` only for the diagnostic ids), void does nothing
   - unregistered ids do nothing
   - the seven `emaki.*` ids and the ex aliases `:eval`, `:evalall`/`:run`, `:hush` and `:format`
   - the host id rule (namespaced with a dot, at most 128 characters, modes `n`/`x`/`i`, `hop.*` reserved)
   - a `<leader>e` example
2. **A `hooks` table** with every member and its default, matching §12.3.
3. **A `VimSnapshot` field table**, plus:
   - the firing rule: no call on subscribe, at most one per call, timer changes delivered immediately
   - the operator-pending `cursorShape` note
4. **`render`** switches, and rendering hints and hop yourself from `snapshot.hints` and `snapshot.hop`.
5. **The low-level `createVimController`:**
   - a short example of a custom `VimHost`
   - the host prompt UI calling `submitPrompt` and `cancelPrompt`
   - `noteUpdate` with `userEvent` forwarding, and the fallback when it is omitted
   - `prompt.text` holding the initial text
   - the default scheduler and platform
6. **`tapMode()`** on `Vim` and `VimController`, for mode-toggle controls.

## Pitfalls

- Keep snippets short; signatures and usage only.
- The README is `.md`, so the boundary test does not scan it. Still, do not mention other projects by name.
- Do not edit any other README sections.

## Verification

- `rg -n 'Host extension points|createVimController|tapMode|noteUpdate|userEvent|render|hooks' README.md` → each term is matched (exit 0)

## Done criteria

- All six topics are present.
- The progress log records the hash before and after.

## Implementation progress

- The six documentation topics and before/after hashes are recorded in `impl-plans/progress/vimhost-p04-readme.md`; formal review remains pending.
