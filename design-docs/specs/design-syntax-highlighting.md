# Design: multi-language syntax highlighting

**Status.** Accepted for implementation. The canvas-native approach decision is confirmed under section 3.3 by the evidence in section 10.

**Scope.** The emaki repository only. The chilla and vactr repositories are read-only references. emaki gets no chilla- or vactr-specific code.

## 1. Baseline (HEAD 1de212f)

- **Language contracts.** `src/types.ts` defines `LineLanguage<S>` (`startState`, `tokenizeLine(text, state)`, `sameState`) and `SpanLanguage` (`spans(state, from, to, limit)` → `{spans, truncated}`, plus optional `noteChanges`, `setInvalidate` and `dispose`).
- **Incremental highlighter.** `src/language/incremental.ts`:
  - Checkpoints every 32 lines.
  - Keeps a 4096-entry LRU keyed by `text + stateKey`. A primitive state is keyed by its value. An object state is keyed by its identity, through a WeakMap.
  - Trusts and caches the end state that `tokenizeLine` returns, and propagates it to later lines.
- **JSON.** `src/language/json.ts` / `json-tokenizer.ts`: `jsonLanguage` has a string state and emits `json-{key,string,number,bool,null,punct,invalid}`.
- **Frame completeness.** `src/editor-frame.ts:36-52` sets `visibleComplete = !highlighter.approximate` for line languages and `!truncated` for span languages. It feeds `PresentSample.visibleComplete`, which `firstPaintMs` waits for.
- **Theme.** `createEditor({ theme: { tokens } })` merges into `palette.token`. `src/render/text-pass.ts` looks up colors by exact tag, and unknown tags use `palette.text`.
- **Exports and dependencies.** Exports are `.`, `./engine`, `./diff` and `./json`. The only peer dependencies are `@codemirror/state` and `@codemirror/commands`. There are no runtime dependencies.
- **Perf.** `scripts/perf.mjs` drives `dist/json-10k` and `dist/diff` through `scripts/route-server.mjs`, which already serves `.wasm` with the right MIME type. It uses `examples/json-10k/perf-hook.ts` (`window.__emakiPerf`: `load`, `startRecording`, `stopRecording`, `scrollBy`, `caretToLine`, `info`, `keyMetrics`). At 10k lines on Chromium and WebKit the gates are `firstPaintMs` ≤ 200, `scrollWorkP95` ≤ 16.7, `keyWorkP95` ≤ 16.7 and `nextFrameRatio` ≥ 0.95, plus `diffLatencyP95` ≤ 100 and 1k-vs-100k `sizeScaling`.

None of these behaviors change.

## 2. Goals and non-goals

**Goals:**

- Map all 85 chilla inventory entries (section 7).
- Add the languages listed in section 8.
- Provide a selection API that resolves by name, extension, filename and fence info string.
- Embed languages in:
  - Markdown fences
  - HTML `<script>`/`<style>`
  - PHP
  - server templates
  - Vue and Svelte single-file components
- Map standard tags to colors.
- Add zero bytes to the `.` entry.
- Compare the approaches with measurements (sections 9.5 and 10).

**Non-goals:**

- Shipping tree-sitter in emaki.
- TextMate scope parity.
- Swapping the language at runtime on a live editor. The `language` option is set at creation.
- A public grammar-authoring API.

## 3. Approach decision

### 3.1 Confirmed decision: canvas-native

All languages are emaki-original line tokenizers. They are compiled from compact declarative grammars, implement `LineLanguage<string>`, and run on the unchanged `IncrementalHighlighter`. No tree-sitter adapter ships.

### 3.2 Rationale

These are hypotheses that section 10 must confirm with measurements.

1. **Dependency constraint.** Tree-sitter needs `web-tree-sitter` as a runtime dependency plus about 85 grammar `.wasm` files. emaki is "peer deps only, TS source exports". Canvas-native means plain TS, with no wasm and no async init.
2. **Size per language.** The tree-sitter runtime plus grammar wasm is expected to be far larger than a canvas-native module, which targets ≤ 6 KB gzip. Section 10.1 measures both.
3. **Highlighter fit.** `IncrementalHighlighter` provides visible-first, 2 ms-per-frame, checkpointed tokenization. Tree-sitter needs a full parse before the visible range is complete. Sections 10.2 and 10.3 measure the first-paint and keystroke impact on both sides.
4. **Embedding.** Composite string state keeps checkpoint equality and the cache (section 5.3). Tree-sitter needs injection queries and a parser per injected range.
5. **Licensing and maintenance.** emaki authors the grammars (MIT), and family factories (section 5.4) keep the language count maintainable. Section 10.5 records lines of code per module next to the tree-sitter upkeep (ABI pinning, wasm rebuilds, highlight queries).

### 3.3 Confirmation rule

The decision is **confirmed** only when all of the following hold:

- (a) Every row of tables 10.1 to 10.3 is filled with measured values for both approaches, on Chromium and WebKit, for the comparison set in section 9.5.
- (b) Every canvas-native gate in section 9.3 passes on both browsers for every language in `--langs`.
- (c) Each canvas-native language module is ≤ 6 KB gzip. Embedding hosts (html, php, markdown, vue, svelte and the templates) are ≤ 12 KB gzip including their static embeds.
- (d) The `.` entry grows by ≤ 0.25 KB gzip.
- (e) Section 10.6 states the comparative rationale, citing the measured rows.

**Outcomes:**

