# P01 `syntax-p01-engine-contract`: tags, grammar engine, family factories, test helper

- **Wave:** 1
- **dependsOn:** none
- **Design:** §4.4, §5.1–5.4, §6, §9.1
- **writePaths:**
  - `src/language/tags.ts`
  - `src/language/grammar.ts`
  - `src/language/families`
  - `test/language/support`
  - `test/language/grammar.test.ts`
  - `test/language/families.test.ts`
  - `test/language/tags.test.ts`
  - `test/boundary.test.ts` (**restore-only**, checkpoint amendment round 1; see below)
  - `impl-plans/progress/syntax-p01-engine-contract.md`
  - `tmp/syntax-p01` (artifact root)
- **sharedPaths:** `tsconfig.json` (add `"exclude": ["test/fixtures/languages"]` only; nothing else changes)

## Checkpoint amendment round 1 (`integration-636-boundary-ownership`)

Context: an unowned working-tree edit added a root-level `rootSkipped` set (`node_modules`, `dist`, `.git`, `tmp`, `coverage`, `perf-results`, `test-results`, `playwright-report`) to `test/boundary.test.ts`. It stops the boundary gate from scanning `tmp/`, which silently voids P12's spike-leak gate (`syntax-p12-comparison-evidence.md:18,121`) and contradicts `syntax-00-overview.md:48`. The author is unknown. P01 now owns the file **for restoration only**.

Precondition (orchestrator-owned, not P01): the plan-authoring scratch `tmp/syntax-highlighting-20261102/checkpoint/gen.mjs` (contains the forbidden text and an `emaki` import) is relocated outside the repo, for example to `$TMPDIR`, and the move is recorded in the reconcile notes. The Opus plan author attempted the move in step 4 and was denied shell permission, so the orchestrator must do it before redispatching P01.

Ordered steps:

1. `test ! -e tmp/syntax-highlighting-20261102/checkpoint/gen.mjs; echo "relocated=$?"`. If this prints `relocated=1`, still do steps 2-4, then record a blocker naming the path and the orchestrator. Do **not** move, edit or delete anything under `tmp/syntax-highlighting-20261102/`.
2. Record the pre-sha256 of `test/boundary.test.ts`, then run `git checkout 0e8f398 -- test/boundary.test.ts`. Record the post-sha256. That is the only permitted change to this file.
3. `git diff --quiet 0e8f398 -- test/boundary.test.ts; echo "diff=$?"` → `diff=0`.
4. Run the boundary test (see Verification). At the HEAD scope it must exit 0. Wave 1's other plan (P00) is already accepted and no sibling runs concurrently, so a non-zero exit is not informational for this one check. Every violation must name a non-P01 path, and each is recorded as a blocker with its owner.

Forbidden: widening any skip set, adding a new skip mechanism, deleting or weakening boundary assertions, or editing `src/index.ts`, `src/engine.ts`, `src/language/index.ts`, `src/language/incremental.ts`, `src/types.ts` or `package.json`.

## Intent

Pin every contract that wave-2 language plans build on, so those plans can run in parallel. Read the pinned contracts in `impl-plans/active/syntax-00-overview.md`; the signatures there are binding.

## Non-goals

- No language modules (except internal test grammars inside tests).
- No registry and no `package.json` changes.
- No public export of `grammar.ts`/`families`: they stay internal and are not re-exported from `src/language/index.ts`.
- No change to `incremental.ts`, `types.ts`, `text-pass.ts` or `json*`.

## Repository patterns to imitate

- `src/language/json.ts:jsonLanguage` (object-literal `LineLanguage`, `sameState: (a, b) => a === b`).
- `src/language/json-tokenizer.ts:tokenizeJsonLine` (tokens `{from, to, tag}` relative to the line).
- The terse style of `src/language/incremental.ts`.
- `test/language/json.test.ts` (vitest style).
- `test/layout/text-cells.test.ts` (reading a fixture with the `nodeFsModule` dynamic-import idiom, `// @vitest-environment node`).

## Changes

### `src/language/tags.ts`

