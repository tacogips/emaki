# P09 `syntax-p09-registry-integration`: registry, selection API, exports, integration tests

- **Wave:** 4
- **dependsOn:** P02, P03, P04, P05, P06, P07, P08
- **Design:** §4.1, §4.2, §7 (A rows), §9.1, §9.2
- **writePaths:**
  - `src/language/registry.ts`
  - `test/language/registry.test.ts`
  - `test/language/languages.test.ts`
  - `test/language/embedded.test.ts`
  - `test/language/long-line.test.ts`
  - `impl-plans/progress/syntax-p09-registry-integration.md`
- **sharedPaths:** `package.json`

**`package.json` edit:** add only the two `exports` entries and `"THIRD_PARTY_NOTICES.md"` to `files`. No dependency or script changes.

## Intent

Publish `emaki/languages` and `emaki/languages/*`. Resolve languages by name, extension, filename and fence info. Lazy-load modules. Prove the coverage of every chilla row and the embedding.

## Non-goals

- No runtime language swap.
- No change to `src/index.ts`, `src/engine.ts` or `src/language/index.ts`: the registry must not be reachable from `.` or `./engine`.
- No edits to `langs/*`. If a language fails its integration test, record a blocker naming the owning plan.

## `src/language/registry.ts`

Exports, exactly as in design §4.2:

- `LanguageInfo`
- `languages`
- `resolveLanguage`
- `loadLanguage`
- a re-export of `standardTags`, `defaultTokenColors` and the `StandardTag` type from `./tags`

**Import pitfalls:**

- Import `./tags` statically; it is small.
- Import `../types` as a type-only import.
- **Never** statically import `./langs/*`, `./grammar` or `./families/*`.
- The loader table is `const loaders: Record<string, () => Promise<Record<string, unknown>>> = { c: () => import('./langs/c'), … }` with **literal** specifiers so Vite code-splits.
- The language export is picked by the camelId convention: `${camel(id)}Language`. Throw a descriptive `Error` if it is missing.

**Metadata table.**

- One `LanguageInfo` per module id: 71 entries, the same 71 counted in `languages.test.ts` (69 grammar modules plus `json` and `plaintext`).
- Alias rows of design §7 (status A) and the shell aliases are **entries in the target's `aliases`/`extensions`/`filenames`**, not separate infos.
- Required content. Extensions are listed without dots; `F:` marks exact filenames:

| id | aliases | extensions / filenames |
|---|---|---|
| plaintext | text, txt | txt |
| json | jsonc | json, jsonc |
| c | | c, h |
| cpp | c++ | cpp, cc, cxx, hpp, hh, hxx, ipp, inl |
| csharp | c#, cs | cs, csx |
| objc | objective-c | m |
| objcpp | objective-c++ | mm |
| d | | d, di |
| go | golang | go |
| rust | rs | rs |
| zig | | zig |
| swift | | swift |
| pascal | delphi | pas, dpr |
| actionscript | as | as |
| java | | java, bsh |
| groovy | gradle | groovy, gvy, gradle |
| scala | | scala, sbt |
| kotlin | kt | kt, kts |
| protobuf | proto, protocol-buffers | proto |
| graphql | gql | graphql, gql |
| dot | graphviz | dot, gv |
| properties | java-properties | properties |
| ini | | ini, cfg |
| toml | | toml; F: Cargo.lock |
| hcl | terraform, tf | hcl, tf, tfvars |
| javascript | js | js, mjs, cjs, htc |
| typescript | ts | ts, mts, cts, d.ts |
| tsx | | tsx |
| jsx | | jsx |
| css | | css |
| html | htm, xhtml | html, htm, shtml, xhtml |
| xml | nant, xsd, svg | xml, xsd, xslt, svg, rss, build |
| vue | | vue |
| svelte | | svelte |
| python | py | py, pyw, pyi; F: SConstruct |
| ruby | rb, rails | rb, rake, gemspec, rxml, builder; F: Gemfile, Rakefile |
| perl | pl | pl, pm, pod, t |
| lua | | lua |
| r | | r, rprofile |
| tcl | | tcl |
| bash | sh, shell, zsh, ksh, shell-unix-generic | sh, bash, zsh, ksh; F: .bashrc, .zshrc, .profile, .bash_profile |
| fish | | fish |
| batch | bat, cmd | bat, cmd |
| applescript | | applescript |
| makefile | make | mk, mak; F: Makefile, makefile, GNUmakefile |
| dockerfile | docker | dockerfile; F: Dockerfile |
| sql | sql-erb | sql, ddl, dml, sql.erb, erbsql |
| regexp | regex | re |
| haskell | hs, lhs | hs, lhs |
| ocaml | ml, ocamllex, ocamlyacc, camlp4 | ml, mli, mll, mly |
| erlang | erl | erl, hrl; F: Emakefile |
| clojure | clj | clj, cljs, cljc, edn |
| lisp | elisp, common-lisp | lisp, cl, el, lsp |
| nix | | nix |
| matlab | | matlab |
| markdown | md, multimarkdown | md, markdown, mdown, mmd |
| restructuredtext | rst | rst, rest |
| textile | | textile |
| latex | | tex, ltx |
| tex | | sty, cls |
| bibtex | bib | bib |
| rd | | rd |
| diff | patch | diff, patch |
| yaml | yml | yaml, yml |
| haml | | haml |
| php | | php, php3, php4, php5, phtml |
| asp | | asp, asa |
| jsp | | jsp |
| erb | rhtml, html-erb | erb, rhtml, html.erb |
| erlang-html | yaws | yaws |
| tcl-html | adp | adp |
| (javascript, same entry as above; additional aliases) | js-erb | js.erb |

