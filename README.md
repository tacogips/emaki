# emaki

A framework-independent canvas editor with virtualized text, incremental languages, decorations and inline widgets.

## Installation

Install `emaki` as `file:../emaki` or `github:tacogips/emaki#<sha>`. Its exports point to TypeScript source, so the consumer's bundler compiles it without a package build step. Install the exact peer versions `@codemirror/state@6.7.6` and `@codemirror/commands@6.11.1`.

Configure Vite with `resolve.dedupe: ['@codemirror/state', '@codemirror/commands']` and allow the package directory in `server.fs.allow` when using a local link. Configure Vitest with the same dedupe and `test.server.deps.inline: ['emaki']`. Set `preserveSymlinks: true` in TypeScript. These settings ensure one CodeMirror instance with local and Git installs.

## Quick start

```ts
import { createEditor } from 'emaki';
import { jsonLanguage } from 'emaki/json';

const editor = createEditor(document.getElementById('editor')!, {
  doc: '{"hello": true}', language: jsonLanguage,
});
// Later: editor.destroy();
```

Give the host a defined width and height. `createEditor` accepts `doc`, `language`, `plugins`, `theme` (palette and token colors), `font` (family, size, lineHeight, baseline), `readOnly`, `lineNumbers` (default true), CodeMirror `extensions`, and `modalKeys`. `gl`, `frameHost`, and `createCanvas` allow test injection. The default font is 13px monospace, with 18px line height and 14px baseline.

The returned handle exposes `state`, `dispatch`, `undo`, `redo`, `setDoc`, `onUpdate`, `onScroll`, `scrollTop`, `scrollTo({top})` or `scrollTo({pos})`, `lineTop`, `lineAtHeight`, `addPlugin`, `focus`, `requestFrame`, `revision`, `stats`, `perf`, and `destroy`. Subscriptions and `addPlugin` return removers. `destroy` is idempotent.

## Document and history

`state` is the current CodeMirror `EditorState`; `dispatch` accepts a transaction spec. `undo` and `redo` use the editor's bounded history. `setDoc` replaces the document without adding that replacement to history. Read-only mode rejects user input and deletion while allowing selection and programmatic dispatch.

## Languages

A line-kind `LanguageProvider` supplies `startState`, `tokenizeLine`, and `sameState`; the engine's `IncrementalHighlighter` uses checkpoints and visible-first tokenization. A span-kind provider supplies `spans(state, from, to, limit)` and may receive changes, an invalidation callback and disposal. Tags map to theme token colors. `emaki/json` exports `jsonLanguage`; `emaki/engine` exports the highlighter and composition blocks.

### Built-in languages

The registry contains these 71 language IDs. Plain text and build-output consoles are not highlighted.

