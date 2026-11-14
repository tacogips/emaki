# User Q&A: emaki/vim and the Tauri vim toggle

Items 2–7 have defaults that implementation proceeds with. Answer only if you want something different.

Item 1 is **pending and unapproved**. Implementation follows the accepted criterion until you explicitly approve a change.

1. **Scope-amendment proposal (PENDING, NOT APPROVED): allow a small core-bundle growth for a native vim cursor.**
   - **Accepted criterion, in force now:** the core bundle is unchanged. The `.`, `./engine`, `./json` and `./diff` bytes must be identical before and after (`design-vim.md` §9 D8, V2).
   - **Consequence today:** the block cursor is drawn as a mark, and emaki's bar caret stays visible at the block's left edge.
   - **Proposal:** add an optional `ModalKeyHook.attach(editor, control)` and pass `cursorShape`/`hopLabels` through `editor-frame.ts`, which draws a true block cursor and hides the bar.
   - **Cost:** an estimated ≤300 B gzip on the `.` entry, which would break the "unchanged" criterion.
   - **What happens next:** this applies only with explicit approval. Silence keeps the accepted criterion.
2. **`isFileBoundary`.**
   - **Default:** drop it. emaki has no multi-file buffers, and the affected test cases are excluded and listed in the commit.
   - **Alternative:** a `VimOptions.isBoundary(state, line)` hook.
3. **`:e {path}` in the Tauri example.**
   - **Default flow:** discard guard → native "Open {path}?" confirmation, which grants the path → open.
   - **Alternatives:**
     - reject paths that are not already granted
     - always fall back to the picker
4. **Vim hints.**
   - **Default:** keep them only if they can be expressed through emaki marks, otherwise strip them.
   - The commit message states which was done.
5. **Tauri user keymap source (revision 4).**
   - **Default:** a status-bar "keymap…" button opens the native file dialog. It uses the existing grant-checked `pick_open_path`/`read_text_file`, and the text is persisted in `localStorage` through `LocalKeymapStore` (`design-vim.md` §7.1, D11).
   - **Alternative:** also auto-load `<app config dir>/vim-keymap.json`. That needs a new Rust command (or a granted path) and widens the IPC surface.
   - Answer only if you want the config-dir path in addition.
6. **Host action id rule (revision 5).**
   - **Default:** keymaps may name any namespaced id (`^[A-Za-z][A-Za-z0-9_-]*(\.[A-Za-z0-9_-]+)+$`, at most 128 characters) in modes `n`, `x` and `i`, and an unregistered id does nothing at runtime (`design-vim.md` §12.2). Undotted ids stay compile errors, so typos are still caught.
   - **Alternative:** a host-supplied `{id: modes}` table given to `compileKeymap`, so unknown ids are compile errors. This makes the standalone `compileKeymap` registry-dependent.
7. **`platform` hook semantics (revision 5).**
   - **Default:** the platform reaches `isPassThrough` unchanged. The ported platform-shortcut cases decide whether a platform-dependent pass-through branch is restored in `keys.ts` (§12.3). If none of them requires one, the hook stays plumbed but has no effect on its own.
   - **Alternative:** define emaki-specific platform behavior, for example Ctrl versus Cmd pass-through sets. This is not requested.