- If (a) cannot be completed, for example because the spike cannot install, the status stays **provisional**. The approach-decision acceptance signal is reported unmet and blocked. Implementation of the canvas-native languages may proceed, but the decision is not declared confirmed.
- If (b) fails for a language after one tokenizer optimization pass, or if tree-sitter meets every budget while canvas-native misses one, record the result and open a user-QA proposal for a hybrid. The hybrid would be an optional `emaki/tree-sitter` subpath with `web-tree-sitter` as an optional peer. Do not implement it without approval.

## 4. Public API and package layout

### 4.1 package.json exports

These are additions. Existing entries stay byte-identical.

```
"./languages":   "./src/language/registry.ts",
"./languages/*": "./src/language/langs/*.ts"
```

- `emaki/json` and `jsonLanguage` are unchanged: same object, same `json-*` tags. `langs/json.ts` re-exports it.
- `src/language/index.ts` is unchanged, so `emaki/engine` does not pull in the grammar engine or the registry.
- `src/index.ts` is unchanged.
- No new `dependencies` or `peerDependencies`.

### 4.2 `emaki/languages` (registry, metadata plus lazy loaders)

```ts
interface LanguageInfo { id: string; name: string; aliases: readonly string[]; extensions: readonly string[]; filenames: readonly string[] }
const languages: readonly LanguageInfo[];
function resolveLanguage(query: { name?: string; extension?: string; filename?: string; fenceInfo?: string }): LanguageInfo | undefined;
function loadLanguage(idOrInfo: string | LanguageInfo, opts?: { embedded?: readonly string[] | 'all' }): Promise<LineLanguage<string>>;
const standardTags: readonly StandardTag[];
const defaultTokenColors: Record<string, Rgba>;
```

**Registry module rules**

- The registry holds metadata plus a `Record<moduleId, () => import('./langs/<moduleId>.ts')>` table. It never statically imports a `langs/*` module.
- Alias ids point at another module's id (section 7, status **A**).
- `loadLanguage` caches the promise per (id, embedded set). A failed import rejects and is not cached.

**Resolution rules**

- All lookups are case-insensitive. Precedence is `fenceInfo`, then `name`, then `filename`, then `extension`.
  - `name` matches `id`, `name` or `aliases`.
  - `filename` matches an exact basename first (`Dockerfile`, `Makefile`, `GNUmakefile`, `CMakeLists.txt`, `.bashrc`, `Emakefile`), then the longest dotted suffix (`foo.html.erb` matches `erb` before `html`, and `foo.d.ts` matches `typescript`).
  - `extension` accepts input with or without the leading dot.
- `fenceInfo`:
  - Trim it and take the first whitespace-delimited word.
  - Strip a leading `{.` or `{` and a trailing `}`.
  - Drop anything from the first `,` onward.
  - Match the result as a name, then as an extension.
- Anything unknown returns `undefined`. It never throws.

**Embedded languages**

- `opts.embedded` applies to `markdown`, the only host with dynamic embeds. Each name is resolved through `resolveLanguage({ fenceInfo })` and loaded before the host is built. `'all'` loads every language.
- The embed set is fixed when the host is created. A fence whose language was not loaded has its body tagged `string`.

### 4.3 `emaki/languages/<id>`

- Each module exports `<camelId>Language: LineLanguage<string>`.
- `markdown` also exports `createMarkdownLanguage(embedded: (fenceInfo: string) => LineLanguage<string> | undefined)`.
- These hosts import their embeds statically:

| Host | Static embeds |
|---|---|
| html | javascript, css |
| php | html |
| asp, jsp, erb, erlang-html, tcl-html | html plus their server language |
| vue, svelte | html, javascript, typescript, css |
| dockerfile | bash |

### 4.4 Theme tags

- Grammar languages emit only tags from `standardTags`: `keyword`, `string`, `number`, `comment`, `operator`, `punctuation`, `type`, `function`, `variable`, `property`, `constant`, `tag`, `attribute`, `heading`, `emphasis`, `strong`, `link`, `regexp`, `escape`, `meta`, `inserted`, `deleted` and `invalid`.
- `defaultTokenColors` maps every standard tag and every `json-*` tag to colors that are readable on `FALLBACK_PALETTE.background`.
- Usage: `createEditor(el, { language, theme: { tokens: defaultTokenColors } })`.
- No change to `text-pass.ts`.

## 5. Grammar engine (`src/language/grammar.ts`, internal)

### 5.1 Grammar shape

A grammar is a set of named states. Each state is an ordered list of rules:

```
{ match: RegExp, tag?: StandardTag | StandardTag[] /* per capture group */, push?: string, pop?: true, next?: string, embed?: EmbedSpec }
```

The grammar compiles once to sticky (`y`) regexes and returns a `LineLanguage<string>`.

### 5.2 Tokenizing a line

- At each offset, try the rules of the top state in order. The first match emits its token(s), then applies `pop`, `push` or `next`.
- A zero-length match that does not change state is skipped.
- If no rule matches, advance one code point with no token.
- A state may declare end-of-line behavior. For example, a line-comment state pops at end of line.
- **No long-line cutoff.** Every line is scanned to its true end, and every state transition is applied, so the returned end state is always exact. The cost is linear in line length. That cost is measured (section 9.3, long-line informational metric), not bounded by skipping. A cutoff that drops token emission while still scanning may be added only if that metric shows a budget failure. It must keep end-of-line state exact and pass the section 9.1 long-line regressions.
- Tokens are non-overlapping and ascending, and lie within `[0, text.length]`.