| id | aliases | extensions/filenames |
| --- | --- | --- |
| `plaintext` | `text`, `txt` | `.txt` |
| `json` | `jsonc` | `.json`, `.jsonc` |
| `c` | — | `.c`, `.h` |
| `cpp` | `c++` | `.cpp`, `.cc`, `.cxx`, `.hpp`, `.hh`, `.hxx`, `.ipp`, `.inl` |
| `csharp` | `c#`, `cs` | `.cs`, `.csx` |
| `objc` | `objective-c` | `.m` |
| `objcpp` | `objective-c++` | `.mm` |
| `d` | — | `.d`, `.di` |
| `go` | `golang` | `.go` |
| `rust` | `rs` | `.rs` |
| `zig` | — | `.zig` |
| `swift` | — | `.swift` |
| `pascal` | `delphi` | `.pas`, `.dpr` |
| `actionscript` | `as` | `.as` |
| `java` | — | `.java`, `.bsh` |
| `groovy` | `gradle` | `.groovy`, `.gvy`, `.gradle` |
| `scala` | — | `.scala`, `.sbt` |
| `kotlin` | `kt` | `.kt`, `.kts` |
| `protobuf` | `proto`, `protocol-buffers` | `.proto` |
| `graphql` | `gql` | `.graphql`, `.gql` |
| `dot` | `graphviz` | `.dot`, `.gv` |
| `properties` | `java-properties` | `.properties` |
| `ini` | — | `.ini`, `.cfg` |
| `toml` | — | `.toml`, `Cargo.lock` |
| `hcl` | `terraform`, `tf` | `.hcl`, `.tf`, `.tfvars` |
| `javascript` | `js`, `js-erb` | `.js`, `.mjs`, `.cjs`, `.htc`, `.js.erb` |
| `typescript` | `ts` | `.ts`, `.mts`, `.cts`, `.d.ts` |
| `tsx` | — | `.tsx` |
| `jsx` | — | `.jsx` |
| `css` | — | `.css` |
| `html` | `htm`, `xhtml` | `.html`, `.htm`, `.shtml`, `.xhtml` |
| `xml` | `nant`, `xsd`, `svg` | `.xml`, `.xsd`, `.xslt`, `.svg`, `.rss`, `.build` |
| `vue` | — | `.vue` |
| `svelte` | — | `.svelte` |
| `python` | `py` | `.py`, `.pyw`, `.pyi`, `SConstruct` |
| `ruby` | `rb`, `rails` | `.rb`, `.rake`, `.gemspec`, `.rxml`, `.builder`, `Gemfile`, `Rakefile` |
| `perl` | `pl` | `.pl`, `.pm`, `.pod`, `.t` |
| `lua` | — | `.lua` |
| `r` | — | `.r`, `.rprofile` |
| `tcl` | — | `.tcl` |
| `bash` | `sh`, `shell`, `zsh`, `ksh`, `shell-unix-generic` | `.sh`, `.bash`, `.zsh`, `.ksh`, `.bashrc`, `.zshrc`, `.profile`, `.bash_profile` |
| `fish` | — | `.fish` |
| `batch` | `bat`, `cmd` | `.bat`, `.cmd` |
| `applescript` | — | `.applescript` |
| `makefile` | `make` | `.mk`, `.mak`, `Makefile`, `makefile`, `GNUmakefile`, `CMakeLists.txt` |
| `dockerfile` | `docker` | `.dockerfile`, `Dockerfile` |
| `sql` | `sql-erb` | `.sql`, `.ddl`, `.dml`, `.sql.erb`, `.erbsql` |
| `regexp` | `regex` | `.re` |
| `haskell` | `hs`, `lhs` | `.hs`, `.lhs` |
| `ocaml` | `ml`, `ocamllex`, `ocamlyacc`, `camlp4` | `.ml`, `.mli`, `.mll`, `.mly` |
| `erlang` | `erl` | `.erl`, `.hrl`, `Emakefile` |
| `clojure` | `clj` | `.clj`, `.cljs`, `.cljc`, `.edn` |
| `lisp` | `elisp`, `common-lisp` | `.lisp`, `.cl`, `.el`, `.lsp` |
| `nix` | — | `.nix` |
| `matlab` | — | `.matlab` |
| `markdown` | `md`, `multimarkdown` | `.md`, `.markdown`, `.mdown`, `.mmd` |
| `restructuredtext` | `rst` | `.rst`, `.rest` |
| `textile` | — | `.textile` |
| `latex` | — | `.tex`, `.ltx` |
| `tex` | — | `.sty`, `.cls` |
| `bibtex` | `bib` | `.bib` |
| `rd` | — | `.rd` |
| `diff` | `patch` | `.diff`, `.patch` |
| `yaml` | `yml` | `.yaml`, `.yml` |
| `haml` | — | `.haml` |
| `php` | — | `.php`, `.php3`, `.php4`, `.php5`, `.phtml` |
| `asp` | — | `.asp`, `.asa` |
| `jsp` | — | `.jsp` |
| `erb` | `rhtml`, `html-erb` | `.erb`, `.rhtml`, `.html.erb` |
| `erlang-html` | `yaws` | `.yaws` |
| `tcl-html` | `adp` | `.adp` |

### Selecting a language

```ts
import { resolveLanguage } from 'emaki/languages';

const byFile = resolveLanguage({ filename: 'src/app.d.ts' }); // typescript
const byFence = resolveLanguage({ fenceInfo: ' rust ignore' }); // rust
```

Resolution is case-insensitive and tries fence info, name, filename, then extension, returning the first match or `undefined` when none matches. Filenames match exact names first, then the longest extension suffix. Extensions may include a leading dot.

