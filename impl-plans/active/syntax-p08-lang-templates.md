# P08 `syntax-p08-lang-templates`: PHP and server-template hosts

- **Wave:** 3
- **dependsOn:**
  - P03 (java)
  - P04 (html)
  - P05 (ruby, tcl)
  - P06 (erlang)
- **Design:** §4.3 static embeds, §5.3 (`?>` / `%>` ends), §7 rows 4, 16, 23, 47, 48, 56, 71
- **writePaths:**
  - `src/language/templates/html-template.ts`
  - `src/language/langs/php.ts`
  - `src/language/langs/asp.ts`
  - `src/language/langs/jsp.ts`
  - `src/language/langs/erb.ts`
  - `src/language/langs/erlang-html.ts`
  - `src/language/langs/tcl-html.ts`
  - fixtures:
    - `test/fixtures/languages/php.php`
    - `test/fixtures/languages/asp.asp`
    - `test/fixtures/languages/jsp.jsp`
    - `test/fixtures/languages/erb.erb`
    - `test/fixtures/languages/erlang-html.yaws`
    - `test/fixtures/languages/tcl-html.adp`
  - `test/language/expectations/templates.ts` (exports `templatesExpectations`)
  - `test/language/langs/templates.test.ts`
  - `impl-plans/progress/syntax-p08-lang-templates.md`
- **sharedPaths:** none

## Intent

Hosts where HTML surrounds server code. Follow the "Common procedure for language group plans" in `syntax-00-overview.md`.

The shared helper lives in `src/language/templates/` and **not** in `langs/`, because every `langs/*.ts` file becomes a public `emaki/languages/<id>` subpath.

## Non-goals

- Preserving HTML's inner state (for example inside `<script>`) across a server block. After a server block, HTML resumes from its start state. Document this limitation in the helper's header.

## Contract

`src/language/templates/html-template.ts`:

```ts
export function htmlTemplate(o: { name: string; open: RegExp; close: RegExp; server: LineLanguage<string>; openTag?: StandardTag; commentOpen?: RegExp }): GrammarDef
```

It returns a grammar with this structure:

- `root` rules, **in this order**:
  1. `commentOpen` (if any)
  2. the `o.open` delimiter rule (tagged `meta`, embedding the server language)
  3. a **zero-length** match (`/(?:)/`) whose `embed` is `htmlLanguage`, ending at `o.open`. P01 allows zero-length matches that change state, so this rule is valid. On an empty line no rule runs (P01 engine evaluates rules only while `pos < text.length`), so the host `root` state is preserved and the HTML embed opens at offset 0 of the next nonempty line (see Amendment 2026-11-04).
- Ordering pitfall: if the zero-length HTML rule came first, then at the position of `<?php` it would reopen HTML, whose end matches immediately, and loop forever. Add a test that a line starting with the open delimiter terminates.
- After the HTML embed ends, the outer `root` sees the open delimiter:
  - The open delimiter (`<%`, `<%=`, `<?php`, `<?=`, `<erl>`) → `meta`.
  - It is followed by an embed of `o.server` that ends at `o.close`.
- The close delimiter → `meta`, then back to `root`, which re-embeds HTML.
- Comment forms (`<%#` … `%>`, `<%--` … `--%>`) → `comment` via `commentOpen`.

## Per-language key points

**php**

- open `/<\?(?:php\b|=)?/`, close `/\?>/`.
- The server grammar is defined in `php.ts`: a `cLike` def plus:
  - `$var` → `variable` **(expect)**
  - `->`/`::` → `operator`
  - `#`, `//` and `/* */` comments
  - heredoc/nowdoc `<<<EOT`
  - `function` → `keyword`
- A file with no `?>` at the end stays in PHP.
- Chilla row 47 (PHP Source) obligation: the sample's code inside `<?php ?>` has `function` → `keyword` **(expect)**.

**asp**

- open `/<%=?/`, close `/%>/`.
- The server is a VBScript-lite grammar defined inside `asp.ts`: case-insensitive `Dim`, `If`, `Then`, `End`, `Sub`, `Response` and similar → `keyword`; `'` comment; `"…"` strings.

**jsp**

- `<%@ page … %>` → `meta`.
- `<%=`, `<%` with `javaLanguage`.
- `<%-- --%>` → `comment` **(expect)**.

**erb**

- `<%#` → `comment`.
- `<%=` / `<%` / `-%>` with `rubyLanguage` **(expect a ruby keyword inside `<% %>`, such as `do`/`end`)**.

**erlang-html**

- open `/<erl>/i`, close `/<\/erl>/i`, with `erlangLanguage`.

**tcl-html**

- `<%` / `%>`, with `tclLanguage`.

## Tests (`input -> expected`)

- php `<p><?php echo $x; ?></p>` → `p` is `tag`, `<?php` is `meta`, `$x` is `variable`, and the second `p` is `tag`.
- php `<?php` / `$a = 1;` (no close) / `` → line 2's `1` is `number`.
- erb `<ul>` / `<% items.each do |i| %>` / `<li><%= i %></li>` / `<% end %>` → line 2 has `do` as `keyword`, line 3 has `li` as `tag`, and line 4 has `end` as `keyword`.
- jsp `<%-- a` / `b --%>` / `<p>` → line 2 is `comment`, and line 3's `p` is `tag`.
- An empty line between HTML lines → no throw, and the following HTML tags are still `tag`.

## Verification and done

Per the common procedure, with `<group>` = `templates`.

## Amendment 2026-11-04 (blocked-wave-scope-or-contract, round 1)

- **Blocker:** wave-002 reported that the zero-length HTML embed cannot open on an empty line. `src/language/grammar.ts` (owned by accepted plan P01) evaluates rules only while `pos < text.length`. Evidence: `tmp/opus-terra-waves/opus-terra-design-and-implement-review-loop-session-701/wave-002/fanout-join.json` and `impl-plans/progress/syntax-p08-lang-templates.md`.
- **Decision:** contract amendment. The engine is not edited. The removed clause "It must also open on an empty line" existed only in this plan. The design does not require it (§4.3, §5.3, and the tradeoff "template hosts restart HTML from its start state after a server block"). The observable outcome is the same: an empty line has no tokens either way, and in both cases the next nonempty line tokenizes HTML from `htmlLanguage.startState()`. Only the empty line's intermediate end-of-line state string differs. That is acceptable because IncrementalHighlighter compares states only for checkpoint reuse. No design revision is needed.
- **Replacement contract (additive, testable):**
  - An empty line in `root` → no tokens, no throw, and the returned state equals the incoming `root` state.
  - An empty line while the HTML embed is already open → state unchanged (the embed key is preserved).
  - The next nonempty HTML line → its HTML tags are `tag`, the same as with no empty line.
- **writePaths:** unchanged. `src/language/grammar.ts` is NOT authorized; it remains P01-owned and unedited.
- **Resume:** the existing `test/language/langs/templates.test.ts` case "handles empty HTML lines" covers the replacement contract. If that test does not already assert that the empty line's returned state equals the incoming state, add that assertion to the same file. Rerun the P08 verification commands. In the progress log, record this amendment and the exit codes, and clear the blocker.
