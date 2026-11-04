# P00 `syntax-p00-bundle-size`: bundle-size script and baseline

- **Wave:** 1
- **dependsOn:** none
- **Design:** §9.4, §3.3 (c) and (d), §10.4
- **writePaths:**
  - `scripts/bundle-size.mjs`
  - `impl-plans/progress/syntax-p00-bundle-size.md`
- **sharedPaths:** none

## Intent

Make "the core entry does not grow" measurable. Record the baseline from HEAD `1de212f`, independent of what other plans have changed in the working tree.

## Non-goals

- No change to `package.json` scripts; P09 owns `package.json`. Invoke the script as `node scripts/bundle-size.mjs`.
- No CI gate wiring.
- No "after" measurement; P12 does that.

## Changes: `scripts/bundle-size.mjs` (new)

**CLI:**

```
node scripts/bundle-size.mjs [--root <dir>] [--entries all|core] [--out <file.json>]
```

- `--root` defaults to the repo cwd.
- `core` means the existing four entries:

| Name | File |
|---|---|
| `.` | `src/index.ts` |
| `./engine` | `src/engine.ts` |
| `./json` | `src/language/json.ts` |
| `./diff` | `src/diff/index.ts` |

- `all` adds:
  - `./languages` → `src/language/registry.ts`
  - every `src/language/langs/*.ts` (as `./languages/<id>`)
  - entries whose file is missing are skipped and listed in `skipped`

**Build per entry:**

- Use the Vite JS API `build()` with:
  - `configFile: false`, `logLevel: 'silent'`, `root: <root>`
  - `build: { write: false, minify: true, target: 'es2022', lib: { entry, formats: ['es'], fileName: 'entry' }, rollupOptions: { external: [/^@codemirror\//] } }`
- Sum the `code` of the entry chunk **and all statically imported chunks**. Exclude dynamic-import-only chunks for `./languages`, so the registry is measured without the language modules. Report them separately as `lazyChunks`.
- Gzip with `node:zlib` `gzipSync` at the default level.

**Output JSON:**

```
{ root, gitHead|null, entries: { [name]: { file, raw, gzip, lazyChunks?: {raw,gzip}[] } }, skipped: [] }
```

Print it to stdout, and to `--out` if given.

**Pitfalls:**

- Boundary test: `scripts/*.mjs` may not import `vite` with a literal specifier. Use the `test/boundary.test.ts` idiom: `const spec = 'vite'; const { build } = await import(spec);`. Also never write the forbidden strings listed in the overview.
- Exit codes: `2` on a bad argument or when `--root` lacks `src/index.ts`, `0` otherwise.
- Do not leave `dist/` modified. `write: false` guarantees this. Never set `outDir` to `dist`.

## Baseline procedure (run once, record in the progress log)

```
mkdir -p tmp/syntax-p00 "$TMPDIR/emaki-baseline-1de212f"
git archive 1de212f src package.json | tar -x -C "$TMPDIR/emaki-baseline-1de212f"
node scripts/bundle-size.mjs --root "$TMPDIR/emaki-baseline-1de212f" --entries core --out tmp/syntax-p00/baseline.json > tmp/syntax-p00/baseline.log 2>&1; echo "exit=$?"
```

Copy the full `baseline.json` content into the progress log. P12 copies it into design §10.4, and `tmp/` is not committed.

## Tests (`input -> expected`)

- `node scripts/bundle-size.mjs --entries core` → exit 0, with `.` raw > 0 and gzip > 0.
- `--bogus` → exit 2.
- `--root /nonexistent` → exit 2.
- Baseline `.` gzip equals the current working-tree `.` gzip, because no plan may touch the core graph. Record both values.

## Verification

```
node scripts/bundle-size.mjs --entries core > tmp/syntax-p00/current.log 2>&1; echo "exit=$?"
npx vitest run test/boundary.test.ts > tmp/syntax-p00/boundary.log 2>&1; echo "exit=$?"     # exit code is informational
grep -E 'scripts/bundle-size\.mjs:' tmp/syntax-p00/boundary.log; echo "grep=$?"             # MUST print nothing (grep=1)
```

- The bundle-size run must exit 0.
- The boundary test is workspace-wide, and wave-1 sibling P01 edits concurrently, so it passes for this plan when no violation names `scripts/bundle-size.mjs`.
- Record any other violations in the progress log with their owning plan id (P01). Do not fix them.
- The full exit-0 gates are enforced by P09 and reconcile.

## Done when

- The script exists.
- The bundle-size run exits 0.
- The owned-path boundary grep prints nothing.
- The baseline JSON for `1de212f` is recorded in the progress log, with raw and gzip for all four core entries.
