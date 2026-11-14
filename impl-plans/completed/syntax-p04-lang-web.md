# P04 `syntax-p04-lang-web`: JavaScript, TypeScript, JSX/TSX, CSS, HTML, XML, Vue, Svelte

- **Wave:** 2
- **dependsOn:** P01
- **Design:** §4.3 (static embeds), §5.3, §6, §7 rows 7, 11, 20, 28, 29, 74, §8
- **writePaths:**
  - `src/language/langs/javascript.ts`
  - `src/language/langs/typescript.ts`
  - `src/language/langs/tsx.ts`
  - `src/language/langs/jsx.ts`
  - `src/language/langs/css.ts`
  - `src/language/langs/html.ts`
  - `src/language/langs/xml.ts`
  - `src/language/langs/vue.ts`
  - `src/language/langs/svelte.ts`
  - fixtures:
    - `test/fixtures/languages/javascript.js`
    - `test/fixtures/languages/typescript.ts`
    - `test/fixtures/languages/tsx.tsx`
    - `test/fixtures/languages/jsx.jsx`
    - `test/fixtures/languages/css.css`
    - `test/fixtures/languages/html.html`
    - `test/fixtures/languages/xml.xml`
    - `test/fixtures/languages/vue.vue`
    - `test/fixtures/languages/svelte.svelte`
    - `test/fixtures/languages/nant.build`
  - `test/language/expectations/web.ts` (exports `webExpectations`, plus `nantExpectation` for the alias row 7)
  - `test/language/langs/web.test.ts`
  - `impl-plans/progress/syntax-p04-lang-web.md`
- **sharedPaths:** none

## Intent

Web languages, plus the static-embed hosts that P08, P09 and P10 depend on. Exports must be exactly: `javascriptLanguage`, `typescriptLanguage`, `tsxLanguage`, `jsxLanguage`, `cssLanguage`, `htmlLanguage`, `xmlLanguage`, `vueLanguage`, `svelteLanguage`.

Follow the "Common procedure for language group plans" in `syntax-00-overview.md`.

## Non-goals

- No TS type checking.
- No JSX semantics beyond tags and attributes.
- No SCSS/Less grammar: Vue `lang="scss"` uses css.
- No Svelte nested-brace expressions (documented limitation, design §5.3).

## Boundary pitfalls

- `typescript.ts` and `html.html` are scanned by `test/boundary.test.ts`. Use **only relative** imports in samples (`import { a } from './a'`), never package names.
- Avoid the forbidden strings.
- `.ts`/`.tsx` samples are excluded from `tsc` by P01's tsconfig change. Do not rely on them compiling.

## Key points

### javascript

Define the grammar as an internal `jsGrammar(opts: { types: boolean; jsx: boolean }): GrammarDef` in `javascript.ts`, exported **as a named non-language export** `jsGrammar`. typescript, tsx and jsx import it, so there is one source of truth. It is the only allowed extra export.

- **Regex literal (expect `/a+b/g` → `regexp`, chilla row 29 obligation).**
  - A `/` starts a regex only when the previous significant token is:
    - start of line
    - an operator
    - `(`, `,`, `=`, `:`, `[`, `!`, `&`, `|`, `?`, `{`, `}` or `;`
    - one of the keywords `return`, `typeof`, `case`, `do`, `else`, `in`, `of`, `new`, `delete`, `void`, `throw`
  - Otherwise `/` is division.
  - Track this with two root states (`root` = expression-start, `rootAfterValue`), switched via `next`.
  - Pitfall: do not treat `a / b / c` as a regex.
- **Template literals** span lines. `${` pushes `tplExpr`, which reuses the root rules. Inside it, `{` pushes `brace` and `}` pops, so `${ {a:1}.a }` works.
- `//` and `/* */` comments.
- Numbers including `1_000n` and `0b1`.

### typescript

`jsGrammar({ types: true, jsx: false })`:

- `interface`, `type`, `enum`, `satisfies`, `declare`, `readonly`, `as` → `keyword` **(expect `interface`)**.
- Primitive types `string`, `number`, `boolean`, `unknown`, `never` → `type` **(expect `unknown`)**.
- `<T>` generics: angle brackets are `punctuation`.

### tsx / jsx

`jsx: true`:

- In expression-start position, `<Ident` or `<>` opens a JSX tag → `tag` **(expect)**.
- Attributes → `attribute`. `{expr}` inside JSX children/attributes reuses root rules through a brace-depth push/pop.
- JSX text children → no token.
- tsx is `types: true` + `jsx: true`.
- Pitfall: in tsx, `<T,>(x) =>` generic arrows are acceptable to mis-tag as a tag. Document this and do not test it.

### css

- Selectors: `.cls` / `#id` → `attribute`, element → `tag`.
- Properties → `property` **(expect)**.
- `@media` → `keyword`.
- `12px` → `number`, `#fff` → `constant`.
- `/* */` comments across lines.
- Strings and `!important` → `keyword`.

### html

`markupLike({ name: 'html', caseInsensitive: true, embeds: { script: javascriptLanguage, style: cssLanguage } })`:

- `<SCRIPT>` works (case-insensitive).
- `<script type="module">` still embeds JS.
- `<script>` with the body on following lines **(expect a JS keyword inside script → `keyword`, and a CSS property inside style → `property`)**.

### xml

`markupLike({ name: 'xml' })`:

- `<![CDATA[ … ]]>` → `string`, multiline.
- `<?xml … ?>` → `meta`.
- `nant.build` (a NAnt build file) is an xml sample. Its expectation goes in `nantExpectation`: `{ id: 'nant', ext: 'build', classes: ['tag', 'attribute'], … }`, tested with `xmlLanguage`.

### vue

The host grammar reuses `markupLike` rules for the template, plus:

- `{{ expr }}` → embed `javascriptLanguage`, ending at `/\}\}/` **(expect a JS token inside `{{ }}`)**.
- `<script lang="ts">` (single-line opening tag) → embed `typescriptLanguage` **(expect a TS-only keyword like `interface` → `keyword`)**.
- `<script>` → javascript. `<style>` / `<style lang="scss">` → css.
- Pitfall: an opening tag spanning lines falls back to markup highlighting without the embed. Document this.

### svelte

- `{#if x}` / `{:else}` / `{/if}` / `{#each}` → `keyword` **(expect `#if`)**.
- `{expr}` → embed javascript ending at `}`.
- script and style are handled as in vue.

## Tests (`input -> expected`)

- js `const r = /=+/; const d = a / b / c;`: `/=+/` → `regexp`, and no `regexp` token appears in the second statement.
- js template literal ``const t = `a${ {k:1}.k }b`;`` with `` ` `` closing on the same line → the text after the literal is not `string`.
- js template literal opened on line 1 and closed on line 3 → line 2 is `string`.
- html line 1 `<script>`, line 2 `let x = 1;`, line 3 `</script>`, line 4 `<p class="a">` → line 2 has `let` as `keyword`, line 3's `script` is `tag`, and line 4's `class` is `attribute`.
- html `<style>a{color:red}</style>` on one line → `color` is `property`.
- vue `<script lang="ts">` / `let x: unknown;` / `</script>` → `unknown` is `type`.
- tsx `return <Button onClick={() => go(1)}>Hi</Button>;` → `Button` is `tag`, `onClick` is `attribute`, and `1` is `number`.

## Verification and done

Per the common procedure, with `<group>` = `web`. `web.test.ts` also runs `checkFixture(xmlLanguage, nant.build sample, nantExpectation)`.
