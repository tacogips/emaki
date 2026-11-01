# P06 `syntax-p06-lang-functional`: functional, Lisp-family, Nix and MATLAB

- **Wave:** 2
- **dependsOn:** P01
- **Design:** §5.4, §6, §7 rows 12, 15, 21, 34, 40, 41, 77
- **writePaths:**
  - `src/language/langs/haskell.ts`
  - `src/language/langs/ocaml.ts`
  - `src/language/langs/erlang.ts`
  - `src/language/langs/clojure.ts`
  - `src/language/langs/lisp.ts`
  - `src/language/langs/nix.ts`
  - `src/language/langs/matlab.ts`
  - fixtures:
    - `test/fixtures/languages/haskell.hs`
    - `test/fixtures/languages/ocaml.ml`
    - `test/fixtures/languages/erlang.erl`
    - `test/fixtures/languages/clojure.clj`
    - `test/fixtures/languages/lisp.lisp`
    - `test/fixtures/languages/nix.nix`
    - `test/fixtures/languages/matlab.m`
  - `test/language/expectations/functional.ts` (exports `functionalExpectations`)
  - `test/language/langs/functional.test.ts`
  - `impl-plans/progress/syntax-p06-lang-functional.md`
- **sharedPaths:** none

## Intent

7 languages. erlang is the inner language for P08's erlang-html. Nix is written fresh: do not consult or copy chilla's grammar.

Follow the "Common procedure for language group plans" in `syntax-00-overview.md`.

## Non-goals

- No layout-rule parsing.
- No Lisp reader macros beyond quoting.

## Key points

**haskell**

- `--` line comment and nested `{- {- -} -}` comments **(expect)**.
- Capitalized identifiers → `type`.
- `where`, `let`, `data` → `keyword`.
- `'c'` char vs `x'` primes: a `'` after an identifier character is part of the identifier.

**ocaml**

- Nested `(* (* *) *)` comments **(expect)**.
- `let`, `match`, `with` → `keyword`.
- `'a` type variable → `type`.
- Strings.

**erlang**

- `%` comment.
- `-module(x).` → `meta` **(expect)**.
- Atoms → `constant`.
- Capitalized identifiers → `variable`.
- `fun` and `end` → `keyword`.

**clojure** (`lispLike`)

- `defn` → `keyword` **(expect)**.
- `:kw` → `constant`.
- `;` comment.
- `#{}` → `punctuation`.

**lisp** (`lispLike`)

- `#| |#` block comment **(expect)**.
- `defun` → `keyword`.

**nix**

- `let`, `in`, `with`, `rec`, `inherit` → `keyword`.
- `''` multiline strings across lines, with `${…}` interpolation → `punctuation` and `variable` **(expect a middle line → `string`)**.
- `#` and `/* */` comments.
- Paths `./foo.nix` → `string`.

**matlab**

- `%` comment and a `%{` … `%}` block (alone on their lines) **(expect)**.
- `function` and `end` → `keyword`.
- `'` after an identifier, `)` or `]` is the transpose `operator`; otherwise it starts a `string` **(expect `x'` → `operator`)**.

## Tests (`input -> expected`)

- haskell `{- a {- b -} c -}` then `x = 1` on the next line → the next line's `1` is `number`.
- matlab `a = b';` → `'` is `operator`. `s = 'hi';` → `'hi'` is `string`.
- nix `''` / `  ${pkgs.x} y` / `'';` → line 2's `pkgs.x` is `variable`, and `y` is `string`.

## Verification and done

Per the common procedure, with `<group>` = `functional`.
