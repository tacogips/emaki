// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { languages, loadLanguage } from '../../src/language/registry';
import { cFamilyExpectations } from './expectations/c-family';
import { docsMarkupExpectations } from './expectations/docs-markup';
import { functionalExpectations } from './expectations/functional';
import { jvmConfigExpectations } from './expectations/jvm-config';
import { scriptingExpectations } from './expectations/scripting';
import { templatesExpectations } from './expectations/templates';
import { webExpectations, nantExpectation } from './expectations/web';
import { checkFixture, readFixture } from './support/fixture-check';
const expectations = [...cFamilyExpectations,...docsMarkupExpectations,...functionalExpectations,...jvmConfigExpectations,...scriptingExpectations,...templatesExpectations,...webExpectations];
describe('all language fixtures', () => {
  it('has exactly one expectation for every module', () => {
    const missing = languages.filter(x => x.id !== 'plaintext' && expectations.filter(e => e.id === x.id).length !== 1).map(x => x.id);
    expect(missing, `missing or duplicate: ${missing.join(', ')}`).toEqual([]); expect(languages).toHaveLength(71);
  });
  for (const info of languages.filter(x => x.id !== 'plaintext')) it(info.id, async () => {
    const exp = expectations.find(x => x.id === info.id); expect(exp).toBeDefined();
    checkFixture(await loadLanguage(info.id), await readFixture(`${info.id}.${exp!.ext}`), exp!);
  });
  it('plaintext has no tokens', async () => { const lang = await loadLanguage('plaintext'); expect(lang.tokenizeLine('anything', lang.startState()).tokens).toEqual([]); });
  it('checks the NAnt alias fixture', async () => checkFixture(await loadLanguage('nant'), await readFixture('nant.build'), nantExpectation));
});
