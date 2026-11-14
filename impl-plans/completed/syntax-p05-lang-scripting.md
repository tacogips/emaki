# P05 `syntax-p05-lang-scripting`: scripting, shell, build and query languages

- **Wave:** 2
- **dependsOn:** P01
- **Design:** §5.4, §6, §7 rows 3, 6, 37, 50, 51, 54, 61, 63, 66, 68–70, 72, 79, §8 (fish)
- **writePaths:**
  - `src/language/langs/python.ts`
  - `src/language/langs/ruby.ts`
  - `src/language/langs/perl.ts`
  - `src/language/langs/lua.ts`
  - `src/language/langs/r.ts`
  - `src/language/langs/tcl.ts`
  - `src/language/langs/bash.ts`
  - `src/language/langs/fish.ts`
  - `src/language/langs/batch.ts`
  - `src/language/langs/applescript.ts`
  - `src/language/langs/makefile.ts`
  - `src/language/langs/dockerfile.ts`
  - `src/language/langs/sql.ts`
  - `src/language/langs/regexp.ts`
  - fixtures:
    - `test/fixtures/languages/python.py`
    - `test/fixtures/languages/ruby.rb`
    - `test/fixtures/languages/perl.pl`
    - `test/fixtures/languages/lua.lua`
    - `test/fixtures/languages/r.r`
    - `test/fixtures/languages/tcl.tcl`
    - `test/fixtures/languages/bash.sh`
    - `test/fixtures/languages/fish.fish`
    - `test/fixtures/languages/batch.bat`
    - `test/fixtures/languages/applescript.applescript`
    - `test/fixtures/languages/makefile.mk`
    - `test/fixtures/languages/dockerfile.dockerfile`
    - `test/fixtures/languages/sql.sql`
    - `test/fixtures/languages/regexp.re`
  - `test/language/expectations/scripting.ts` (exports `scriptingExpectations`)
  - `test/language/langs/scripting.test.ts`
  - `impl-plans/progress/syntax-p05-lang-scripting.md`
- **sharedPaths:** none

## Intent

14 languages. Of these, ruby and tcl are the inner languages for P08 (erb, tcl-html), and bash is the inner language for dockerfile. Exports must be exactly `<camelId>Language`.

Follow the "Common procedure for language group plans" in `syntax-00-overview.md`.

## Non-goals

- No Python regex sub-highlighting inside strings (chilla row 52 is excluded).
- No Perl format blocks.
- No SQL dialect differences.

## Key points

**python**

- `"""` / `'''` multiline strings **(expect a middle line → `string`)**.
- Prefixes `f`, `r`, `b`, `rb` on strings.
- `@decorator` → `meta`.
- `def name(` → `name` is `function`.
- `True`/`None` → `constant`.

**ruby**

- `:sym` → `constant`.
- `/re/` regex after an operator → `regexp`.
- `=begin`…`=end` (at column 0) block comment **(expect)**.
- Heredoc `<<~EOS` … `EOS`.
- `%w[a b]` → `string`.

**perl**

- `$x`, `@a`, `%h` → `variable`.
- `m/../`, `s/../../` and `qr//` → `regexp`.
- `=pod`…`=cut` → `comment` **(expect)**.

**lua**

- `--[[ ]]` and `--[==[ ]==]` long comments **(expect)**. The level is carried in the state name, e.g. `lcomment2`.
- `[[ ]]` long strings.

**r**

- `<-` → `operator` **(expect)**.
- `function` → `keyword`.
- `#` comment.
- `TRUE`/`NA` → `constant`.

**tcl**

- `proc` and `set` → `keyword`.
- `$var` → `variable`.
- `#` comment only at command start (start of line or after `;`).
- `"…"` strings.

**bash** (`shellLike`, heredoc on)

- `echo` → `function` **(expect, chilla row 70 obligation)**.
- `$HOME`/`${x}` → `variable`.
- `if`/`then`/`fi` → `keyword`.
- A heredoc spanning lines.

**fish** (`shellLike`)

- `function` … `end` and `set -l` → `keyword` **(expect `end`)**.
- `(cmd)` substitution.

**batch** (`shellLike`, case-insensitive)

- `REM` and `::` comments **(expect `REM …` → `comment`)**.
- `%VAR%` / `%%i` → `variable`.
- `:label` at line start → `function`.

**applescript**

- `--`, `#` and `(* *)` multiline comments.
- `tell`, `end tell`, `set`, `to` → `keyword`.

**makefile**

- `target:` at line start → `function` **(expect)**.
- `$(VAR)` / `${VAR}` → `variable`.
- `#` comment.
- `ifeq`, `include` and `.PHONY` → `keyword`/`meta`.

**dockerfile**

- Instructions such as `FROM`, `RUN` and `COPY` are case-insensitive `keyword` **(expect)**.
- The rest of a `RUN` line embeds `bashLanguage`, ending at `/(?<!\\)$/` (end of a line not ending in a backslash). A `\` continuation keeps bash going on the next line **(expect a bash builtin on the continuation line → `function`)**.
- `#` comment.
- Pitfall: the zero-length end at end of line must close the embed on that line. Test it.

**sql**

- Case-insensitive keywords (`SELECT`/`select`) **(expect)**.
- `--` and `/* */` comments.
- `'it''s'` strings.
- `@param`/`:name` → `variable`.

**regexp** (standalone)

- Groups `(`, `(?:`, `)` → `punctuation`.
- Classes `[a-z]` → `constant`.
- Quantifiers `*+?{2,3}` → `operator` **(expect `{2,3}`)**.
- Escapes `\d` → `escape`.
- Anchors `^$\b` → `keyword`.
- `(?#comment)` → `comment`.
- `regexp` has no keywords-as-words, strings or numbers, so its `classes` are `['punctuation', 'operator', 'escape', 'constant', 'comment']`. Record this documented exception in the expectation's comment.

## Tests (`input -> expected`)

- python line 1 `x = """a`, line 2 `b`, line 3 `"""; y = 1` → line 2 is `string`, and line 3's `1` is `number`.
- dockerfile line 1 `RUN apt-get update && \`, line 2 `    echo hi`, line 3 `COPY a b` → line 2's `echo` is `function`, and line 3's `COPY` is `keyword`.
- bash heredoc `cat <<EOF` / `$x` / `EOF` / `echo` → line 4's `echo` is `function`.
- lua `--[==[` / `]]` / `]==]` / `x=1` → the `]]` line is `comment`, and the last line's `1` is `number`.

## Verification and done

Per the common procedure, with `<group>` = `scripting`.
