# P08 template languages progress

Status: implementation complete; formal review and serial integration remain downstream. Intent: implement static HTML/server hosts, fixtures, expectations, and tests under P08 writePaths. Dependencies P03–P06 were accepted by the runtime dispatch. Pre-edit snapshot: `tmp/syntax-p08/intent.json` (all P08 paths absent). Per-edit intentions and prior hashes: `tmp/syntax-p08/edit-heredoc-intent.json` and `tmp/syntax-p08/edit-fixtures-intent.json`. Earlier source hashes: `tmp/syntax-highlighting-20261102/syntax-p08-lang-templates/post.sha256`.

Verification on the moving shared tree (full logs under `tmp/syntax-highlighting-20261102/syntax-p08-lang-templates/`):
- `npx vitest run test/language/langs/templates.test.ts`: exit 0, 10 tests; `test-final.log`.
- `npm run check`: exit 0, `check-final.log`; owned diagnostic grep exit 1, no matches, `check-owned-final.log`.
- `npx vitest run test/boundary.test.ts`: exit 0, 2 tests, `boundary-final.log`; owned grep exit 1, no matches, `boundary-owned-final.log`.
- No non-owned diagnostics observed. Combined-tree gates remain with P09 and reconcile.

The 2026-11-04 round 1 amendment replaces the empty-line embed-opening requirement, clearing the prior P01 blocker. The test now asserts empty root and open HTML states remain unchanged with no tokens, and that the next HTML line matches the result without the empty line. HTML state resets after server blocks as designed. Intent and pre-edit hashes are in `tmp/syntax-p08/amendment-test-intent.txt`, `tmp/syntax-p08/amendment-progress-intent.txt`, and `tmp/syntax-p08/amendment-pre.sha256`; final source hashes are in `tmp/syntax-highlighting-20261102/syntax-p08-lang-templates/amendment-post.sha256`, with the progress hash recorded separately in `amendment-progress-post.sha256`.

Amendment verification on the shared tree (full paths below; no non-owned diagnostics):
- `npx vitest run test/language/langs/templates.test.ts`: exit 0, 10 passed; `tmp/syntax-highlighting-20261102/syntax-p08-lang-templates/amendment-test.log`.
- `npm run check`: exit 0; `tmp/syntax-highlighting-20261102/syntax-p08-lang-templates/amendment-check.log`. Owned grep exit 1, no matches: `tmp/syntax-highlighting-20261102/syntax-p08-lang-templates/amendment-check-owned.log`.
- `npx vitest run test/boundary.test.ts`: exit 0, 2 passed; `tmp/syntax-highlighting-20261102/syntax-p08-lang-templates/amendment-boundary.log`. Owned grep exit 1, no matches: `tmp/syntax-highlighting-20261102/syntax-p08-lang-templates/amendment-boundary-owned.log`.
- `shasum -a 256 src/language/grammar.ts` and hash comparison: exit 0; `tmp/syntax-highlighting-20261102/syntax-p08-lang-templates/amendment-grammar.sha256` matches P01's `55cddf2a9af0373701a03b329eaf48d969577a43d11a66012ff7ca070b4c280f`.
