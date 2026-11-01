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
  3. a **zero-length** match (`/(?:)/`) whose `embed` is `htmlLanguage`, ending at `o.open`. P01 allows zero-length matches that change state, so this rule is valid. It must also open on an empty line.
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