**Conflicts:**

- `.m` → objc. matlab is reachable only by name or `.matlab`.
- `.h` → c.
- `.tex` → latex.

**`resolveLanguage(query)`:**

- Implements design §4.2 exactly:
  - Case-insensitive throughout.
  - Precedence: `fenceInfo`, then `name`, then `filename`, then `extension`.
  - `filename`: exact basename first. Otherwise try the dotted suffixes from longest to shortest (`a.html.erb` → `html.erb` before `erb`; `x.d.ts` → `d.ts`).
  - `extension`: an optional leading dot is stripped. Multi-dot keys such as `d.ts` are allowed.
  - Fence normalization: trim, take the first whitespace-delimited word, strip `{.`/`{` and `}`, cut at the first `,`, then match as a name, then as an extension.
- Pitfall: `filename` may include a directory path. Take the basename after the last `/` or `\`.
- An empty or unknown query returns `undefined`.

**`loadLanguage(idOrInfo, opts)`:**

- Resolve a string through `name`, so aliases work. Unknown → `Promise.reject(new Error('unknown language: …'))`.
- Cache key: `${id}|${embeddedKey}`, where `embeddedKey` is the sorted, de-duplicated resolved ids, or `all`. On rejection, delete the cache entry.
- **For `markdown` with `opts.embedded`:**
  - Resolve each entry with `resolveLanguage({ fenceInfo })` and load those modules. `'all'` loads every id except markdown.
  - Then import the markdown module and call `createMarkdownLanguage(info => { const r = resolveLanguage({ fenceInfo: info }); return r ? loaded.get(r.id) : undefined; })`.
  - Without `embedded`, return `markdownLanguage`.
- For other ids, `opts.embedded` is ignored.

## `package.json`

```
"./languages": "./src/language/registry.ts",
"./languages/*": "./src/language/langs/*.ts"
```

- Add these after `./json`. The existing four entries stay byte-identical.
- Add `THIRD_PARTY_NOTICES.md` to `files`. P12 creates the file; `npm pack` is not run before then.

## Tests

### `registry.test.ts`

| Input | Expected |
|---|---|
| `{name:'TS'}` | typescript |
| `{name:'zsh'}` | bash |
| `{name:'nant'}` | xml |
| `{name:'lhs'}` | haskell |
| `{name:'camlp4'}` | ocaml |
| `{name:'multimarkdown'}` | markdown |
| `{name:'rails'}` | ruby |
| `{extension:'.RS'}` | rust |
| `{extension:'rs'}` | rust |
| `{filename:'Dockerfile'}` | dockerfile |
| `{filename:'src/x.html.erb'}` | erb |
| `{filename:'a.js.erb'}` | javascript |
| `{filename:'q.sql.erb'}` | sql |
| `{filename:'x.d.ts'}` | typescript |
| `{filename:'Makefile'}` | makefile |
| `{filename:'p.build'}` | xml |
| `{fenceInfo:'ts'}` | typescript |
| `{fenceInfo:' rust ignore'}` | rust |
| `{fenceInfo:'{.python}'}` | python |
| `{fenceInfo:'js,linenos'}` | javascript |
| `{fenceInfo:'yml'}` | yaml |
| `{fenceInfo:'nope'}` | `undefined` |
| `{}` | `undefined` |
| `{extension:'m'}` | objc |

- **Every alias row of design §7** has one assertion. The list is rows 5, 7, 22, 25, 29, 39, 42, 43, 44, 47, 57, 59, 60, 69, 70, mapped to their targets (rows 25, 29, 47 and 70 map to java, javascript, php and bash).
- `loadLanguage('rust')` called twice returns the same promise and resolves to an object with `name === 'rust'`.
- `loadLanguage('nope')` rejects.
- `loadLanguage('nope')` called twice rejects both times with distinct promise objects (`!==`), which shows a rejection is not cached.

### `languages.test.ts` (`// @vitest-environment node`)

