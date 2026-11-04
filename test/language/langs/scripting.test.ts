// @vitest-environment node
import { describe, it, expect } from 'vitest';
import type { LineLanguage } from '../../../src/types';
import { checkFixture, readFixture } from '../support/fixture-check';
import { scriptingExpectations } from '../expectations/scripting';
import { pythonLanguage } from '../../../src/language/langs/python';
import { rubyLanguage } from '../../../src/language/langs/ruby';
import { perlLanguage } from '../../../src/language/langs/perl';
import { luaLanguage } from '../../../src/language/langs/lua';
import { rLanguage } from '../../../src/language/langs/r';
import { tclLanguage } from '../../../src/language/langs/tcl';
import { bashLanguage } from '../../../src/language/langs/bash';
import { fishLanguage } from '../../../src/language/langs/fish';
import { batchLanguage } from '../../../src/language/langs/batch';
import { applescriptLanguage } from '../../../src/language/langs/applescript';
import { makefileLanguage } from '../../../src/language/langs/makefile';
import { dockerfileLanguage } from '../../../src/language/langs/dockerfile';
import { sqlLanguage } from '../../../src/language/langs/sql';
import { regexpLanguage } from '../../../src/language/langs/regexp';
const languages: Record<string, LineLanguage<string>> = { python: pythonLanguage, ruby: rubyLanguage, perl: perlLanguage, lua: luaLanguage, r: rLanguage, tcl: tclLanguage, bash: bashLanguage, fish: fishLanguage, batch: batchLanguage, applescript: applescriptLanguage, makefile: makefileLanguage, dockerfile: dockerfileLanguage, sql: sqlLanguage, regexp: regexpLanguage };

describe('scripting fixtures', () => {
  for (const expectation of scriptingExpectations) it(expectation.id, async () => {
    checkFixture(languages[expectation.id]!, await readFixture(`${expectation.id}.${expectation.ext}`), expectation);
  });
  const lines = (language: LineLanguage<string>, input: string[]) => {
    let state = language.startState();
    return input.map(text => { const result = language.tokenizeLine(text, state); state = result.state; return result.tokens; });
  };
  const tagged = (text: string, tokens: readonly {from: number; to: number; tag: string}[], snippet: string, tag: string) => {
    const at = text.indexOf(snippet); expect(at).toBeGreaterThanOrEqual(0);
    expect(tokens.some(t => t.tag === tag && t.from <= at && t.to >= at + snippet.length)).toBe(true);
  };
  it('handles Python multiline strings and returns to code', () => {
    const input = ['x = """a', 'b', '"""; y = 1']; const result = lines(pythonLanguage, input);
    tagged(input[1]!, result[1]!, 'b', 'string'); tagged(input[2]!, result[2]!, '1', 'number');
  });
  it('embeds bash across Docker continuations and closes at end of line', () => {
    const input = ['RUN apt-get update && \\', '    echo hi', 'COPY a b']; const result = lines(dockerfileLanguage, input);
    tagged(input[1]!, result[1]!, 'echo', 'function'); tagged(input[2]!, result[2]!, 'COPY', 'keyword');
  });
  it('ends bash heredocs before subsequent commands', () => {
    const input = ['cat <<EOF', '$x', 'EOF', 'echo']; const result = lines(bashLanguage, input);
    tagged(input[3]!, result[3]!, 'echo', 'function');
  });
  it('retains the Lua long-comment delimiter level', () => {
    const input = ['--[==[', ']]', ']==]', 'x=1']; const result = lines(luaLanguage, input);
    tagged(input[1]!, result[1]!, ']]', 'comment'); tagged(input[3]!, result[3]!, '1', 'number');
  });
  it('resumes Ruby after a heredoc', () => {
    const input = ['value = <<~EOS', 'body', 'EOS', 'end']; const result = lines(rubyLanguage, input);
    tagged(input[1]!, result[1]!, 'body', 'string'); tagged(input[3]!, result[3]!, 'end', 'keyword');
  });
  it('limits Tcl comments to command starts', () => {
    const input = ['set value #literal; # comment']; const result = lines(tclLanguage, input);
    tagged(input[0]!, result[0]!, '# comment', 'comment');
    expect(result[0]!.some(t => t.tag === 'comment' && t.from <= input[0]!.indexOf('#literal'))).toBe(false);
  });
  it('recognizes lower-case Docker instructions', () => {
    const input = ['from alpine']; const result = lines(dockerfileLanguage, input);
    tagged(input[0]!, result[0]!, 'from', 'keyword');
  });
});
