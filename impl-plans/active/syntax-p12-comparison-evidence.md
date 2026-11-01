# P12 `syntax-p12-comparison-evidence`: tree-sitter comparison spike, bundle "after", evidence and notices

- **Wave:** 6
- **dependsOn:**
  - P00 (bundle script and baseline)
  - P10 (perf harness with `--dist`)
- **Design:** §3.3, §9.4, §9.5, §10.1–10.6
- **writePaths:**
  - `THIRD_PARTY_NOTICES.md`
  - `impl-plans/progress/syntax-p12-comparison-evidence.md`
  - `perf-results/syntax-p12` (artifact root)
  - `tmp/syntax-p12` (artifact root)
- **sharedPaths:**
  - `design-docs/specs/design-syntax-highlighting.md`: fill §10 only, and update the Status line and §3.1 heading to confirmed or provisional per §3.3.
  - `design-docs/user-qa/syntax-highlighting-qa.md`: append a hybrid proposal **only if** §3.3 reopens the decision.
- **artifactRoots:** `perf-results/syntax-p12` and `tmp/syntax-p12` (generated raw output and logs; evidence is copied into the progress log).
  - The spike lives **outside the repo** at `$TMPDIR/emaki-ts-spike/`, as the design requires.
  - It must stay outside: `test/boundary.test.ts` would reject its `web-tree-sitter` imports anywhere in the repo, including `tmp/`.
  - Its toolchain manifest is recorded in the progress log: package versions, install command, exit code, and the sha256 of every `.wasm` file.

## Intent

Produce the measured comparison required by the approach-decision acceptance signal, and record the evidence. Nothing from the spike ships.

## Non-goals

- No tree-sitter code, dependency or adapter in emaki.
- No edits to `src/`, `test/`, `scripts/` or `examples/`.
- If the harness needs a fix, record a blocker for P10.

## Steps

### 1. Spike setup

Run in `$TMPDIR/emaki-ts-spike`, in the foreground, logging to `tmp/syntax-p12/`:

- `npm init -y`.
- `npm install --save-exact web-tree-sitter@<pinned> vite@8.3.1` plus prebuilt grammar packages that ship `.wasm` files and `queries/highlights.scm` for typescript, python, rust, html, javascript and css.
  - Choose exact versions compatible with the `web-tree-sitter` ABI, and record them.
  - If a grammar package ships no `.wasm`, build it with `tree-sitter build --wasm`, using a pinned `tree-sitter-cli`, and record that.
- Network failure → stop. Write `blocked: install failed (<log path>)` into every tree-sitter cell of §10. Keep the decision **provisional**. Continue with steps 4–6.

### 2. Spike provider and page

Files live in the spike dir, never in the repo.

**`SpanLanguage` provider:**

- Load the runtime and grammar asynchronously.
- `spans()` returns `{ spans: [], truncated: true }` until the tree for the current doc exists.
- `noteChanges`: map the CodeMirror changes to `tree.edit` (`startIndex`/`oldEndIndex`/`newEndIndex` plus row/column points), re-parse with the old tree, record `{ calls: 1, ms }` in counters, then call the `setInvalidate` callback.
- `spans(state, from, to)` runs `query.captures(tree.rootNode, { startIndex: from, endIndex: to })` and maps capture names to `standardTags`:
  - `keyword` → keyword, `string*` → string, `comment` → comment, `number` → number, `function*` → function, `type*` → type, `variable*` → variable, `property` → property, `tag` → tag, `attribute` → attribute, `operator` → operator, `punctuation*` → punctuation, `constant*` → constant.
  - Anything else gets no token.
  - Sort the spans and drop overlaps, keeping the first.
- html: use the html grammar's injection handling. Parse `<script>`/`<style>` ranges with the javascript/css parsers via `parser.parse(text, undefined, { includedRanges })`, and merge the spans.

**Page:**

- It has the exact URL contract and `window.__emakiLang` contract of `examples/languages/main.ts`, and uses the same fixture repetition.
- Import emaki from the repo through Vite aliases: `/Users/taco/gits/tacogips/emaki/src/index.ts`, `examples/json-10k/perf-hook.ts`, and `test/fixtures/languages/<id>.*` as `?raw`, with `server.fs.allow` including the repo.
- `loadMs` = runtime init + grammar load.
- Build with `npx vite build`, giving `$TMPDIR/emaki-ts-spike/dist/languages/index.html`. `distReady` also needs `dist/index.html`, so add a trivial index page.

