# Syntax highlighting: implementation plan overview

**Source of truth:** `design-docs/specs/design-syntax-highlighting.md` (accepted by step 3), cited below as "design §N". This overview pins the cross-plan contracts and rules. Every plan restates the parts it depends on.

## Waves and DAG

| Wave | Plan | Depends on |
|---|---|---|
| 1 | P00 `syntax-p00-bundle-size` | none |
| 1 | P01 `syntax-p01-engine-contract` | none |
| 2 | P02 `syntax-p02-lang-c-family` | P01 |
| 2 | P03 `syntax-p03-lang-jvm-config` | P01 |
| 2 | P04 `syntax-p04-lang-web` | P01 |
| 2 | P05 `syntax-p05-lang-scripting` | P01 |
| 2 | P06 `syntax-p06-lang-functional` | P01 |
| 2 | P07 `syntax-p07-lang-docs-markup` | P01 |
| 3 | P08 `syntax-p08-lang-templates` | P03, P04, P05, P06 |
| 4 | P09 `syntax-p09-registry-integration` | P02, P03, P04, P05, P06, P07, P08 |
| 5 | P10 `syntax-p10-perf-harness` | P09 |
| 5 | P11 `syntax-p11-readme` | P09 |
| 6 | P12 `syntax-p12-comparison-evidence` | P00, P10 |

## Rules for every plan

