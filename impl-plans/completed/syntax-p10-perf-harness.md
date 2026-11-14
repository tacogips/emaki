# P10 `syntax-p10-perf-harness`: languages demo page and per-language perf gates

- **Wave:** 5
- **dependsOn:** P09
- **Design:** §9.3, §9.6, §3.3 (b)
- **writePaths:**
  - `examples/languages`
  - `impl-plans/progress/syntax-p10-perf-harness.md`
  - `dist` (artifact root)
  - `perf-results/syntax-p10` (artifact root)
  - `tmp/syntax-p10` (artifact root)
- **sharedPaths:**
  - `scripts/perf.mjs`: add the `--suite`, `--dist` and `--langs` options and the language suite. The JSON and diff suites are unchanged.
  - `vite.config.ts`: add the `examples/languages/index.html` input. Nothing else changes.

## Intent

Gate each representative language on the existing Chromium and WebKit budgets. Expose the same harness to P12's tree-sitter spike via `--dist`.

## Non-goals

- No change to the existing JSON or diff gate names, budgets or semantics.
- No change to `examples/json-10k/*`: import `perf-hook.ts` from there, do not copy it.
- No change to `scripts/e2e.mjs`, `scripts/smoke.mjs` or `scripts/route-server.mjs`.

## `examples/languages/`

**`index.html`**

- Clone the structure of `examples/json-10k/index.html`: same CSS link and `#editor`.
- Add a `<select id="lang">` that navigates to `?lang=`.

**`env.d.ts`**

- `/// <reference types="vite/client" />`.
- Needed because `tsconfig.json` has `types: []` and the page uses `import.meta.glob`.

**`main.ts`**

- Parse `?lang=` (default `typescript`) and `?lines=` (1000, 10000 or 100000; default 10000) and `?autoload`.
- Sample text:
  - `const samples = import.meta.glob('../../test/fixtures/languages/*', { query: '?raw', import: 'default' })` (lazy).
  - Pick the key whose basename before the first `.` equals the id.
  - Repeat the sample's lines until exactly `lines` lines exist.
- Language:
  - Time `const t0 = performance.now(); const lang = await loadLanguage(id); loadMs = performance.now() - t0`, importing from `../../src/language/registry`.
  - Wrap it as `{ ...lang, tokenizeLine(t, s) { const a = performance.now(); const r = lang.tokenizeLine(t, s); counters.calls++; counters.ms += performance.now() - a; return r; } }`, with `kind`, `name`, `startState` and `sameState` preserved.
- `createEditor(host, { language: wrapped, theme: { tokens: defaultTokenColors } })`, then `installPerfHook(handle, text)` from `../json-10k/perf-hook`.
- Informational contract, which P12's spike page reproduces exactly:

```ts
window.__emakiLang = { id, loadMs, resetCounters(): void, counters(): { calls: number; ms: number }, longLineMs(chars: number): number }
// longLineMs: builds one line of `chars` characters (the sample's first non-empty line, repeated and cut) and returns the ms to tokenize it once from startState
// (spike: parse it once); runs outside the editor and must not change the document
```

- `autoload !== '0'` → `hook.load()`.
- Pitfall: set `window.__emakiPerf` only after the language has loaded. `perf.mjs` waits for `__emakiPerf`, so loading must finish first.

## `scripts/perf.mjs`

**New options:**

- `--suite json|langs|all`, default `all`.
  - `json` runs the current JSON loop and the diff block.
  - `langs` runs only the language loop.
- `--dist <dir>`, default `dist`.
  - Replace the hard-coded `'dist'` in `routeDist(context, …)` and in the `distReady` checks.
  - `distReady` checks only the pages of the selected suites: `json-10k`/`diff` for `json`, `languages` for `langs`.
- `--langs <csv>`, default `typescript,python,rust,c,markdown,html,css,yaml`.

**Language loop** (inside the per-browser block, after the existing work when the suite includes `langs`). For each id:

