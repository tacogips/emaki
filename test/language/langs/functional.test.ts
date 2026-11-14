// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { haskellLanguage } from '../../../src/language/langs/haskell';
import { ocamlLanguage } from '../../../src/language/langs/ocaml';
import { erlangLanguage } from '../../../src/language/langs/erlang';
import { clojureLanguage } from '../../../src/language/langs/clojure';
import { lispLanguage } from '../../../src/language/langs/lisp';
import { nixLanguage } from '../../../src/language/langs/nix';
import { matlabLanguage } from '../../../src/language/langs/matlab';
import { functionalExpectations } from '../expectations/functional';
import { checkFixture, readFixture, tokenizeDoc } from '../support/fixture-check';
const languages = [haskellLanguage, ocamlLanguage, erlangLanguage, clojureLanguage, lispLanguage, nixLanguage, matlabLanguage];
describe('functional languages', () => {
  for (const [i, language] of languages.entries()) {
    const exp = functionalExpectations[i]!;
    it(exp.id, async () => { expect(language.name).toBe(exp.id); checkFixture(language, await readFixture(`${exp.id}.${exp.ext}`), exp); });
  }
  it('restores state after nested comments', () => {
    for (const [language, text] of [[haskellLanguage, '{- a {- b -} c -}\nx = 1'], [ocamlLanguage, '(* a (* b *) c *)\nx = 1']] as const) {
      const tokens = tokenizeDoc(language, text);
      expect(tokens.some(t => t.tag === 'number' && text.slice(t.from, t.to) === '1')).toBe(true);
    }
  });
  it('distinguishes transpose from string', () => {
    const text = "a = b';\ns = 'hi';\nx'";
    const tokens = tokenizeDoc(matlabLanguage, text);
    expect(tokens.filter(t => t.tag === 'operator' && text.slice(t.from, t.to) === "'")).toHaveLength(2);
    expect(tokens.some(t => t.tag === 'string' && text.slice(t.from, t.to) === "'hi'")).toBe(true);
  });
  it('continues Nix indented strings around interpolation', () => {
    const text = "''\n  ${pkgs.x} y\n'';";
    const tokens = tokenizeDoc(nixLanguage, text);
    for (const [part, tag] of [['pkgs.x', 'variable'], [' y', 'string'], ['${', 'punctuation'], ['}', 'punctuation']] as const) {
      const at = text.indexOf(part); expect(tokens.some(t => t.tag === tag && t.from <= at && t.to >= at + part.length)).toBe(true);
    }
  });
});
