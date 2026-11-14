// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { javaLanguage } from '../../../src/language/langs/java';
import { groovyLanguage } from '../../../src/language/langs/groovy';
import { scalaLanguage } from '../../../src/language/langs/scala';
import { kotlinLanguage } from '../../../src/language/langs/kotlin';
import { protobufLanguage } from '../../../src/language/langs/protobuf';
import { graphqlLanguage } from '../../../src/language/langs/graphql';
import { dotLanguage } from '../../../src/language/langs/dot';
import { propertiesLanguage } from '../../../src/language/langs/properties';
import { iniLanguage } from '../../../src/language/langs/ini';
import { tomlLanguage } from '../../../src/language/langs/toml';
import { hclLanguage } from '../../../src/language/langs/hcl';
import { jvmConfigExpectations } from '../expectations/jvm-config';
import { checkFixture, readFixture } from '../support/fixture-check';

const languages = [javaLanguage, groovyLanguage, scalaLanguage, kotlinLanguage, protobufLanguage, graphqlLanguage, dotLanguage, propertiesLanguage, iniLanguage, tomlLanguage, hclLanguage];
describe('JVM and configuration languages', () => {
  jvmConfigExpectations.forEach((exp, index) => {
    it(exp.id, async () => { checkFixture(languages[index]!, await readFixture(`${exp.id}.${exp.ext}`), exp); });
  });
  it('maintains multiline states and restores root', () => {
    const lines = (lang: typeof javaLanguage, input: string[]) => { let state = lang.startState(); return input.map(text => { const result = lang.tokenizeLine(text, state); state = result.state; return result; }); };
    const doc = lines(javaLanguage, ['/** ', ' * @return y', ' */']);
    expect(doc[1]!.tokens.some(t => t.tag === 'meta')).toBe(true);
    expect(doc[2]!.tokens.some(t => t.tag === 'comment')).toBe(true);
    const prop = lines(propertiesLanguage, ['a=one \\', '  two']);
    expect(prop[1]!.tokens.some(t => t.tag === 'string')).toBe(true);
    const hcl = lines(hclLanguage, ['<<EOF', 'body', 'EOF', '}']);
    expect(hcl[1]!.tokens.some(t => t.tag === 'string')).toBe(true);
    expect(hcl[3]!.tokens.some(t => t.tag === 'punctuation')).toBe(true);
    const toml = lines(tomlLanguage, ['key = """', 'x', '"""']);
    expect(toml[1]!.tokens.some(t => t.tag === 'string')).toBe(true);
  });
});
