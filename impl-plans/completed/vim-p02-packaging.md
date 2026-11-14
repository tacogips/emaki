# P02 `vim-p02-packaging`: `./vim` export, bundle-size entry, boundary isolation

- **Wave:** 1
- **dependsOn:** none
- **Design:** `design-vim.md` §3
- **Contracts:** overview C2 (entry path only)
- **writePaths:**
  - `package.json`
  - `scripts/bundle-size.mjs`
  - `test/boundary.test.ts`
  - `tmp/vim-20261111/vim-p02-packaging` (artifact)
  - `impl-plans/progress/vim-p02-packaging.md`
- **sharedPaths:** none

## Intent

Publish the `./vim` subpath and measure it, while guaranteeing that the core never imports vim.

## Non-goals

- Do not touch `src/**`.
- Do not change `peerDependencies`, `devDependencies` or any versions.
- Do not run `npm install`, and do not change `package-lock.json`. Only the `exports` map changes.
- Do not change the `core` selection of `bundle-size.mjs`.

## Changes

1. **`package.json`.** In `exports`, add `"./vim": "./src/vim/index.ts"` after `"./diff"`. Nothing else changes.
2. **`scripts/bundle-size.mjs`.** In the `if (selection === 'all')` block, before the languages entries, add `entries['./vim'] = 'src/vim/index.ts'`.
   - The existing "missing entry → `skipped`" path must keep working. While p03 has not yet created `index.ts`, `./vim` appears under `skipped`.
   - The `--entries core` entry set stays exactly `.`, `./engine`, `./json` and `./diff`.
3. **`test/boundary.test.ts`.** Add an `it('keeps vim out of core', …)` case:
   - Walk `src/`. For every file **not** under `src/vim/`, resolve each relative import spec against the file's directory, using the same component logic as `classify`.
   - Report `vim import: <spec>` if the resolved path is `src/vim` or starts with `src/vim/`.
   - Add a case to the existing `classifies…` unit test as well. Either factor the resolver into a small helper, or add a second helper `importsVim(file, source)`, so it can be unit-tested. Example: `importsVim('src/editor.ts', "import { vim } from './vim/index'")` → `true`, and `importsVim('src/vim/a.ts', "import x from './b'")` → `false`.
   - Imitate the existing `classify` and `walk` code and its style, including the `node:fs` dynamic import trick. Keep `examples/tauri-editor` excluded.

## Pitfalls

- **JSON formatting.** Keep `package.json` 2-space JSON with the key order intact, and do not reformat it.
- **Import forms.** The vim-isolation check must handle the `import`, `export … from` and `import()` forms, which the existing regex already matches.
- **No forbidden strings.** Do not introduce literal forbidden strings. The existing test concatenates them (`'vac' + 'tr'`).

## Tests (`situation -> expected`)

- The current tree → the boundary test passes.
- The `importsVim` unit cases → as stated in Changes step 3.
- `node scripts/bundle-size.mjs --entries core` → the JSON `entries` keys are exactly `.`, `./engine`, `./json` and `./diff`.
- `node scripts/bundle-size.mjs` → `./vim` appears under `entries`, or under `skipped` if `src/vim/index.ts` does not exist yet.

## Verification

Write each log to `tmp/vim-20261111/vim-p02-packaging/`.

| command | log | must show |
|---|---|---|
| `npx vitest run test/boundary.test.ts` | `boundary.log` | exit 0, or failures only from sibling in-progress `src/vim` text, which are recorded |
| `node scripts/bundle-size.mjs --entries core --out tmp/vim-20261111/vim-p02-packaging/core.json` | `core.log` | exit 0, and the 4 keys |
| `node scripts/bundle-size.mjs --out tmp/vim-20261111/vim-p02-packaging/all.json` | `all.log` | exit 0, and `./vim` in `entries` or `skipped` |
| `node -e "const p=require('./package.json');if(p.exports['./vim']!=='./src/vim/index.ts')process.exit(1)"` | `export.log` | exit 0 |

## Done criteria

- All four commands meet their expected results.
- `git diff --stat -- package-lock.json` is empty.
- The progress log records the exit codes.
