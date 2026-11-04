# P02 `syntax-p02-lang-c-family`: C-family and systems languages

- **Wave:** 2
- **dependsOn:** P01
- **Design:** §5.4, §6, §7 rows 2, 8–10, 13, 17, 45, 46, 49, 65, 76, 80
- **writePaths:**
  - `src/language/langs/c.ts`
  - `src/language/langs/cpp.ts`
  - `src/language/langs/csharp.ts`
  - `src/language/langs/objc.ts`
  - `src/language/langs/objcpp.ts`
  - `src/language/langs/d.ts`
  - `src/language/langs/go.ts`
  - `src/language/langs/rust.ts`
  - `src/language/langs/zig.ts`
  - `src/language/langs/swift.ts`
  - `src/language/langs/pascal.ts`
  - `src/language/langs/actionscript.ts`
  - fixtures:
    - `test/fixtures/languages/c.c`
    - `test/fixtures/languages/cpp.cpp`
    - `test/fixtures/languages/csharp.cs`
    - `test/fixtures/languages/objc.m`
    - `test/fixtures/languages/objcpp.mm`
    - `test/fixtures/languages/d.d`
    - `test/fixtures/languages/go.go`
    - `test/fixtures/languages/rust.rs`
    - `test/fixtures/languages/zig.zig`
    - `test/fixtures/languages/swift.swift`
    - `test/fixtures/languages/pascal.pas`
    - `test/fixtures/languages/actionscript.as`
  - `test/language/expectations/c-family.ts` (exports `cFamilyExpectations`)
  - `test/language/langs/c-family.test.ts`
  - `impl-plans/progress/syntax-p02-lang-c-family.md`
- **sharedPaths:** none

## Intent

Real-token highlighting for 12 chilla-covered languages through `cLike`. Swift is written fresh: do not consult or copy chilla's grammar.

Follow the "Common procedure for language group plans" in `syntax-00-overview.md`.

## Non-goals

- Semantic or type resolution.
- Preprocessor expression parsing.
- No registry metadata (P09 handles it).

## Per-language key points (each **(expect)** item becomes a snippet expectation)

**c**

- `#include <stdio.h>` → the directive is `meta` **(expect)**, and `<stdio.h>` is `string`.
- `/* multi-line */` comment spanning 2 lines **(expect)**.
- `'\n'` char → `string` with an inner `escape`.
- `0x1Fu` → `number`.

**cpp**

- Extends the C keywords with `class`, `template`, `namespace`, `constexpr` and more.
- Raw string `R"x(...)x"` across lines **(expect)**. The delimiter is carried in the state name, sanitized to `[\w]` (`rawx`).
- `std::` is `type` only when listed.

**csharp**

- Verbatim `@"a""b"` (doubled quote is not the end) **(expect)**.
- Interpolated `$"{x}"` → `string`, with braces as `punctuation`.
- `///` doc comment → `comment`.
- `#region` → `meta`.

**objc / objcpp**

- `@interface`/`@end`/`@property` → `keyword` **(expect)**.
- `@"str"` → `string`.
- objcpp is the objc keyword set plus the cpp keywords.

**d**

- Nested `/+ /+ +/ +/` comments **(expect)**.
- Backtick wysiwyg strings.

**go**

- Raw backtick string across lines **(expect)**.
- `func name(` → `function`.
- `:=` → `operator`.

**rust**

- Lifetime `'a` → `type` **(expect)**, and it is not a char literal. Pitfall: `'a'` is a char, while `'a` followed by a non-quote is a lifetime.
- `r#"..."#` raw strings with hash count, multiline **(expect)**.
- Nested block comments.
- `macro!` → `function`.
- `#[derive]` → `meta`.

**zig**

- `@import` builtins → `function` **(expect)**.
- `\\` multiline string lines → `string`.
- `//!` doc comments.

**swift**

- `"""` multiline string **(expect)**.
- `#if` → `meta`.
- Nested comments.
- `@objc` attribute → `meta`.

**pascal**

- Case-insensitive keywords: `BEGIN` and `begin` are both `keyword` **(expect)**.
- Comments `{ }`, `(* *)` and `//` **(expect `{ c }`)**.
- `'it''s'` string.

**actionscript**

- `function`, `var`, `package`, `class` → `keyword`.
- Regex-free; strings and numbers.

## Tests (`input -> expected`), in `c-family.test.ts` in addition to `checkFixture`

- rust `fn f<'a>(x: &'a str) -> char { 'z' }`: both `'a` → `type`, and `'z'` → `string`.
- rust line 1 `let s = r#"a` and line 2 `"# ;` → line 2's `"#` is still `string`, and `;` is not `string`.
- cpp `R"d(` … `)d"` across 3 lines: the middle line is entirely `string`.
- pascal `End.` → `End` is `keyword`.
- go: after the raw string closes on line 2, `func` on line 3 is `keyword`.

## Verification and done

Per the overview's common procedure, with `<group>` = `c-family` and `<planId>` = `syntax-p02-lang-c-family`.