- **Work only inside your own `writePaths`.** If you need a change elsewhere, record it in your progress log as a blocker. Do not make that change.
- **Edit hygiene.** Before each edit, read the file fresh and record its sha256 in your progress log (`shasum -a 256 <file>`). After the edit, record the new hash. If a pre-edit hash differs from your last recorded post-edit hash, another writer touched the file: stop, log the drift, and do not overwrite.
- **Progress log.** Each plan keeps `impl-plans/progress/<planId>.md` and edits only that one. Record:
  - your intent snapshot (copy of the plan's acceptance criteria)
  - hashes
  - every verification command with its exit code and full log path (`tmp/<planId>/<step>.log`; `tmp/` is gitignored)
  - blockers
- **Artifact roots.** Every plan owns `tmp/<planId>` as a writePath and declares it as an artifact root (logs are not source). P10 also declares `dist` and `perf-results/syntax-p10`; P12 also declares `perf-results/syntax-p12`. Write generated output only under your own roots. Before a plan is done, copy evidence (exit codes, summaries, JSON results) into its progress log.
- **Git.** No git operations except P00's read-only `git archive`: no branches, worktrees, commits or stashes. The final commit is done by workflow finalization in the numbered 1–6 style, with no push.
- **Foreground commands.** Run every command in the foreground. Capture logs with `cmd > tmp/<planId>/<step>.log 2>&1; echo "exit=$?"`. A truncated log is not a pass.
- **Forbidden edits:**
  - Do not touch `/Users/taco/gits/tacogips/chilla` or `/Users/taco/gits/tacogips/vactr`.
  - Do not add dependencies or peerDependencies.
  - Do not edit these files:
    - `src/index.ts`
    - `src/engine.ts`
    - `src/language/index.ts`
    - `src/language/incremental.ts`
    - `src/language/json.ts`
    - `src/language/json-tokenizer.ts`
    - `src/render/*`
    - `src/editor.ts`
    - `src/types.ts`
- **Boundary test.** `test/boundary.test.ts` scans every `.ts`, `.mjs` and `.html` file outside `node_modules`/`dist`:
  - Any static or literal `import`/`export from`/`import('x')` of a package other than `@codemirror/state` and `@codemirror/commands` (in `src/`) or `vitest`/`jsdom`/`playwright` (in `test/`, `examples/`, `scripts/`) fails.
  - The texts `solid` + `-js`, `vac` + `tr` and `/` + `editor/` are forbidden in any of those files.
  - Fixture files (including `.ts`/`.html` samples) must therefore contain **no package imports** and none of those strings.
- **Tag vocabulary.** Every language emits only `StandardTag` values from `src/language/tags.ts`. JSON keeps its `json-*` tags.

## Pinned contracts (owned by P01)

`src/language/tags.ts`:

```ts
export type StandardTag = 'keyword'|'string'|'number'|'comment'|'operator'|'punctuation'|'type'|'function'|'variable'|'property'|'constant'|'tag'|'attribute'|'heading'|'emphasis'|'strong'|'link'|'regexp'|'escape'|'meta'|'inserted'|'deleted'|'invalid';
export const standardTags: readonly StandardTag[];
export const defaultTokenColors: Record<string, Rgba>; // every StandardTag + json-{key,string,number,bool,null,punct,invalid}
```

`src/language/grammar.ts`:

```ts
export interface Rule { match: RegExp; tag?: StandardTag | readonly (StandardTag | undefined)[]; push?: string; pop?: true; next?: string; embed?: EmbedSpec }
export interface EmbedSpec {
  language: LineLanguage<string> | ((m: RegExpExecArray) => LineLanguage<string> | undefined);
  end: RegExp | ((endArg: string) => RegExp);
  endArg?: (m: RegExpExecArray) => string;
  fallbackTag?: StandardTag; // body tag when language resolves to undefined; default 'string'
}
export interface GrammarDef { name: string; start?: string; states: Record<string, readonly Rule[]>; eolPop?: readonly string[] }
export function compileGrammar(def: GrammarDef): LineLanguage<string>;
```

`src/language/families/*.ts`: each factory returns a `GrammarDef`, not a compiled language, so callers can extend it before calling `compileGrammar`. Signatures are in the P01 plan.

`test/language/support/fixture-check.ts`:

```ts
export interface LanguageExpectation { id: string; ext: string; classes: readonly string[]; snippets: readonly (readonly [snippet: string, tag: string])[] } // tags are StandardTag except json (json-*); sample file = `${id}.${ext}`
export function tokenizeDoc(lang: LineLanguage<string>, text: string): TokenSpan[];
export function checkFixture(lang: LineLanguage<string>, sample: string, exp: LanguageExpectation): void; // throws via vitest expect
export function readFixture(file: string): Promise<string>; // relative to test/fixtures/languages/; async because it uses the dynamic node:fs idiom
```

Per-language module contract (wave 2/3):

- File: `src/language/langs/<id>.ts`.
- It exports `<camelId>Language: LineLanguage<string>`.
- `name` equals `<id>`.
- `startState()` returns a string with no `\u0001`/`\u0002`.

### Common procedure for language group plans (P02–P08)

**Per id:**

1. Write `src/language/langs/<id>.ts`:
   - Import `compileGrammar` from `../grammar`, and factories from `../families/<f>`.
   - Export `const <camelId>Language = compileGrammar({...})`, with `name: '<id>'`. camelId is the id with `-x` changed to `X`, for example `erlang-html` → `erlangHtmlLanguage`.
   - Add no other exports, except where a plan states otherwise.
2. Write the sample `test/fixtures/languages/<id>.<ext>` (20–60 lines). It contains every construct named in the plan for that id. It has no package imports and none of the forbidden strings.
3. Add one `LanguageExpectation` to the group's `test/language/expectations/<group>.ts`:
   - `classes` are those of design §6: `keyword`, `string`, `comment`, plus `number` when the language has numeric literals; the markup and prose classes for prose languages.
   - Add at least 4 `snippets`, including every construct the plan marks **(expect)**.
   - Pick each snippet so that its **first** occurrence in the sample is the intended one.
4. Write `test/language/langs/<group>.test.ts` (`// @vitest-environment node`):
   - For each expectation, import the module and `await readFixture(...)`, then call `checkFixture`.
   - Add the plan-specific unit cases.

**Imitate:**

- `src/language/json.ts` (module shape)
- `test/language/json.test.ts` (direct `tokenizeLine` assertions)
- P01's `families/*` (factory usage)

**Never edit:**

- other plans' `langs` files
- `src/language/grammar.ts` and `src/language/families/*`: if a factory lacks something, add rules via `extra`/`states` in your own module. If it is truly impossible, record a blocker.
- `package.json`, the registry, `tsconfig.json`

**Verification** (per plan, scoped to owned files):

```
npx vitest run test/language/langs/<group>.test.ts > tmp/<planId>/test.log 2>&1; echo "exit=$?"     # MUST exit 0 (plan-scoped gate)
npm run check > tmp/<planId>/check.log 2>&1; echo "exit=$?"                                      # exit code is informational
grep -E '^(<owned-path-alternation>)\(' tmp/<planId>/check.log; echo "grep=$?"                    # MUST print nothing (grep=1)
npx vitest run test/boundary.test.ts > tmp/<planId>/boundary.log 2>&1; echo "exit=$?"            # exit code is informational
grep -E '(<owned-path-alternation>):' tmp/<planId>/boundary.log; echo "grep=$?"                   # MUST print nothing (grep=1)
```

**`<owned-path-alternation>`** is this plan's source writePaths, regex-escaped and joined with `|`. Example for P02: `src/language/langs/(c|cpp|csharp|…)\.ts|test/language/(expectations/c-family|langs/c-family\.test)\.ts|test/fixtures/languages/(c\.c|cpp\.cpp|…)`.

- tsc prints diagnostics as `path(line,col): error …`.
- `test/boundary.test.ts` prints violations as `path: issue`.

**Why the workspace-wide commands are not exit-0 gates here:**

- Sibling plans in the same wave edit concurrently, so `npm run check` and the boundary test can fail on a file another plan is mid-edit.
- If either log names a file you do **not** own, copy those lines into your progress log with the owning plan id (use the writePaths tables in the plan files). Then continue: this is not a failure of your plan.
- Never edit a non-owned file to make a workspace command pass.
- The full exit-0 `npm run check` / `npm test` gates are enforced serially by P09 (wave 4) and by reconcile/finalization.

**Done criteria (mechanical):**

- Each listed id has a module file, a sample file and an expectation entry. Confirm with `ls src/language/langs/<id>.ts test/fixtures/languages/<id>.*`.
- The group vitest run exits 0.
- Both owned-path greps print nothing.
- The progress log has hashes, exit codes, log paths and any non-owned diagnostics with their owning plan id.

**Fixture naming.** A **C** id has exactly one sample file `test/fixtures/languages/<id>.<ext>`, where the basename before the first dot equals the id. Each group plan exports its expectations from `test/language/expectations/<group>.ts` as `export const <group>Expectations: readonly LanguageExpectation[]`. Expectations live outside `test/fixtures/` because P01 excludes `test/fixtures/languages` from `tsconfig.json`: sample `.ts`/`.tsx` files must not be type-checked.