### 5.3 State encoding and embedding

- The state is a plain string: the stack of state names joined by `/`. `sameState` is `===`.
- For an embed, the state becomes `outerStack\u0001innerId\u0002innerState`.
- While inside an embed, each line is first checked against the embed's `end` pattern:

| Host | `end` pattern |
|---|---|
| Markdown | closing fence of the same character and at least the same length |
| HTML, Vue, Svelte | `</script\s*>` or `</style\s*>` (case-insensitive) |
| PHP, templates | `?>` / `%>` |
| Vue template interpolation | `}}` |
| Svelte | `}` (Svelte template expressions containing a literal `}` are a documented limitation) |

- Text before `end` goes to the inner language. The `end` match is tokenized by the outer grammar.
- Inner languages are `LineLanguage<string>`, so `incremental.ts` needs no changes.
- Vue `<script lang="ts">` and `<style lang="scss|css">` select typescript or css. Svelte works the same way.

### 5.4 Family factories (internal)

Shared factories parameterized by keyword, type and literal lists:

- `cLike`: C, C++, C#, Java, Objective-C/C++, D, Go, Groovy, Scala, Kotlin, Swift, Rust, Zig, ActionScript, JavaScript/TypeScript, Protocol Buffers, GraphQL and Pascal-ish languages.
- `lispLike`: Lisp and Clojure.
- `shellLike`: Bash, fish and Batch.
- `markupLike`: HTML and XML.
- `iniLike`: INI, Java Properties and TOML.

Per-language modules add their specific rules, such as raw strings, template literals, lifetimes, heredocs and nested comments.

## 6. Fidelity contract

A module-backed language "highlights real tokens" when its fixture test (section 9.1) passes:

- For each sample, at least these tag classes appear: `keyword`, `string`, `comment`, and `number` when the language has numeric literals.
- Each `[snippet, tag]` expectation is met at the snippet's first occurrence.

Markup and prose languages (Markdown, reStructuredText, Textile, LaTeX/TeX/BibTeX, XML/HTML, Diff, Haml, Rd) use their own classes instead: `heading`, `tag`, `attribute`, `inserted`, `deleted` and `meta`.

## 7. chilla inventory mapping (85 entries)

**Source.** `/Users/taco/gits/tacogips/chilla/design-docs/specs/design-syntax-inventory.md` (read-only).

**Provenance.** The step-2 sandbox denied reads of that path. The step-3 review read it and confirmed:

- 85 backend entries
- NAnt Build File, Protocol Buffers, INI and HCL are present (reference lines 23, 97 and 99–101)
- TOML, Dockerfile, Zig, Kotlin and GraphQL are already present in chilla

The table is the syntect default Sublime set (75 entries, including hidden ones) plus those confirmed additions and the project-authored Swift and Nix (10 entries). That is exactly 85.

**Implementation task 0** (blocking, before any grammar work): verify each row name-for-name against the reference. A mismatch is routed back to the design step. It is never resolved by a default disposition.

**Statuses:**

- **C**: dedicated module, with an own fixture file under section 9.1.
- **A**: resolves to another module. The obligation is a registry resolution test, plus the stated host-fixture expectation where one applies.
- **X**: excluded, with a reason.