### 3. Measure both approaches

Use the same harness, in the foreground:

```
node scripts/perf.mjs --suite langs --langs typescript,python,rust,html --out perf-results/syntax-p12/canvas-cmp > tmp/syntax-p12/perf-canvas.log 2>&1; echo "exit=$?"
node scripts/perf.mjs --suite langs --dist "$TMPDIR/emaki-ts-spike/dist" --langs typescript,python,rust,html --out perf-results/syntax-p12/treesitter-cmp > tmp/syntax-p12/perf-ts.log 2>&1; echo "exit=$?"
```

If a run exceeds the executor's foreground limit, slice it into sequential foreground runs by `--browser` and `--langs` subset, with `--out perf-results/syntax-p12/<approach>-<slice>`. Use identical slices for both approaches, so the comparison stays like-for-like. Record each slice's exit code and log path.

The spike page must implement the full `window.__emakiLang` contract from P10, including `longLineMs`.

- The tree-sitter run may exit 1 on budget failures. That is evidence, not an error.
- Exit 2 (browser unavailable) means the comparison is blocked.

**Sizes:**

- tree-sitter: gzip of the runtime JS, `web-tree-sitter.wasm`, and each grammar `.wasm` in the spike `dist`, via `node -e` with `zlib.gzipSync`.
- canvas-native: `node scripts/bundle-size.mjs --entries all --out tmp/syntax-p12/after.json`.
- Package metadata is **not** acceptable as a size source.

### 4. Bundle "after"

- Compare `tmp/syntax-p12/after.json` with P00's baseline, as copied into P00's progress log.
- Gates:
  - `.` delta ≤ 0.25 KB gzip (expected 0).
  - Each `./languages/<id>` ≤ 6 KB gzip; embedding hosts (html, php, markdown, vue, svelte, asp, jsp, erb, erlang-html, tcl-html, dockerfile) ≤ 12 KB.
  - `./languages` registry ≤ 6 KB gzip, excluding lazy chunks.

### 5. Fill design §10

Edit only §10 and the Status/§3.1 wording.

- **10.1–10.3:** a measured value or `blocked: <reason>` in every cell, from the `summary.json` and raw jsonl files of both runs. The re-highlight p95 comes from the `rehighlight` metric.
- **10.4:** baseline, after and delta for every entry.
- **10.5:**
  - Embedding results from `test/language/embedded.test.ts`.
  - Licensing: the spike grammar licenses, read from each package's `LICENSE`/`package.json`.
  - Maintenance: `wc -l src/language/grammar.ts src/language/families/*.ts src/language/langs/*.ts src/language/templates/*.ts`, per file and total.
- **10.6:** apply §3.3 literally.
  - **Confirmed** only if (a)–(e) all hold.
  - Otherwise **provisional**, giving the failing condition. If (b) fails, or tree-sitter meets budgets that canvas-native misses, append the hybrid proposal to the user-QA file, referencing its existing item 1.

### 6. `THIRD_PARTY_NOTICES.md` (repository root)

- State that all emaki grammars are original MIT work and that no third-party grammar text is included.
- List the references consulted but not copied, with their licenses: the Sublime Text default packages (syntect defaults), and chilla's project-authored Swift and Nix grammars.
- List the spike-only packages (web-tree-sitter and the grammars) with versions and licenses, marked "comparison only, not distributed".
- Every listed license must be MIT-compatible. Any non-compatible one goes in a "not distributed, reference only" subsection.

## Verification

- `git diff --stat -- src test scripts examples package.json` shows no changes made by this plan. Compare the pre/post hashes of the files you did not own.
- `grep -c "blocked:\|TBD" design-docs/specs/design-syntax-highlighting.md` is reported in the progress log. `TBD` must be 0. `blocked:` is allowed only with a reason, and it forces the provisional status.
- Both perf commands have their exit codes and full log paths recorded.
- `npx vitest run test/boundary.test.ts` → exit 0. This proves no spike files leaked into the repo.

## Done when

- §10 has no `TBD`.
- Status is set per §3.3.
- `THIRD_PARTY_NOTICES.md` exists.
- The progress log contains the toolchain manifest, all exit codes and log paths, and the bundle-size JSONs.