- Define `StandardTag` and `standardTags`, with the exact 23 members of design §4.4, in that order.
- Define `defaultTokenColors: Record<string, Rgba>`, with a type-only import of `Rgba` from `../render/palette`:
  - It has an entry for every standard tag plus `json-key`, `json-string`, `json-number`, `json-bool`, `json-null`, `json-punct` and `json-invalid`.
  - Colors are readable on `FALLBACK_PALETTE.background` (≈ #0c0f15), using a Nord-like palette. `invalid` is red.
  - Frozen object.

### `src/language/grammar.ts`, `compileGrammar(def)`

Compile once:

- Clone each `match` regex with the `y` flag added and `g` removed. Keep `i`, `u` and `s` if present. Also keep `m`? No: lines are single-line; drop `m`.
- `start` defaults to `'root'`. It must be a key of `states`, and state names must match `/^[\w-]+$/`. Throw `Error` at compile time otherwise, and for an unknown `push`/`next` target.

**State string:**

- Outside an embed: the stack joined with `/`, for example `root/string`.
- Inside an embed: `${outerStack}\u0001${embedKey}\u0002${innerState}`.
  - `embedKey` is `${stateName}.${ruleIndex}:${innerName}:${endArg}`. `innerName` is `''` when the language is unresolved; `endArg` defaults to `''`.
  - Parse by splitting at the **first** `\u0001`, then at the **first** `\u0002` after it. The remainder is the inner state verbatim, because inner states may themselves contain separators (php → html → js).
  - Rebuild `language` and `end` on resume:
    - Static `language` comes from the rule.
    - A dynamic one resolves through a per-compiled-grammar `Map<embedKey, LineLanguage<string>>`, filled when the embed opens. States only arise from tokenizing with the same language instance, so the entry exists in practice. If it is missing, treat the body as unresolved (`fallbackTag`). Do **not** re-invoke `language(m)` with a synthetic match.
    - `end` is the rule's `end`, or `end(endArg)` when it is a function.

**Tokenize loop, outside an embed:**

- At `pos`, try the rules of the top state in order with `lastIndex = pos`.
- First match:
  - Emit tokens. A string `tag` tags the whole match. An array `tag` tags capture group `i+1` with `tag[i]`; locate groups with the `d` flag (`hasIndices`). Add `d` at compile time when `tag` is an array. Skip `undefined` and empty groups.
  - Apply `pop` (never pop the last element), then `push` or `next` (`next` replaces the top).
- A zero-length match with no state change is treated as no match.
- With no match, advance one code point (handle surrogate pairs) and emit nothing.
- At end of line, pop every top state listed in `eolPop`, repeatedly.

**Embed:**

- When a rule with `embed` matches:
  - Emit its tag.
  - Compute `endArg`.
  - Resolve the language. If unresolved, the body is tagged with `fallbackTag ?? 'string'`.
  - The inner state is `startState()`.
  - Continue on the **same line** at the match end.
- While inside an embed, search `end` (compiled with `g`) from `pos` on the full line:
  - The inner language tokenizes `text.slice(pos, endIndex)`, or the rest of the line if there is no end. Shift its tokens by `pos`.
  - At the end match, leave the embed and resume the outer grammar **at `end.index`**, so the outer rules tag the closing delimiter.
- Unresolved bodies get one token per non-empty segment.
- **Loop guard.** If an embed was opened by a zero-length match and its `end` matches at that same position, treat the begin rule as a non-match there and try the next rule. If no rule matches, advance one code point. Test this with a grammar whose root is only `[zero-length embed ending at /x/]` on the text `xx` → it terminates.

**Invariants:**

- Tokens are ascending, non-overlapping and within `[0, text.length]`, with `to > from`.
- **No long-line cutoff:** scan to the true end (design §5.2, DR-003).
- Returned state strings are deterministic for the same input. `sameState` is `===`.

### `src/language/families/` (one file per factory, each returns `GrammarDef`)

**`c-like.ts`**

```ts
cLike(o: {
  name: string;
  keywords: readonly string[];
  types?: readonly string[];
  constants?: readonly string[];
  builtins?: readonly string[];
  lineComment?: string | null;
  blockComment?: readonly [string, string] | null;
  nestedComments?: boolean;
  strings?: readonly string[];
  charQuote?: boolean;
  docComments?: boolean;
  numbers?: RegExp;
  extra?: { root?: readonly Rule[]; states?: Record<string, readonly Rule[]> };
}): GrammarDef
```

- Defaults: `//`, `['/*', '*/']`, `["\""]`, decimal/hex/float/exponent with `_` separators.
- Word lists compile to a `\b(?:a|b)\b` alternation, regex-escaped and longest first.
- `extra.root` rules come **before** the generated defaults.
- Strings support `\` escapes, tagged `escape` inside the string state.
- Unterminated strings pop at end of line (`eolPop`) except in states declared multiline.
- Block comments push a `comment` state that persists across lines.
- `docComments: true` makes `/** … */` emit `meta` for `@word`.
- Identifiers followed by `(` are tagged `function`. Capitalized identifiers are tagged `type` only when listed in `types`.

**`lisp-like.ts`**

```ts
lispLike({ name, specialForms, constants?, lineComment = ';', blockComment? })
```

Strings, numbers, keywords `:foo` → `constant`, and the head symbol after `(` when it is in `specialForms` → `keyword`.

**`shell-like.ts`**

```ts
shellLike({ name, keywords, builtins, comment = '#', variables: RegExp, heredoc?: boolean, caseInsensitive?: boolean })
```

- Builtins are tagged `function`.
- `$VAR`, `${…}` and `%VAR%` are tagged `variable`.
- Single and double quotes; command substitution `$(`…`)` → `punctuation`.
- With `heredoc: true`, `<<EOF` / `<<-'EOF'` pushes a state whose end is the delimiter alone on a line. Encode the delimiter in the state name with a sanitized suffix, or use `endArg` via an embed of a plain inner language. Pick one and document it in the file header.

**`markup-like.ts`**

```ts
markupLike({ name, caseInsensitive?: boolean, embeds?: { script?: LineLanguage<string>; style?: LineLanguage<string> }, extra? })
```

- Tags: `<name` / `</name` → `tag`. `attr=` → `attribute`. Quoted values → `string`.
- `<!-- -->` is a multiline comment. `<!DOCTYPE` and `<?xml` → `meta`. Entities `&amp;` → `escape`.
- When `embeds.script` is given, `<script …>` embeds it, ending at `/<\/script\s*>/i`. `style` works the same way.

**`ini-like.ts`**

```ts
iniLike({ name, comments: readonly string[], sections?: RegExp, keyValue: RegExp, valueRules?: readonly Rule[] })
```

Sections → `type`, keys → `property`, `=`/`:` → `operator`, values via `valueRules` with strings and numbers as the default.

### `test/language/support/fixture-check.ts`

Signatures are pinned in the overview.

- `tokenizeDoc`:
  - Build a `Text` with `Text.of(text.split('\n'))`.
  - Create an `IncrementalHighlighter(lang, { maxLinesPerFrame: 1e9, maxMsPerFrame: 1e9 })`, call `setDoc`, then `tokens(0, doc.lines)`.
  - Assert `approximate === false`.
- `checkFixture(lang, sample, exp)`:
  1. Every class in `exp.classes` appears.
  2. For each `[snippet, tag]`, find the snippet's first index. The snippet must exist. Some token with that `tag` must cover `[idx, idx + snippet.length)` (`from <= idx && to >= idx + len`).
  3. Tokens are ordered, non-overlapping and in range.
  4. **Edit check.** Append one space to the end of the middle line (`Math.floor(lines/2)`):
     - Apply the edit as a `ChangeSet` to a highlighter that has already been warmed by one `tokens()` call, using `applyChanges(changes, newDoc)`.
     - The incremental tokens must deep-equal `tokenizeDoc(lang, newText)`.
     - Re-run steps 1–2 on the new text.
- `readFixture(file)` uses the `nodeFsModule` idiom from `test/layout/text-cells.test.ts` and resolves `new URL('../../fixtures/languages/' + file, import.meta.url).pathname`. It is `async readFixture(file): Promise<string>`, as pinned in the overview, and callers `await` it inside `it`. The fixture-check tests and every language test file that reads fixtures start with `// @vitest-environment node`.

### `tsconfig.json`

Add a top-level `"exclude": ["test/fixtures/languages"]`. Changing nothing else is the only permitted edit.

## Tests (`input -> expected`)

**`grammar.test.ts`** (internal mini grammars):

- A two-state grammar where `"` pushes `str`, `"` pops it, and `str` is multiline:
  - `"a` then `b"` → line 1's state is `root/str`, and line 2 tokens are `string` up to the closing quote, then root.
- A capture-array tag where `/(let)\s+(\w+)/` has tags `['keyword', 'variable']` → two tokens at the exact capture offsets.
- A zero-length lookahead rule with no state change → no infinite loop, and the line completes.
- An astral character (`'😀x'`) with no rule → no split surrogate, and later rules still match.
- `eolPop` of a line-comment state → the next line's state is `root`.
- Unknown `push` target → `compileGrammar` throws.
- **Embed with a static inner** (inner = an `ident → variable` grammar, `end: /<\/x>/`):
  - Begin and end on the same line → inner tokens are shifted correctly, and the outer grammar tags `</x>`.
  - Begin on line 1, end on line 3 → the line-2 state contains `\u0001`, and the line-3 outer resumes.
- **Dynamic embed** where `language(m)` returns `undefined` → the body is tagged `string`. With `fallbackTag: 'meta'` → the body is tagged `meta`.
- **Nested embed** (outer → mid → inner, each with its own end) → the state round-trips. Re-tokenizing the line from the persisted state string yields identical tokens.
- **Long line (DR-003):**
  - `/*` + 'a'×5000 + `*/` then `x` on the next line → the next line is not a comment.
  - 'a'×5000 + `/*` then `x` → the next line is a comment.
  - Uses a `cLike` grammar compiled in the test.

**`families.test.ts`**, one minimal compiled language per factory:

- cLike: keyword, type, string with escape, nested comment when enabled, doc-comment `@param` → `meta`, `foo(` → `function`, `0x1F_u8` → `number`.
- lispLike: `(defun f)` → `keyword`, and `:k` → `constant`.
- shellLike: `$HOME` → `variable`, `echo` → `function`, a heredoc spanning 3 lines ends at the delimiter.
- markupLike: tag, attribute, value, multiline comment, script embed with the end on a later line.
- iniLike: `[sec]` → `type`, `key = 1` → `property`/`operator`/`number`.

**`tags.test.ts`:**

- `standardTags.length === 23`, with no duplicates.
- Every standard and `json-*` tag has a 4-tuple color in `[0, 1]`.

## Verification

```
npx vitest run test/language > tmp/syntax-p01/test.log 2>&1; echo "exit=$?"     # MUST exit 0 (includes the existing json/incremental/fixture tests; no sibling in wave 1 writes test/language)
npm run check > tmp/syntax-p01/check.log 2>&1; echo "exit=$?"                  # exit code is informational
grep -E '^(src/language/(tags|grammar)\.ts|src/language/families/|test/language/(support/|grammar\.test|families\.test|tags\.test)|tsconfig\.json)' tmp/syntax-p01/check.log; echo "grep=$?"     # MUST print nothing (grep=1)
git diff --quiet 0e8f398 -- test/boundary.test.ts; echo "diff=$?"                          # MUST be diff=0 (amendment round 1)
npx vitest run test/boundary.test.ts > tmp/syntax-p01/boundary.log 2>&1; echo "exit=$?"     # MUST exit 0 at HEAD scope (amendment round 1); non-P01 violations become blockers
grep -E '(src/language/(tags|grammar)\.ts|src/language/families/|test/language/(support/|grammar\.test|families\.test|tags\.test))' tmp/syntax-p01/boundary.log; echo "grep=$?"     # MUST print nothing (grep=1)
```

- Wave-1 sibling P00 edits `scripts/bundle-size.mjs` concurrently, so the workspace-wide check and boundary runs are judged only on owned paths.
- Record non-owned diagnostics in the progress log with their owning plan id. Do not fix them.
- The full exit-0 gates are enforced by P09 and reconcile.

## Done when

- All files exist with the pinned signatures. Confirm with `grep -n "export function compileGrammar" src/language/grammar.ts`.
- The tests above exist and pass: `npx vitest run test/language` exits 0.
- Both owned-path greps print nothing.
- `git diff --stat -- src/index.ts src/engine.ts src/language/index.ts src/language/incremental.ts src/types.ts` is empty.
- The progress log has hashes and exit codes.
- Amendment round 1: `git diff --quiet 0e8f398 -- test/boundary.test.ts` exits 0, and `npx vitest run test/boundary.test.ts` exits 0. The progress log records the pre/post sha256 of `test/boundary.test.ts`, the commands, exit codes and log paths. It also corrects its earlier wording: the earlier boundary pass relied on the unowned `tmp/` skip and does not count as evidence.