| # | chilla entry | emaki id → module | Status and fixture obligation |
|---|---|---|---|
| 1 | Plain Text | plaintext (no-token language) | X for token fixtures: plain text has no tokens by definition. It is registered for resolution (`txt`). |
| 2 | ActionScript | actionscript | C |
| 3 | AppleScript | applescript | C |
| 4 | ASP | asp | C (html-template + VBScript-lite) |
| 5 | HTML (ASP) | asp | A (`.asp` → asp) |
| 6 | Batch File | batch | C |
| 7 | NAnt Build File | nant → xml | A (`.build` → xml). The fixture `test/fixtures/languages/nant.build` must yield `tag` and `attribute`. |
| 8 | C# | csharp | C |
| 9 | C++ | cpp | C |
| 10 | C | c | C |
| 11 | CSS | css | C |
| 12 | Clojure | clojure | C |
| 13 | D | d | C |
| 14 | Diff | diff | C |
| 15 | Erlang | erlang | C |
| 16 | HTML (Erlang) | erlang-html | C (html-template + erlang, `.yaws`) |
| 17 | Go | go | C |
| 18 | Graphviz (DOT) | dot | C |
| 19 | Groovy | groovy | C |
| 20 | HTML | html | C (embeds javascript and css) |
| 21 | Haskell | haskell | C |
| 22 | Literate Haskell | lhs → haskell | A |
| 23 | Java Server Page (JSP) | jsp | C (html-template + java) |
| 24 | Java | java | C |
| 25 | JavaDoc (hidden) | java | A. The java fixture asserts that `@param` in `/** */` is `meta`. |
| 26 | Java Properties | properties | C |
| 27 | JSON (chilla dedicated lexer) | json (existing `jsonLanguage`) | C (existing tests plus a registry fixture) |
| 28 | JavaScript (TS/TSX/JSX aliased here in chilla) | javascript | C. TS/TSX/JSX get dedicated modules (section 8). |
| 29 | Regular Expressions (JavaScript) (hidden) | javascript | A. The javascript fixture asserts that `/a+b/g` is `regexp`. |
| 30 | BibTeX | bibtex | C |
| 31 | LaTeX Log (hidden) | — | X: build-log output panel, not source |
| 32 | LaTeX | latex | C |
| 33 | TeX | tex | C |
| 34 | Lisp | lisp | C |
| 35 | Lua | lua | C |
| 36 | Make Output (hidden) | — | X: build-tool output, not source |
| 37 | Makefile | makefile | C |
| 38 | Markdown | markdown | C (dynamic fence embeds) |
| 39 | MultiMarkdown (hidden) | multimarkdown → markdown | A |
| 40 | MATLAB | matlab | C |
| 41 | OCaml | ocaml | C |
| 42 | OCamllex | ocamllex → ocaml | A |
| 43 | OCamlyacc | ocamlyacc → ocaml | A |
| 44 | camlp4 (hidden) | camlp4 → ocaml | A |
| 45 | Objective-C++ | objcpp | C |
| 46 | Objective-C | objc | C |
| 47 | PHP Source (hidden) | php | A. The php fixture covers code inside `<?php ?>`. |
| 48 | PHP | php | C (embeds html) |
| 49 | Pascal | pascal | C |
| 50 | Perl | perl | C |
| 51 | Python | python | C |
| 52 | Regular Expressions (Python) (hidden) | — | X: a hidden helper that highlights regex syntax inside Python strings. The python host emits `string` for those strings, so no host token is lost. |
| 53 | R Console (hidden) | — | X: interactive console transcript, not source |
| 54 | R | r | C |
| 55 | Rd (R Documentation) | rd | C |
| 56 | HTML (Rails) | erb | C (html-template + ruby, `.erb`/`.rhtml`/`.html.erb`) |
| 57 | JavaScript (Rails) | js-erb → javascript | A (`.js.erb`) |
| 58 | Ruby Haml | haml | C |
| 59 | Ruby on Rails | rails → ruby | A (`.rxml`, `.builder`) |
| 60 | SQL (Rails) | sql-erb → sql | A (`.sql.erb`, `.erbsql`) |
| 61 | Regular Expression | regexp | C |
| 62 | reStructuredText | restructuredtext | C |
| 63 | Ruby | ruby | C |
| 64 | Cargo Build Results (hidden) | — | X: build-tool output, not source |
| 65 | Rust | rust | C |
| 66 | SQL | sql | C |
| 67 | Scala | scala | C |
| 68 | Bourne Again Shell (bash) | bash | C (aliases sh, zsh, ksh) |
| 69 | Shell-Unix-Generic (hidden) | bash | A |
| 70 | commands-builtin-shell-bash (hidden) | bash | A. The bash fixture asserts that `echo` is `function`. |
| 71 | HTML (Tcl) | tcl-html | C (html-template + tcl, `.adp`) |
| 72 | Tcl | tcl | C |
| 73 | Textile | textile | C |
| 74 | XML | xml | C |
| 75 | YAML | yaml | C |
| 76 | Swift (chilla-authored) | swift | C, written fresh (chilla grammar not copied) |
| 77 | Nix (chilla-authored) | nix | C, written fresh (chilla grammar not copied) |
| 78 | TOML | toml | C |
| 79 | Dockerfile | dockerfile | C (`RUN` embeds bash) |
| 80 | Zig | zig | C |
| 81 | Kotlin | kotlin | C |
| 82 | GraphQL | graphql | C |
| 83 | INI | ini | C |
| 84 | HCL | hcl | C (`.hcl`, `.tf`, `.tfvars`) |
| 85 | Protocol Buffers | protobuf | C (`.proto`) |

**Tally.** 85 rows: 6 X (1, 31, 36, 52, 53, 64), 15 A (5, 7, 22, 25, 29, 39, 42, 43, 44, 47, 57, 59, 60, 69, 70), 64 C. The only exclusion classes are tool-output or console grammars, hidden helpers whose host already emits the token, and plain text.

## 8. Languages added beyond chilla

These are the candidates absent from chilla's 85 entries. Rust, YAML, TOML, Kotlin, Zig, Dockerfile and GraphQL are **already in chilla** (rows 65, 75, 78–82) and are not additions.

| id | Reason |
|---|---|
| typescript, tsx, jsx | Dedicated modules. chilla aliases them to JavaScript and so misses type annotations, generics, `interface`/`type`/`enum`/`satisfies`, and JSX tags and attributes. TypeScript is emaki's own language and its most likely consumer content. This is an intentional divergence from chilla row 28. |
| vue | Single-file components are a common web format. Implemented with the HTML host plus static embeds (section 5.3), so the embedding work is shared. |
| svelte | Same reasoning as vue, with the template-expression limitation in section 5.3. |
| fish | The only shell candidate with genuinely different syntax (`end` blocks, `set`, `(cmd)` substitution). Cheap through `shellLike`. `zsh`, `ksh` and `sh` are aliases of bash, which chilla already covers. |

Each added language is **C**, with its own fixture under section 9.1.

## 9. Verification design

### 9.1 Per-language fixture tests

- Every **C** id has a sample at `test/fixtures/languages/<id>.<ext>`. Each sample is 20–60 lines and exercises comments, strings, numbers, keywords and the special constructs of that language. Each id also has `[snippet, tag]` expectations in `test/fixtures/languages/expectations.ts`.
- `test/language/languages.test.ts` iterates `languages`. It:
  1. fails if any module-backed id lacks a sample or expectations
  2. tokenizes the sample through `IncrementalHighlighter` over a CodeMirror `Text`
  3. asserts the section 6 classes and the expectations
  4. asserts that tokens are ordered and in range
  5. asserts that after a mid-file one-character edit, the incremental tokens equal a fresh full tokenization **and** still satisfy the expectations
