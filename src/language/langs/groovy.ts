import { compileGrammar } from '../grammar';
import { cLike } from '../families/c-like';

export const groovyLanguage = compileGrammar(cLike({
  name: 'groovy',
  keywords: ["def", "class", "return", "new", "if", "else", "public", "static", "void"],
  extra: { root: [{ match: /(?:s)?"/, tag: 'string', push: 'template' }, { match: /[{}()[\],;:.]/, tag: 'punctuation' }], states: {template: [{ match: /\$\{/, tag: 'punctuation', push: 'interpolation' }, { match: /(\$)([A-Za-z_]\w*)/, tag: ['punctuation', 'variable'] }, { match: /\\./, tag: 'escape' }, { match: /"/, tag: 'string', pop: true }, { match: /./, tag: 'string' }], interpolation: [{ match: /}/, tag: 'punctuation', pop: true }, { match: /[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*/, tag: 'variable' }, { match: /./, tag: 'operator' }]} }
}));