- **First paint.** `loads` cold page loads of `${ORIGIN}/languages/index.html?lang=<id>&lines=10000&autoload=0`, wait for `__emakiPerf`, call `load()`. Gate `firstPaintMs@<id>`: the max over loads ≤ 200. Also write `{ metric: 'loadMs', value }` from `__emakiLang.loadMs`.
- **Scroll.** The same 300-step wheel/scrollBy sequence as the JSON block. Gate `scrollWorkP95@<id>` ≤ 16.7.
- **Keys.**
  - The same `keys` caret-and-type sequence, with seeded `random(7)`.
  - Before each key, call `__emakiLang.resetCounters()`. After the frames, write `{ metric: 'rehighlight', calls, ms }`.
  - Gates `keyWorkP95@<id>` ≤ 16.7 and `nextFrameRatio@<id>` ≥ 0.95, with the same missing-sample rules as the JSON block.
- **Long line (informational).** `page.evaluate(() => window.__emakiLang.longLineMs(100000))`, then write `{ metric: 'longLineMs', value }`.
- Raw output goes to `raw-lang-<browser>-<id>.jsonl`. Reuse the existing `p95`, `gate` and `write` helpers. Extract a local helper function for the shared scroll/key measurement **only if** both the JSON and language loops call it and the JSON output stays byte-compatible in shape. Otherwise duplicate the minimal code.
- The summary, exit codes and `--self-test` keep their current behavior.
- Pitfalls:
  - The scroll-path detection (`wheel` vs `scrollBy`) applies per page.
  - `env.distSha256` hashes `dist/json-10k/index.html`. Under `--suite langs`, hash `<dist>/languages/index.html` instead.

## `vite.config.ts`

Append `new URL('./examples/languages/index.html', import.meta.url).pathname` to `rollupOptions.input`.

## Tests (`input -> expected`)

- `node scripts/perf.mjs --self-test` → exit 0.
- `node scripts/perf.mjs --suite bogus` → exit 2.
- `npm run build` → `dist/languages/index.html` exists, and the language chunks are emitted as separate files (`ls dist/assets | wc -l` is greater than before).
- A run with `--suite langs --langs typescript --browser chromium --loads 1 --keys 20` → `summary.json` has the 4 `@typescript` gates.

## Verification (foreground; record exit codes, log paths and the full `summary.json` content in the progress log)

```
npm run check > tmp/syntax-p10/check.log 2>&1; echo "exit=$?"     # 0
npm run build > tmp/syntax-p10/build.log 2>&1; echo "exit=$?"     # 0
node scripts/perf.mjs --self-test > tmp/syntax-p10/selftest.log 2>&1; echo "exit=$?"     # 0
npm run perf -- --out perf-results/syntax-p10/full > tmp/syntax-p10/perf.log 2>&1; echo "exit=$?"     # 0: all JSON, diff and @<lang> gates pass on chromium and webkit
npm run e2e > tmp/syntax-p10/e2e.log 2>&1; echo "exit=$?"     # 0
npx vitest run test/boundary.test.ts > tmp/syntax-p10/boundary.log 2>&1; echo "exit=$?"     # 0
```

**If a `@<id>` gate fails:**

- Record the gate, value and budget.
- Do not edit `langs/*` or relax budgets.
- Mark it as a blocker for the owning language plan (serial repair), per design §3.3.

## Done when

- The page builds.
- `perf-results/syntax-p10/full/summary.json` has `allPass: true` (or, if the run was sliced, every `perf-results/syntax-p10/<slice>/summary.json` does), and the contents are copied into the progress log.

## Foreground time limit

If the executor's foreground command limit is shorter than the full run, split the run into sequential foreground slices that together cover the full matrix. All slices must exit 0. Record each slice's exit code and log path:

- `--browser chromium|webkit`
- `--suite json` or `--suite langs --langs <subset>`
- `--out perf-results/syntax-p10/<slice>`

Never background the run, and never reduce `--loads` or `--keys` below the defaults for gating runs.

## Artifact strategy

`dist` (the Vite build output), `perf-results/syntax-p10` (raw jsonl) and `tmp/syntax-p10` (logs) are generated outputs. They are declared as `artifactRoots` and are not source. Evidence is copied into the progress log.
- The e2e and boundary runs exit 0.