- Each **A** row has a test asserting its resolution target and the host-fixture expectation named in its row. That covers NAnt with its own `nant.build` fixture, JavaDoc, JavaScript regex, PHP Source and bash builtins.
- **Long-line regressions** (`test/language/long-line.test.ts`, c and html, plus a markdown fence case):
  - (a) `/*` + 4097×`a` + `*/` on one line, then `int answer = 42;` on the next line. Line 2 has `keyword` (`int`) and `number` (`42`).
  - (b) Line 1 is 4097×`a` + `/*`, and line 2 is `int x;`. Line 2 is `comment`.
  - (c) Starting from (a), an edit inserts characters before `*/`, moving it across offset 4096 and back. After each edit, the incremental tokens equal a fresh tokenization and line 2's tags match (a).
  - (d) An HTML `<script>` whose `</script>` starts after offset 4096. The following line has HTML `tag` tokens.

### 9.2 Selection, embedding and theme tests

- `test/language/registry.test.ts` covers:
  - name, alias, extension (with and without the dot), exact filename, longest suffix (`x.html.erb`, `x.d.ts`, `x.js.erb`)
  - the fence forms (`ts`, ` rust ignore`, `{.python}`, `js,linenos`)
  - case-insensitivity
  - unknown input returning `undefined`
  - `loadLanguage` caching and rejection without caching
- `test/language/embedded.test.ts` covers:
  - A Markdown fence with a loaded language produces inner tags. An unloaded one produces `string`.
  - HTML `<script>` produces JS tags and `<style>` produces CSS tags.
  - Vue `<script lang="ts">` produces TypeScript tags and `{{ }}` produces JS tags.
  - Svelte `{expr}` produces JS tags.
  - PHP `<?php ?>` produces PHP tags.
  - An edit inside a fence equals a fresh run, and closing the fence restores Markdown tags.
- A theme test asserts that `defaultTokenColors` covers every `standardTags` member and every `json-*` tag.

### 9.3 Canvas-native perf

- New page `examples/languages/index.html?lang=<id>&lines=<n>&autoload=0`, added to the `vite.config.ts` inputs.
  - It builds the document by repeating `test/fixtures/languages/<id>.*`, imported as `?raw`, up to `n` lines.
  - It calls `loadLanguage(id)` and creates the editor.
  - It installs `examples/json-10k/perf-hook.ts`.
  - It exposes `window.__emakiLang = { loadMs, linesTokenizedAfterKey }` for informational metrics.
- `scripts/perf.mjs` options:
  - `--langs <ids>`, default `typescript,python,rust,c,markdown,html,css,yaml`
  - `--suite json|langs|all`, default `all`
  - `--dist <dir>`, default `dist`. The `distReady` check applies only to the suites that are run.
- For each language at 10k lines, on both browsers, the existing gate functions and budgets apply: `firstPaintMs` ≤ 200, `scrollWorkP95` ≤ 16.7, `keyWorkP95` ≤ 16.7 and `nextFrameRatio` ≥ 0.95. Gates are named `<metric>@<id>`.
- These are recorded informationally, not gated:
  - cold `loadLanguage` ms
  - `linesTokenized` delta and ms in the first frame after each key
  - tokenize ms for a single 100k-character line of each language
- The existing JSON and diff gates are unchanged.
- No `scripts/perf/` directory is created. Fixtures live in `test/fixtures/languages/`.

### 9.4 Bundle size

- New `scripts/bundle-size.mjs` uses the Vite lib build API with `write: false`, minify, es2022 and `@codemirror/*` external. It reports raw and gzip bytes for `.`, `./engine`, `./json`, `./languages` and every `./languages/<id>` including static embeds. `--out <file>` writes JSON.
- Run it first, before any `src/` change, to record the HEAD 1de212f baseline, then run it again after the change.
- The gate is in section 3.3 (c) and (d). Results go to table 10.4.

### 9.5 Tree-sitter comparison (evidence only, not shipped)

- **Comparison set:** typescript, python, rust and html. html exercises `<script>`/`<style>` injection.
- **Same fixtures.** Both approaches use the same `test/fixtures/languages/*` repeated to 10k lines.
- **Spike location.** The spike lives in a scratch directory outside the repo, `$TMPDIR/emaki-ts-spike/`. Its own `package.json` pins `web-tree-sitter` and the grammar packages that ship prebuilt `.wasm` files and highlight queries for the comparison set. Nothing is added to emaki's `package.json`.
- **Provider.** The spike implements a `SpanLanguage` against emaki's public contract:
  - It loads the runtime and grammar asynchronously.
  - It returns `truncated: true` until the tree for the current document exists, so `visibleComplete` and `firstPaintMs` include the parse.
  - On `noteChanges`, it calls `tree.edit` and re-parses incrementally, then calls the `setInvalidate` callback.
  - `spans` runs highlight-query captures for the range and maps them to `standardTags`.
  - html uses the grammar's injection query to parse script and style ranges with the javascript and css parsers.
- **Page.** The spike page has the same URL contract as `examples/languages`, installs the same `perf-hook.ts`, and is built by Vite into `$TMPDIR/emaki-ts-spike/dist/languages/`.
- **Measurement.** Run with the same harness, budgets and metric definitions:
  - `node scripts/perf.mjs --suite langs --dist $TMPDIR/emaki-ts-spike/dist --langs typescript,python,rust,html --out perf-results/treesitter-<ts>`
  - The canvas-native run uses the same `--langs` and `--out perf-results/canvas-<ts>`.