### Lazy loading

```ts
import { loadLanguage } from 'emaki/languages';
const lang = await loadLanguage('rust');
// Or import a language directly:
import { rustLanguage } from 'emaki/languages/rust';
```

The registry uses dynamic imports so bundlers can split language modules into chunks. Importing `emaki` alone pulls in no languages. Static imports of embedded languages can be shared by language chunks.

### Embedded languages

```ts
const markdown = await loadLanguage('markdown', { embedded: ['ts', 'python'] });
const allMarkdown = await loadLanguage('markdown', { embedded: 'all' });
```

Markdown fences whose languages were not loaded render as strings. HTML embeds JavaScript and CSS in `<script>` and `<style>`; PHP, server templates, Vue and Svelte include their embedded languages statically. Svelte expressions do not support `}` inside an expression; Vue opening tags spanning multiple lines are not supported; and HTML state restarts after a server block.

### Theme tags

The 23 `standardTags` are `keyword`, `string`, `number`, `comment`, `operator`, `punctuation`, `type`, `function`, `variable`, `property`, `constant`, `tag`, `attribute`, `heading`, `emphasis`, `strong`, `link`, `regexp`, `escape`, `meta`, `inserted`, `deleted`, and `invalid`. `defaultTokenColors` supplies colors for these tags and JSON's existing `json-*` tags.

```ts
import { createEditor } from 'emaki';
import { defaultTokenColors, loadLanguage } from 'emaki/languages';

const language = await loadLanguage('rust');
createEditor(el, {
  language,
  theme: { tokens: { ...defaultTokenColors, keyword: [1, 0.5, 0, 1] } },
});
```

## emaki/vim

Vim editing is opt-in through the separate `emaki/vim` entry; importing the core alone does not import vim, and core bundle bytes are unchanged.

```ts
import { createEditor } from 'emaki';
import { vim } from 'emaki/vim';

const v = vim({
  ex: ({ name, args, bang, line }) => {
    // Handle application commands here; return true if handled.
    return false;
  },
  clipboard: { read: () => navigator.clipboard.readText(), write: text => { void navigator.clipboard.writeText(text); } },
});
const editor = createEditor(host, { modalKeys: v });
const detach = v.attach(editor, host);
const unsubscribe = v.onChange(state => console.log(state.mode, state.pending, state.prompt, state.message));
console.log(v.state, v.cursorShape); // cursorShape: 'bar', 'block', or 'underline'
// Before destroying the editor:
unsubscribe();
detach();
editor.destroy();
```

`state` exposes `mode`, `pending`, `prompt` (`kind` and `text`, or null), and `message`. `onChange` returns an unsubscribe function. The optional `ex` callback receives `{name, args, bang, line}` and returns true when handled, or `{ message, kind? }` to handle it and show a status message (`kind` is `'info'` by default or `'error'`); vim itself has no file semantics. The optional `clipboard` supplies `read` and `write` for the `+` and `*` registers.

The adapter supports normal, insert, replace, visual, visual-line, visual-block and operator-pending modes; motions, operators, text objects, registers, counts, dot repeat, undo/redo, search, marks, hop and hints. Built-in ex commands include `:s`, `:noh` and `:{n}`; `:`, `/` and `?` open editable prompts. The mark-based block cursor still shows emaki's bar caret at its left edge.

### Host extension points

Pass `actions`, `hooks`, and `render` to `vim()` to adapt the engine to your host. Actions are a registry of `(context: { id, mode, cursor, state }) => number | null | void` handlers. A number moves the cursor (clamped to a normal-mode position, extending the visual selection when applicable); `null` means no target and shows `no diagnostics` only for the diagnostic actions; `void` does nothing. Unregistered actions and aliases are no-ops. A handler exception from a key mapping is swallowed and pending input is reset; one from an ex alias propagates out of `submitPrompt`.

```ts
const v = vim({
  actions: { 'app.evaluate': ({ state, cursor }) => { evaluate(state, cursor); } },
  keymap: { version: 1, leader: ' ', maps: { n: [{ lhs: '<leader>e', action: 'app.evaluate' }] } },
});
```

