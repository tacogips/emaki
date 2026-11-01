# Design: multi-language syntax highlighting

**Status.** Accepted for implementation. The approach decision (section 3) is provisional until section 10 is complete. Section 3.3 decides between confirming and reopening it. Missing comparative measurements keep it provisional; they never confirm it.

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

### 3.1 Provisional decision: canvas-native

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

Each cell holds a measured value or `blocked: <reason>`. A `blocked` cell keeps section 3.3 provisional.

### 10.1 Size and cold load

Per approach, for runtime, typescript, python, rust and html:

| Column | canvas-native | tree-sitter |
|---|---|---|
| Asset size | gzip of the JS module | gzip of the wasm plus JS |
| Cold load (ms) | Chromium / WebKit | Chromium / WebKit |

### 10.2 Editor budgets at 10k lines

Per approach, per comparison-set language, on Chromium and WebKit: `firstPaintMs`, `scrollWorkP95`, `keyWorkP95` and `nextFrameRatio`, each with pass or fail against the budget.

### 10.3 Incremental re-highlight after a key

Per approach, per language, on Chromium and WebKit: p95 ms. The canvas-native row also records the `linesTokenized` p95.

### 10.4 Bundle size

| Entry | baseline raw/gzip | after raw/gzip | delta |
|---|---|---|---|
| `.` | | | |
| `./engine` | | | |
| `./json` | | | |
| `./languages` | | | |
| each `./languages/<id>` | | | |

### 10.5 Embedding, licensing and maintenance

- **Embedding.** Compare the canvas composite state with tree-sitter injection queries, using results from the section 9.2 tests and the html comparison row.
- **Licensing.** All emaki grammars are emaki-authored (MIT). No Sublime, TextMate, tree-sitter or chilla grammar text is copied. `THIRD_PARTY_NOTICES.md` records:
  - the references consulted but not copied (the Sublime default packages, chilla's Swift and Nix grammars)
  - the spike's grammar licenses, for comparison only, since they are not shipped
- **Maintenance.** Lines of code per canvas module and factory, compared with the tree-sitter upkeep items.

### 10.6 Decision rationale

Confirm or reopen per section 3.3, citing rows from 10.1 to 10.5.

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