- **Sizes.** Gzip sizes of the runtime JS, the runtime wasm and each grammar wasm, measured on the built spike assets. Package metadata such as `unpackedSize` is not accepted.
- **Re-highlight cost.** Measured by the same informational hooks: the provider records re-parse plus query ms per key, and the canvas side records `linesTokenized` and ms.
- **Logs.** Every browser run is in the foreground, keeps its complete log file and exit status, and leaves `summary.json`/`env.json` in its `perf-results/` directory.
- **Unavailable comparison.** If the spike cannot be installed or run, the comparison is **incomplete**. Section 3.3 then keeps the decision provisional, and the approach-decision acceptance signal is reported blocked. No fallback value substitutes for a measurement.

### 9.6 Commands

`npm run check`, `npm test`, `npm run build`, `npm run perf` (Chromium and WebKit) and `npm run e2e` must all pass. Run them in the foreground and record the exit code and complete log path.

## 10. Evidence (filled during implementation)

All sizes below are bytes gzip from built assets. Browser values are milliseconds unless otherwise stated; p95 uses nearest rank. Raw data and environment: `perf-results/syntax-p12/`.

### 10.1 Size and cold load

Runtime: canvas modules include their common tokenizer code; tree-sitter runtime JS 19331 plus runtime wasm 81307 bytes gzip. Query text is included in the spike page JS.

| Language | Canvas module gzip | Tree-sitter grammar wasm gzip | Canvas cold load Chromium / WebKit p95 ms | Tree-sitter cold load Chromium / WebKit p95 ms |
|---|---:|---:|---|---|
| typescript | 2623 | 213554 | 5.70 / 9.00 | 58.10 / 72.00 |
| python | 1983 | 70888 | 2.80 / 7.00 | 29.90 / 36.00 |
| rust | 2529 | 100734 | 3.70 / 7.00 | 39.60 / 70.00 |
| html | 3131 | 6568 | 5.80 / 8.00 | 37.70 / 45.00 |

HTML injection adds JavaScript 79004 and CSS 17287 bytes gzip of grammar wasm.

### 10.2 Editor budgets at 10k lines

Values are first paint / scroll p95 / key p95 / next-frame ratio, followed by each gate result in that order. Budgets are 200 ms / 16.7 ms / 16.7 ms / 0.95 minimum.

| Approach | Browser | Language | Values | Gates |
|---|---|---|---|---|
| canvas-native | chromium | typescript | 74.00 / 8.10 / 7.10 / 1.00 | pass / pass / pass / pass |
| canvas-native | chromium | python | 62.10 / 6.80 / 6.50 / 1.00 | pass / pass / pass / pass |
| canvas-native | chromium | rust | 67.80 / 7.40 / 7.40 / 1.00 | pass / pass / pass / pass |
| canvas-native | chromium | html | 68.20 / 2.10 / 7.60 / 1.00 | pass / pass / pass / pass |
| canvas-native | webkit | typescript | 76.00 / 8.00 / 7.00 / 1.00 | pass / pass / pass / pass |
| canvas-native | webkit | python | 63.00 / 3.00 / 8.00 / 1.00 | pass / pass / pass / pass |
| canvas-native | webkit | rust | 74.00 / 7.00 / 8.00 / 1.00 | pass / pass / pass / pass |
| canvas-native | webkit | html | 77.00 / 7.00 / 6.00 / 1.00 | pass / pass / pass / pass |
| tree-sitter | chromium | typescript | 127.50 / 7.00 / 13.30 / 1.00 | pass / pass / pass / pass |
| tree-sitter | chromium | python | 85.40 / 7.60 / 14.00 / 1.00 | pass / pass / pass / pass |
| tree-sitter | chromium | rust | 110.50 / 7.10 / 9.40 / 1.00 | pass / pass / pass / pass |
| tree-sitter | chromium | html | 104.10 / 7.70 / 25.70 / 1.00 | pass / pass / fail / pass |
| tree-sitter | webkit | typescript | 99.00 / 5.00 / 14.00 / 1.00 | pass / pass / pass / pass |
| tree-sitter | webkit | python | 73.00 / 5.00 / 17.00 / 1.00 | pass / pass / fail / pass |
| tree-sitter | webkit | rust | 121.00 / 7.00 / 12.00 / 1.00 | pass / pass / pass / pass |
| tree-sitter | webkit | html | 104.00 / 8.00 / 33.00 / 1.00 | pass / pass / fail / pass |

### 10.3 Incremental re-highlight after a key

Canvas values are p95 milliseconds / lines tokenized; tree-sitter values are p95 parse plus capture-query milliseconds.

| Browser | Language | Canvas ms / lines | Tree-sitter ms |
|---|---|---|---|
| chromium | typescript | 0.10 / 1.00 | 8.40 |
| chromium | python | 0.10 / 1.00 | 10.80 |
| chromium | rust | 0.10 / 1.00 | 4.00 |
| chromium | html | 0.10 / 1.00 | 21.60 |
| webkit | typescript | 0.00 / 1.00 | 8.00 |
| webkit | python | 0.00 / 1.00 | 13.00 |
| webkit | rust | 0.00 / 1.00 | 5.00 |
| webkit | html | 0.00 / 1.00 | 30.00 |