The ordinary registry keys `emaki.evaluate`, `emaki.evaluateAll`, `emaki.hush`, `emaki.format`, `emaki.completion`, `emaki.diagnostic.next`, and `emaki.diagnostic.prev` are available. Ex aliases dispatch `:eval` to `emaki.evaluate`, `:evalall` and `:run` to `emaki.evaluateAll`, `:hush` to `emaki.hush`, and `:format` to `emaki.format`. Other host IDs must match `^[A-Za-z][A-Za-z0-9_-]*(\.[A-Za-z0-9_-]+)+$`, be at most 128 characters, and are allowed in `n`, `x`, and `i`; `hop.*` is reserved for the engine. Keymap validation does not check registration.

Each provided `hooks` member replaces its default and is read at construction or attach; close over host state for dynamic behavior. `hooks.isDocumentBoundary(userEvent)` marks transactions that load or replace a whole document; on such a transaction the engine returns to normal mode and drops its undo ledger, insert session, dot-repeat record and visual selection (the host's own history reset stays the host's job). `hooks.routeMetaKeys: true` sends Cmd/Meta-modified keys through the engine, so non-shortcut Meta chords are consumed in normal mode instead of reaching the default keymap; by default they are returned unhandled. `normalizeKey(input, extended?)` is exported for hosts that apply `cmdline` remaps in their own prompt input.

| Hook | Default |
|---|---|
| `announce(message, assertive)` | No-op. |
| `closePopupWithEscape()` | Returns `false`. |
| `platform` | Detects Apple platforms from `navigator`, otherwise `'other'`. |
| `matchesDefaultKeymap(input)` | Returns `false`. |
| `compositionActive()` | Returns `false`. |
| `isVisible(pos)` | Checks whether `host.coordsAtPos(pos)` is non-null. |
| `historyReduced()` | Returns `false`. |
| `scrollCaret()` | Scrolls to the selection head. |
| `scrollLines(lines)` | Scrolls by lines from the viewport's first line. |
| `typeText(text)` | Replaces the selection with an `input.type` update. |
| `defaultKey(key)` | Handles newline and indent, and grapheme-aware backspace/delete. |

`v.state` and `v.onChange` expose a `VimSnapshot`; the low-level controller exposes the same data through `snapshot` and `subscribe`.

| Snapshot fields | Meaning |
|---|---|
| `mode`, `label`, `pending` | Current mode, display label, and pending keys. |
| `recording`, `search` | Recording register and search text, or `null`. |
| `message`, `messageKind` | Message and its `info`/`error` kind, or `null`. |
| `prompt` | `{ kind, text }` or `null`. |
| `cursorShape` | `bar`, `block`, or `underline`. |
| `displayCursor`, `displayCursorEnd` | Display cursor range. |
| `hints` | Hint prefix, entries, and summary, or `null`. |
| `hop` | Hop labels and revision, or `null`. |

Subscriptions do not fire on registration. Changes are deduplicated over the full snapshot and coalesced to at most one delivery per public call; timer changes are delivered immediately. The snapshot uses `underline` in operator-pending mode, while `v.cursorShape` and its cursor marks use `block`.

`render: { search: false, hints: false, hop: false }` disables the respective default marks independently (each defaults to `true`). Render your own hints and hop UI from `snapshot.hints` and `snapshot.hop`; no renderer callbacks are needed.

For a custom surface, implement `VimHost` and drive the low-level controller:

```ts
import { createVimController, type VimHost } from 'emaki/vim';

// Supply state, dispatch, undo/redo, scrolling, viewport, coordinates and marks.
const host: VimHost = makeHost();
const controller = createVimController(host, { render: { search: false, hints: false, hop: false } });
const unsubscribe = controller.subscribe(snapshot => renderStatus(snapshot));
// For each external transaction, including selection changes:
controller.noteUpdate({ state, changes, docChanged, selectionSet, userEvent });
// Your prompt UI submits its edited text or cancels:
controller.submitPrompt(text); // alternatively: controller.cancelPrompt()
```

