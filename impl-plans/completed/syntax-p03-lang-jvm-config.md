# P03 `syntax-p03-lang-jvm-config`: JVM, schema and config languages

- **Wave:** 2
- **dependsOn:** P01
- **Design:** §5.4, §6, §7 rows 18, 19, 24–26, 67, 78, 81–85
- **writePaths:**
  - `src/language/langs/java.ts`
  - `src/language/langs/groovy.ts`
  - `src/language/langs/scala.ts`
  - `src/language/langs/kotlin.ts`
  - `src/language/langs/protobuf.ts`
  - `src/language/langs/graphql.ts`
  - `src/language/langs/dot.ts`
  - `src/language/langs/properties.ts`
  - `src/language/langs/ini.ts`
  - `src/language/langs/toml.ts`
  - `src/language/langs/hcl.ts`
  - fixtures:
    - `test/fixtures/languages/java.java`
    - `test/fixtures/languages/groovy.groovy`
    - `test/fixtures/languages/scala.scala`
    - `test/fixtures/languages/kotlin.kt`
    - `test/fixtures/languages/protobuf.proto`
    - `test/fixtures/languages/graphql.graphql`
    - `test/fixtures/languages/dot.dot`
    - `test/fixtures/languages/properties.properties`
    - `test/fixtures/languages/ini.ini`
    - `test/fixtures/languages/toml.toml`
    - `test/fixtures/languages/hcl.tf`
  - `test/language/expectations/jvm-config.ts` (exports `jvmConfigExpectations`)
  - `test/language/langs/jvm-config.test.ts`
  - `impl-plans/progress/syntax-p03-lang-jvm-config.md`
- **sharedPaths:** none

## Intent

Real tokens for 11 chilla-covered languages. java is also the inner language for P08's jsp, so it **must** export `javaLanguage` exactly.

Follow the "Common procedure for language group plans" in `syntax-00-overview.md`.

## Non-goals

- No Gradle DSL semantics.
- No GraphQL schema validation.
- No Terraform provider awareness.

## Key points

**java** (`cLike`, `docComments: true`)

- `/** @param x */` → `@param` is `meta` **(expect, chilla row 25 JavaDoc obligation)**.
- `@Override` → `meta`.
- Text blocks `"""` multiline.

**groovy**

- GString `"${x}"`.
- Slashy strings are not required.
- `def` → `keyword`.

**scala**

- `def`, `val`, `case class`.
- Triple-quoted strings.
- `s"..."` interpolator.

**kotlin**

- `fun` → `keyword` **(expect)**.
- String templates `"$x ${y}"` → `string` with `punctuation`/`variable` for the template parts.
- `"""` raw strings.
- Nested comments.

**protobuf**

- `syntax = "proto3";`.
- `message` and `enum` → `keyword` **(expect)**.
- Scalar types (`int32`, `string`, …) → `type`.
- Field number `= 1` → `number`.

**graphql**

- `#` comments.
- `"""` block strings across lines **(expect)**.
- `query`, `type`, `fragment` → `keyword`.
- `$var` → `variable`.
- `@directive` → `meta`.

**dot**

- `digraph`, `node`, `edge`, `subgraph` → `keyword`.
- `->`/`--` → `operator` **(expect `->`)**.
- `//`, `/* */` and `#` comments.

**properties** (`iniLike`)

- `#` and `!` comments.
- `key=value` and `key: value`.
- A trailing `\` continues the value to the next line **(expect a continuation line's value tagged `string`)**.

**ini** (`iniLike`)

- `[section]` → `type` **(expect)**.
- `;` and `#` comments.

**toml** (`iniLike` plus extras)

- `[[array.table]]` → `type` **(expect)**.
- `"""`/`'''` multiline strings.
- `1979-05-27T07:32:00Z` → `number`.
- `true` → `constant`.

**hcl**

- `resource "a" "b" {` → `resource` is `keyword`.
- `${var.x}` interpolation inside strings → `punctuation` and `variable`.
- `<<EOF` heredoc until `EOF` **(expect a heredoc body line → `string`)**.
- `#`, `//` and `/* */` comments.

## Tests (`input -> expected`)

- java `/** \n * @return y\n */`: line 2's `@return` → `meta`, and line 3 is `comment`.
- properties `a=one \` then `  two`: line 2's `two` → `string`.
- hcl heredoc closes at `EOF` alone on its line, and the next line's `}` → `punctuation`.
- toml `key = """` / `x` / `"""`: the middle line is `string`.

## Verification and done

Per the common procedure, with `<group>` = `jvm-config`.