### 10.4 Bundle size

Raw / gzip bytes. New entries have no baseline; the core delta is zero. Registry size excludes lazy chunks.

| Entry | Baseline raw / gzip | After raw / gzip | Gzip delta |
|---|---|---|---|
| `.` | 160599 / 42528 | 160599 / 42528 | 0 |
| `./engine` | 158740 / 42723 | 158740 / 42723 | 0 |
| `./json` | 2853 / 1387 | 2853 / 1387 | 0 |
| `./diff` | 3011 / 1269 | 3011 / 1269 | 0 |
| `./languages` | not present | 15239 / 4085 | new entry |
| `./languages/actionscript` | not present | 6012 / 2403 | new entry |
| `./languages/applescript` | not present | 4362 / 1842 | new entry |
| `./languages/asp` | not present | 10447 / 3401 | new entry |
| `./languages/bash` | not present | 5415 / 2216 | new entry |
| `./languages/batch` | not present | 5505 / 2247 | new entry |
| `./languages/bibtex` | not present | 4315 / 1829 | new entry |
| `./languages/c` | not present | 6151 / 2456 | new entry |
| `./languages/clojure` | not present | 5261 / 2147 | new entry |
| `./languages/cpp` | not present | 6583 / 2600 | new entry |
| `./languages/csharp` | not present | 6646 / 2518 | new entry |
| `./languages/css` | not present | 4897 / 1975 | new entry |
| `./languages/d` | not present | 6432 / 2482 | new entry |
| `./languages/diff` | not present | 4096 / 1753 | new entry |
| `./languages/dockerfile` | not present | 5893 / 2384 | new entry |
| `./languages/dot` | not present | 6009 / 2396 | new entry |
| `./languages/erb` | not present | 11135 / 3534 | new entry |
| `./languages/erlang-html` | not present | 10978 / 3480 | new entry |
| `./languages/erlang` | not present | 4598 / 1905 | new entry |
| `./languages/fish` | not present | 5414 / 2217 | new entry |
| `./languages/go` | not present | 6323 / 2481 | new entry |
| `./languages/graphql` | not present | 6296 / 2473 | new entry |
| `./languages/groovy` | not present | 6608 / 2525 | new entry |
| `./languages/haml` | not present | 4189 / 1787 | new entry |
| `./languages/haskell` | not present | 4875 / 1939 | new entry |
| `./languages/hcl` | not present | 6869 / 2606 | new entry |
| `./languages/html` | not present | 9397 / 3131 | new entry |
| `./languages/ini` | not present | 4683 / 1975 | new entry |
| `./languages/java` | not present | 6314 / 2487 | new entry |
| `./languages/javascript` | not present | 7158 / 2601 | new entry |
| `./languages/json` | not present | 1373 / 707 | new entry |
| `./languages/jsp` | not present | 12787 / 4059 | new entry |
| `./languages/jsx` | not present | 7221 / 2622 | new entry |
| `./languages/kotlin` | not present | 6835 / 2562 | new entry |
| `./languages/latex` | not present | 4353 / 1842 | new entry |
| `./languages/lisp` | not present | 5116 / 2103 | new entry |
| `./languages/lua` | not present | 4904 / 1890 | new entry |
| `./languages/makefile` | not present | 4309 / 1844 | new entry |
| `./languages/markdown` | not present | 4960 / 2057 | new entry |
| `./languages/matlab` | not present | 4552 / 1901 | new entry |
| `./languages/nix` | not present | 5216 / 1974 | new entry |
| `./languages/objc` | not present | 6297 / 2466 | new entry |
| `./languages/objcpp` | not present | 6407 / 2509 | new entry |
| `./languages/ocaml` | not present | 4740 / 1897 | new entry |
| `./languages/pascal` | not present | 6594 / 2539 | new entry |
| `./languages/perl` | not present | 4522 / 1891 | new entry |
| `./languages/php` | not present | 12758 / 4055 | new entry |
| `./languages/plaintext` | not present | 227 / 171 | new entry |
| `./languages/properties` | not present | 4919 / 2049 | new entry |
| `./languages/protobuf` | not present | 6106 / 2454 | new entry |
| `./languages/python` | not present | 4840 / 1983 | new entry |
| `./languages/r` | not present | 4242 / 1816 | new entry |
| `./languages/rd` | not present | 4071 / 1746 | new entry |
| `./languages/regexp` | not present | 4217 / 1801 | new entry |
| `./languages/restructuredtext` | not present | 4353 / 1827 | new entry |
| `./languages/ruby` | not present | 4756 / 1982 | new entry |
| `./languages/rust` | not present | 6465 / 2529 | new entry |
| `./languages/scala` | not present | 6810 / 2553 | new entry |
| `./languages/sql` | not present | 4407 / 1878 | new entry |
| `./languages/svelte` | not present | 9900 / 3262 | new entry |
| `./languages/swift` | not present | 6258 / 2453 | new entry |
| `./languages/tcl-html` | not present | 10550 / 3419 | new entry |
| `./languages/tcl` | not present | 4213 / 1822 | new entry |
| `./languages/tex` | not present | 4114 / 1762 | new entry |
| `./languages/textile` | not present | 4185 / 1784 | new entry |
| `./languages/toml` | not present | 5210 / 2113 | new entry |
| `./languages/tsx` | not present | 7221 / 2624 | new entry |
| `./languages/typescript` | not present | 7242 / 2623 | new entry |
| `./languages/vue` | not present | 9781 / 3241 | new entry |
| `./languages/xml` | not present | 5064 / 2108 | new entry |
| `./languages/yaml` | not present | 4727 / 1987 | new entry |
| `./languages/zig` | not present | 6057 / 2410 | new entry |