- Import all seven `*Expectations` arrays and `nantExpectation`.
- For each `languages` entry other than `plaintext`:
  - Assert that exactly one expectation has its id. **Fail with a listing of the missing ids.**
  - `await loadLanguage(id)`, then `checkFixture(lang, await readFixture(`${id}.${ext}`), exp)`.
- Assert `languages.length === 71`: 69 grammar modules (63 chilla C rows other than json, plus 6 additions), plus json and plaintext.
- Plaintext: tokens are empty for any line.
- The nant expectation is checked against `(await loadLanguage('nant'))`.

### `embedded.test.ts`

- `loadLanguage('markdown', { embedded: ['ts', 'python'] })`:
  - A ```` ```ts ```` fence body has `interface` → `keyword`.
  - A ```` ```rust ```` fence (not loaded) body → `string`.
  - After the closing fence, `# x` → `heading`.
- `loadLanguage('markdown', { embedded: 'all' })` with a ```` ```rust ```` fence → `fn` is `keyword`.
- html: `<script>` with `const` inside → `keyword`. `<style>` with `color` inside → `property`.
- vue: `<script lang="ts">` with `unknown` → `type`. `{{ a + 1 }}` → `1` is `number`.
- svelte: `{a + 1}` → `number`.
- php: `<?php $x ?>` → `variable`.
- Incremental: a markdown doc with a loaded fence. Edit inside the fence (insert `1` into the body) → `IncrementalHighlighter` tokens after `applyChanges` equal a fresh `tokenizeDoc` of the new text **and** the body tag is still the inner tag.
- Closing fence deleted, then re-added → the tags after it are restored to markdown.

### `long-line.test.ts` (design §9.1 a–d, with `A = 'a'.repeat(4097)`)

- (a) c: `/*${A}*/` then `int answer = 42;` → line 2 has `int` = `keyword` and `42` = `number`.
- (b) c: `${A}/*` then `int x;` → line 2 is entirely `comment`.
- (c) c: starting from (a), apply edits with `applyChanges`:
  - Insert `bb` right before `*/` (moving it to offset > 4099), then remove it again.
  - After each step, the incremental tokens equal a fresh tokenization, and line 2's tags equal (a).
- (d) html: `<script>${A}</script>` then `<p class="x">` → line 2 has `p` = `tag` and `class` = `attribute`.
- markdown: a fence body line of 5000 chars, then the closing fence, then `# h` → `heading`.

## Verification

```
npm run check > tmp/syntax-p09/check.log 2>&1; echo "exit=$?"     # 0
npx vitest run test/language > tmp/syntax-p09/lang.log 2>&1; echo "exit=$?"     # 0
npm test > tmp/syntax-p09/test.log 2>&1; echo "exit=$?"     # 0, full suite incl. boundary
grep -c "import('./langs/" src/language/registry.ts     # >= 71
grep -nE "^import .*langs/" src/language/registry.ts     # no output (no static lang imports)
git diff --exit-code -- src/index.ts src/engine.ts src/language/index.ts     # exit 0
```

## Done when

- All commands give the stated results.
- The progress log lists any language-specific failures with the owning plan id.
- **Serial integration gate.** `npm run check` and `npm test` (including `test/boundary.test.ts`) must exit 0 here.
  - If a failure is in a file owned by P02–P08 (or P00/P01), P09 must **not** edit that file. Record a blocker in the progress log naming the file, the diagnostic and the owning plan id, for serial repair by that plan.
  - P09 is done only after those repairs land and both commands exit 0.