Forward the transaction's `userEvent`, including explicit `null`, to `noteUpdate` for repeat, macro, and undo classification. If the property is omitted, the legacy heuristic uses `'input.type'` for a document change while text input is allowed, otherwise `null`. A custom `typeText` or `defaultKey` that dispatches updates must forward their event classifications too. The low-level `snapshot.prompt.text` is initial prompt text (`''` or `'<,'>`); the host owns subsequent editing. With all renderers disabled, `marks` may be a no-op. The exported controller supplies a scheduler and detects platform by default.

Call `v.tapMode()` or `controller.tapMode()` from a mode-toggle control: it flushes pending input and toggles between insert and normal behavior. `v.tapMode()` does nothing before attach or while a prompt is open. Call `controller.blur()` when a custom surface loses focus; it clears hop and pending input and returns operator-pending to normal.

### Keymaps

A keymap is JSON with `version: 1`, optional `leader` and `timeoutlen`, mode arrays `maps.{n,i,x,v,o,c}`, and optional `hints` and `hop` settings. Each mapping has `lhs` and exactly one of `rhs` or `action`, with optional `remap` and `desc`. For example:

```json
{
  "version": 1,
  "leader": " ",
  "timeoutlen": 1000,
  "maps": {
    "i": [{ "lhs": "jj", "rhs": "<Esc>", "desc": "Leave insert mode" }],
    "n": [{ "lhs": "<leader>w", "rhs": ":w<CR>", "remap": false }]
  },
  "hints": { "enabled": true },
  "hop": { "enabled": true }
}
```

Pass JSON text or an object as `vim({ keymap })`, or choose `vim({ preset: 'default' })` or `vim({ preset: 'mise-darwin' })`; `KEYMAP_PRESETS` lists the bundled presets. An explicit keymap takes precedence over a preset. A mapped prefix resolves after `timeoutlen` milliseconds.

`v.setKeymap(textOrObjectOrNull)` replaces the keymap without remounting and returns `{applied, issues}`. A failed compile leaves the previous keymap in place; `null` resets to base bindings. `v.keymapIssues` contains the latest compile issues. `compileKeymap(text)` returns `{keymap, issues}` for validation; `KEYMAP_MAX_BYTES` limits the UTF-8 size.

### Keymap persistence

`KeymapStore` is an async interface with `load`, `save`, and `clear`. `new LocalKeymapStore({ key?, storage? })` uses localStorage by default, with key `emaki.vim.keymap`. It does not validate JSON: it enforces the byte limit and handles storage errors. `save` returns `{ok: false, reason: 'too-large' | 'unavailable'}` on failure, `load` returns `null` on failure, and its methods never reject. `vim()` never reads storage itself:

```ts
import { LocalKeymapStore, vim } from 'emaki/vim';
const store = new LocalKeymapStore();
const saved = await store.load();
const v = vim({ keymap: saved ?? undefined });
// After validating a user's JSON: await store.save(jsonText);
// To remove it: await store.clear();
```

## Decorations and precedence

Plugins set marks by owner with ranges and styles: color, background, font weight/style, underline, strike, opacity and glow. Animated marks support only quad-based styles (background, glow, underline, strike and labels), keeping text shaping unchanged. Line formats provide background, color, weight/style, opacity, a left bar and gutter marker/background. Both map through edits.

Within a category later entries win. Text color precedence is default, syntax, line, then mark; font weight/style is default, line, then mark. Line and mark opacity multiply. Background order is editor, line, static mark, selection, animated mark, glow. Overlay order is static underline/strike, composition, cursor, static labels, hop labels, touch handles, animated labels. Gutter order is background, line numbers, markers; the left bar sits at the text edge.

## Plugins and widgets

A plugin has `name` and `attach(host)`, returning optional `docChanged`, `viewportChanged`, `frame`, and `destroy` hooks. Hooks run in registration order. A thrown hook is isolated and the plugin is removed with its owners and animated providers. The read-only host supplies `state`, `marks`, `lineFormats`, `animatedMarks`, `widgets`, `requestFrame`, `setActive`, `coordsAtPos`, `lineTop`, `viewport`, `theme`, and `reportError`; it cannot edit the document.

