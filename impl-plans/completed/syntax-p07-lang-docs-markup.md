# P07 `syntax-p07-lang-docs-markup`: Markdown, prose, TeX family, Diff, YAML, Haml, plaintext, JSON entry

- **Wave:** 2
- **dependsOn:** P01
- **Design:** §4.3 (`createMarkdownLanguage`), §5.3 (fence embed), §6 (prose classes), §7 rows 1, 14, 27, 30, 32, 33, 38, 55, 58, 62, 73, 75
- **writePaths:**
  - `src/language/langs/markdown.ts`
  - `src/language/langs/restructuredtext.ts`
  - `src/language/langs/textile.ts`
  - `src/language/langs/latex.ts`
  - `src/language/langs/tex.ts`
  - `src/language/langs/bibtex.ts`
  - `src/language/langs/rd.ts`
  - `src/language/langs/diff.ts`
  - `src/language/langs/yaml.ts`
  - `src/language/langs/haml.ts`
  - `src/language/langs/plaintext.ts`
  - `src/language/langs/json.ts`
  - fixtures:
    - `test/fixtures/languages/markdown.md`
    - `test/fixtures/languages/restructuredtext.rst`
    - `test/fixtures/languages/textile.textile`
    - `test/fixtures/languages/latex.tex`
    - `test/fixtures/languages/tex.tex`
    - `test/fixtures/languages/bibtex.bib`
    - `test/fixtures/languages/rd.rd`
    - `test/fixtures/languages/diff.diff`
    - `test/fixtures/languages/yaml.yaml`
    - `test/fixtures/languages/haml.haml`
    - `test/fixtures/languages/json.json`
  - `test/language/expectations/docs-markup.ts` (exports `docsMarkupExpectations`)
  - `test/language/langs/docs-markup.test.ts`
  - `impl-plans/progress/syntax-p07-lang-docs-markup.md`
- **sharedPaths:** none

## Intent

Prose and markup languages, plus the dynamic-embed Markdown host and two registry support modules:

- `plaintext`, which emits no tokens.
- `json`, a pure re-export of the existing `jsonLanguage`.

Follow the "Common procedure for language group plans" in `syntax-00-overview.md`.

## Non-goals

- No CommonMark-complete parsing: no setext edge cases, nested-list indentation or HTML blocks.
- No YAML flow-collection validation.
- No Ruby highlighting inside Haml: P05's ruby is in the same wave and may not be imported.

## Key points

### markdown

Exports `markdownLanguage` (no embeds: every fence body is `string`) and:

```ts
export function createMarkdownLanguage(embedded: (fenceInfo: string) => LineLanguage<string> | undefined): LineLanguage<string>
```

**Fence open:** `/^( {0,3})(`{3,}|~{3,})[ \t]*([^\s`]*)?.*$/`.

- The fence chars → `punctuation`, and the info word → `meta`.
- `embed.language = m => embedded(m[3] ?? '')`, where the raw info word is passed through. **Normalization belongs to P09's `resolveLanguage`**, so do not normalize here.
- `endArg` is the fence run (for example `` ```` ``).
- `end = arg => new RegExp('^ {0,3}' + escape(arg[0]) + '{' + arg.length + ',}[ \\t]*$')`.
- Pitfall: `` ``` `` with no info string must also open a fence (body tagged `string`).
- Pitfall: a closing fence must use the same char, at least the same length, with nothing but whitespace after it.
- The fence body must **not** re-embed markdown.

**Inline elements:**

- `#`–`######` headings → `heading` **(expect)**.
- `**x**` → `strong`, `*x*`/`_x_` → `emphasis`.
- `` `code` `` → `string`.
- `[t](u)` → `link`.
- `>` blockquote marker, and `-`/`*`/`1.` list markers → `punctuation`.
- `<!-- -->` → `comment`.

### Other languages

**restructuredtext**

- Title underline/overline lines (`===`, `---` and so on, 3+ chars) → `heading` **(expect)**.
- `.. directive::` → `keyword`.
- `:role:` → `attribute`.
- ``` ``literal`` ``` → `string`.
- `.. comment` → `comment`.

**textile**

- `h1.` → `heading`, `*strong*` → `strong`, `_em_` → `emphasis`.
- `"text":url` → `link`.
- `bc.` → `meta`.

**tex**

- `\command` → `keyword` **(expect)**.
- `%` comment, `{}` → `punctuation`.
- `$…$` / `$$…$$` math → `string`.

**latex**

- tex rules, plus `\begin{env}` / `\end{env}`, where the env name → `type` **(expect)**.
- Import tex's grammar: `tex.ts` exports `texGrammar: GrammarDef`. That is the only extra export.

**bibtex**

- `@article{key,` → `@article` is `keyword`.
- Fields → `property`, `{…}`/`"…"` values → `string`.
- Lines outside entries → `comment`.

**rd**

- `\name{}` → `keyword`, `%` comment.

**diff**

- `+` lines → `inserted`, `-` lines → `deleted`.
- `@@ … @@` → `meta`.
- `diff --git`, `---` and `+++` headers → `heading` **(expect each of `inserted`, `deleted`, `meta`)**.

**yaml**

- `key:` → `property`.
- `- ` → `punctuation`.
- `&anchor`/`*alias` → `variable`.
- `!!str` → `type`.
- `#` comment.
- `|`/`>` block scalars: the following lines indented more than the key are `string`. Carry the indent in the state name (`block4`).

**haml**

- `%tag` → `tag`. `.class`/`#id` → `attribute`.
- `-`/`=` line markers → `keyword`, followed by generic string/number rules.
- `-#` and `/` comments.

**plaintext**

- `plaintextLanguage = { kind: 'lines', name: 'plaintext', startState: () => '', tokenizeLine: () => ({ tokens: [], state: '' }), sameState: (a, b) => a === b }`
- It has no fixture: chilla row 1 is excluded from token fixtures.

**json**

- `langs/json.ts`: `export { jsonLanguage } from '../json';`. Do not alter `src/language/json.ts`.
- Its expectation uses `json-*` tags: classes `['json-key', 'json-string', 'json-number', 'json-punct']`.

## Tests (`input -> expected`)

**Markdown via `createMarkdownLanguage`.** Use as inner: `jsonLanguage` mapped from info `json`, and a tiny test grammar compiled in the test mapped from info `t`.

- ```` ```json ```` / `{"a": 1}` / ```` ``` ```` / `# H` → line 2 has `json-key`, and line 4 is `heading`.
- ```` ```nope ```` / `x` / ```` ``` ```` → line 2 is `string`.
- ```` ```` ```` / ```` ``` ```` / ```` ```` ```` → line 2 (a shorter fence) stays inside the body as `string`, and line 3 closes the fence.
- `~~~t` / … / `~~~` → the tilde fence works.
- `markdownLanguage` with ```` ```json ```` → the body is `string` (no embeds).
- An edit inside a fence body (via `checkFixture`'s edit step on `markdown.md`, which must contain a fence of an unloaded language) → incremental equals fresh.
- diff `+a` / `-b` / `@@ -1 +1 @@` → `inserted`, `deleted`, `meta`.
- yaml `k: |` / `  text` / `j: 1` → line 2 is `string`, and line 3's `j` is `property`.

## Verification and done

Per the common procedure, with `<group>` = `docs-markup`. Also run `npx vitest run test/language/json.test.ts`, which must stay green.