All 71 language entries meet their 6 KiB limits (12 KiB for embedding hosts); the registry is 4085 bytes gzip and the core delta is 0 bytes.

### 10.5 Embedding, licensing and maintenance

- Canvas embedding: `npx vitest run test/language/embedded.test.ts` passed 3 tests; composite string state uses the existing checkpoints. Tree-sitter uses the HTML injection query and JavaScript/CSS parsers over included ranges. The HTML rows above measure that spike implementation.
- Emaki grammars are original MIT work. References and comparison-only MIT-compatible packages are listed in `THIRD_PARTY_NOTICES.md`; none of the spike packages is shipped.
- Canvas maintenance: per-file line counts and total from `wc -l` are below. Tree-sitter requires runtime/grammar ABI pinning, wasm assets, highlight queries, and injection handling.

```
      88 src/language/grammar.ts
      20 src/language/families/c-like.ts
       5 src/language/families/ini-like.ts
      10 src/language/families/lisp-like.ts
       8 src/language/families/markup-like.ts
      11 src/language/families/shell-like.ts
       4 src/language/langs/actionscript.ts
       4 src/language/langs/applescript.ts
       8 src/language/langs/asp.ts
       3 src/language/langs/bash.ts
       5 src/language/langs/batch.ts
       5 src/language/langs/bibtex.ts
       4 src/language/langs/c.ts
       4 src/language/langs/clojure.ts
       4 src/language/langs/cpp.ts
       4 src/language/langs/csharp.ts
      30 src/language/langs/css.ts
       4 src/language/langs/d.ts
       2 src/language/langs/diff.ts
       8 src/language/langs/dockerfile.ts
       8 src/language/langs/dot.ts
       4 src/language/langs/erb.ts
       4 src/language/langs/erlang-html.ts
      10 src/language/langs/erlang.ts
       5 src/language/langs/fish.ts
       4 src/language/langs/go.ts
      10 src/language/langs/graphql.ts
       8 src/language/langs/groovy.ts
       2 src/language/langs/haml.ts
      12 src/language/langs/haskell.ts
       8 src/language/langs/hcl.ts
       5 src/language/langs/html.ts
       4 src/language/langs/ini.ts
      10 src/language/langs/java.ts
      35 src/language/langs/javascript.ts
       1 src/language/langs/json.ts
       6 src/language/langs/jsp.ts
       4 src/language/langs/jsx.ts
       9 src/language/langs/kotlin.ts
       5 src/language/langs/latex.ts
       4 src/language/langs/lisp.ts
       5 src/language/langs/lua.ts
       4 src/language/langs/makefile.ts
      15 src/language/langs/markdown.ts
      10 src/language/langs/matlab.ts
      14 src/language/langs/nix.ts
       4 src/language/langs/objc.ts
       4 src/language/langs/objcpp.ts
      11 src/language/langs/ocaml.ts
       4 src/language/langs/pascal.ts
       6 src/language/langs/perl.ts
       8 src/language/langs/php.ts
       2 src/language/langs/plaintext.ts
       4 src/language/langs/properties.ts
       9 src/language/langs/protobuf.ts
      11 src/language/langs/python.ts
       4 src/language/langs/r.ts
       2 src/language/langs/rd.ts
       4 src/language/langs/regexp.ts
       6 src/language/langs/restructuredtext.ts
       8 src/language/langs/ruby.ts
       4 src/language/langs/rust.ts
       8 src/language/langs/scala.ts
       4 src/language/langs/sql.ts
      12 src/language/langs/svelte.ts
       4 src/language/langs/swift.ts
       4 src/language/langs/tcl-html.ts
       4 src/language/langs/tcl.ts
       7 src/language/langs/tex.ts
       5 src/language/langs/textile.ts
       4 src/language/langs/toml.ts
       4 src/language/langs/tsx.ts
       4 src/language/langs/typescript.ts
      11 src/language/langs/vue.ts
      10 src/language/langs/xml.ts
       8 src/language/langs/yaml.ts
       4 src/language/langs/zig.ts
      12 src/language/templates/html-template.ts
     633 total
```

### 10.6 Decision rationale

Confirmed under §3.3: both approaches have measured rows in §§10.1–10.3; canvas passes all four comparison-language browser gates; the per-language and core bundle limits pass. The tree-sitter runtime and grammar wasm in §10.1 are substantially larger, and its parsing and query costs in §§10.2–10.3 add integration and injection maintenance described in §10.5. The canvas-native choice avoids shipped wasm and asynchronous initialization while meeting the measured gates.

## 11. Rollout and compatibility

- Additive only:
  - The `createEditor` `language` option is unchanged.
  - `jsonLanguage` and the `json-*` tags are unchanged.
  - The `.`, `./engine`, `./diff` and `./json` exports are unchanged.
- README gains a Languages section covering:
  - the language table (from section 7 C/A rows and section 8)
  - `resolveLanguage`/`loadLanguage` examples
  - lazy loading and code splitting
  - the `embedded` option
  - `standardTags`/`defaultTokenColors` and theme overrides
- Add `THIRD_PARTY_NOTICES.md` at the repository root and include it in the package `files`.
- One local commit in the numbered 1–6 message style. No push.