Block widgets anchor above or below a line with a chosen height. End-of-line widgets have a width and do not change line height. Content is either DOM (`mount` returns cleanup) or canvas (`draw` returns whether animation should continue). A canvas widget may also supply `version()`; while it animates, it repaints only when that value changes (`Object.is`), so content that updates less often than the display does not repaint every frame. Anchors map through changes; deleted anchors and removed owners unmount. Widgets mount near the viewport and unmount farther away with hysteresis; canvas draws occur only while visible. Interactive widgets receive pointer events; other widgets let editor hit testing pass through. Caret movement skips block space.

## Composition and diff

`emaki/engine` exposes the core, layout, render, input, view, decoration, plugin and language building blocks for custom hosts. `emaki/diff` exports reusable line and word diff and split-alignment functions. `emaki/languages` exports the registry and lazy loader; `emaki/languages/<id>` exports individual languages.

## Scripts and metrics

`npm run dev` serves the demo pages. `npm run check`, `npm test`, `npm run build`, `npm run perf`, and `npm run e2e` check types, tests, demos, performance and browser behavior respectively.

`perf.onPresent` reports frame start/end, work time, revision and whether visible highlighting is complete. `perf.onInput` reports the event `type` (`keydown` or `beforeinput`), event timestamp, capture-to-bubble work, and the revision before and after each event; a keydown and the beforeinput it produces share `revisionBefore`, so their work can be combined. First paint measures `setDoc` to the first complete visible frame. Scroll measures frame work p95; keystroke metrics record raw keydown-to-present and gate input plus frame work and next-frame presentation. Diff latency measures keydown to both sides presenting the revision. Scaling compares the 1k, 10k and 100k fixtures; rAF intervals are informational.

## Tauri standalone editor

`examples/tauri-editor` runs emaki in a native Tauri 2 window with lazy language detection.

Install dependencies at the repository root with `npm install` first. Install rustup stable and the [Tauri 2 system prerequisites](https://v2.tauri.app/start/prerequisites/). The Tauri CLI runs `cargo` from `PATH`, so put `~/.cargo/bin` ahead of any version-manager shim (for example `PATH="$HOME/.cargo/bin:$PATH"`).

```sh
cd examples/tauri-editor
npm install
npm run tauri dev
# To open a file on launch:
npm run tauri dev -- -- path/to/file
```

| Shortcut | Action |
| --- | --- |
| Cmd/Ctrl+N | New |
| Cmd/Ctrl+O | Open |
| Cmd/Ctrl+S | Save |
| Cmd/Ctrl+Shift+S | Save As |

The **vim** checkbox (`#vim`) persists its on/off state under `emaki-tauri-editor.vim`; `#vim-mode` displays the mode or active prompt. Toggling remounts the editor and loses undo history. Cmd/Ctrl+N, O and S (and Shift+S) work in every mode, including prompts.

| Vim command | Action |
| --- | --- |
| `:w` | Save |
| `:w path`, `:saveas path` | Save As, with the picker preselected to the basename |
| `:wq`, `:x` | Save and close once clean |
| `:q` | Close after the unsaved-changes guard |
| `:q!` | Close without the guard |
| `:e` | Guard, then open with the picker |
| `:e path` | Guard, then native “Open {path}?” confirmation, then open |

The **keymap…** button selects a JSON file in a native dialog, validates it, applies a valid keymap live and persists it under `emaki-tauri-editor.vim.keymap`. Issues appear in the status bar; an invalid file leaves the current keymap and saved value unchanged. **reset keymap** clears the saved keymap and restores base bindings. A picked keymap file is granted for reading and writing like any opened file.

From `examples/tauri-editor`, run `npm run check`, `npm run build`, and `npm run smoke` (browser smoke with mocked IPC). Run Rust tests with `cd src-tauri && ~/.cargo/bin/cargo test`; from the example directory, build the native binary with `npx tauri build --debug --no-bundle`.

Dialogs run in Rust. `read_text_file` and `write_text_file` accept only paths granted by a CLI argument or dialog. The app uses no fs plugin, minimal capabilities, and a strict CSP. Files must be UTF-8; line endings are saved as LF.

The analyzed dirty-on-launch cause is that any `docChanged` update previously marked the document dirty without comparing its content. The editor now compares against a clean baseline captured on load or save. The native event sequence was not observed (no GUI session), so the precise native trigger remains unconfirmed.

## License

MIT.
