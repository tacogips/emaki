// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { checkFixture, readFixture } from '../support/fixture-check';
import { cFamilyExpectations } from '../expectations/c-family';
import { cLanguage } from '../../../src/language/langs/c';
import { cppLanguage } from '../../../src/language/langs/cpp';
import { csharpLanguage } from '../../../src/language/langs/csharp';
import { objcLanguage } from '../../../src/language/langs/objc';
import { objcppLanguage } from '../../../src/language/langs/objcpp';
import { dLanguage } from '../../../src/language/langs/d';
import { goLanguage } from '../../../src/language/langs/go';
import { rustLanguage } from '../../../src/language/langs/rust';
import { zigLanguage } from '../../../src/language/langs/zig';
import { swiftLanguage } from '../../../src/language/langs/swift';
import { pascalLanguage } from '../../../src/language/langs/pascal';
import { actionscriptLanguage } from '../../../src/language/langs/actionscript';
const languages = { c: cLanguage, cpp: cppLanguage, csharp: csharpLanguage, objc: objcLanguage, objcpp: objcppLanguage, d: dLanguage, go: goLanguage, rust: rustLanguage, zig: zigLanguage, swift: swiftLanguage, pascal: pascalLanguage, actionscript: actionscriptLanguage };

describe('C family fixtures', () => {
  for (const exp of cFamilyExpectations) it(exp.id, async () => {
    const language = languages[exp.id as keyof typeof languages];
    expect(language.name).toBe(exp.id);
    checkFixture(language, await readFixture(`${exp.id}.${exp.ext}`), exp);
  });
  it('does not treat C comparisons as strings', () => {
    const line = 'if (a < b && c > d) return 1;';
    const tokens = cLanguage.tokenizeLine(line, cLanguage.startState()).tokens;
    expect(tokens.some(t => t.tag === 'string')).toBe(false);
    const at = line.indexOf('return');
    expect(tokens.some(t => t.tag === 'keyword' && t.from <= at && t.to >= at + 6)).toBe(true);
  });
  it('highlights C++ template keywords and include headers', () => {
    const line = 'template <typename T>';
    const tokens = cppLanguage.tokenizeLine(line, cppLanguage.startState()).tokens;
    const at = line.indexOf('typename');
    expect(tokens.some(t => t.tag === 'keyword' && t.from <= at && t.to >= at + 8)).toBe(true);
    expect(tokens.some(t => t.tag === 'string' && t.from <= at && t.to > at)).toBe(false);
    for (const language of [cLanguage, cppLanguage]) {
      const include = '#include <stdio.h>';
      const result = language.tokenizeLine(include, language.startState()).tokens;
      expect(result).toContainEqual({ from: 0, to: 8, tag: 'meta' });
      expect(result).toContainEqual({ from: 9, to: 18, tag: 'string' });
    }
  });
  it('distinguishes Rust lifetimes and characters', () => {
    const line = "fn f<'a>(x: &'a str) -> char { 'z' }";
    const tokens = rustLanguage.tokenizeLine(line, rustLanguage.startState()).tokens;
    for (const at of [line.indexOf("'a"), line.lastIndexOf("'a")]) expect(tokens.some(t => t.from <= at && t.to >= at + 2 && t.tag === 'type')).toBe(true);
    const at = line.indexOf("'z'"); expect(tokens.some(t => t.from <= at && t.to >= at + 3 && t.tag === 'string')).toBe(true);
  });
  it('closes Rust raw strings', () => {
    const first = rustLanguage.tokenizeLine('let s = r#"a', rustLanguage.startState());
    const second = rustLanguage.tokenizeLine('"# ;', first.state);
    expect(second.tokens.some(t => t.from === 0 && t.to === 2 && t.tag === 'string')).toBe(true);
    expect(second.tokens.some(t => t.from <= 3 && t.to > 3 && t.tag === 'string')).toBe(false);
  });
  it('keeps C++ raw strings through three lines', () => {
    const first = cppLanguage.tokenizeLine('R"d(', cppLanguage.startState());
    const second = cppLanguage.tokenizeLine('middle', first.state);
    expect(second.tokens).toEqual([{ from: 0, to: 6, tag: 'string' }]);
    expect(cppLanguage.tokenizeLine(')d"', second.state).state).toBe(cppLanguage.startState());
  });
  it('recognizes Pascal mixed case and resumes Go after raw text', () => {
    expect(pascalLanguage.tokenizeLine('End.', pascalLanguage.startState()).tokens[0]).toMatchObject({from: 0, to: 3, tag: 'keyword'});
    const a = goLanguage.tokenizeLine('`start', goLanguage.startState());
    const b = goLanguage.tokenizeLine('end`', a.state);
    expect(goLanguage.tokenizeLine('func f()', b.state).tokens[0]).toMatchObject({from: 0, to: 4, tag: 'keyword'});
  });
});
