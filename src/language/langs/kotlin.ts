import { compileGrammar } from '../grammar';
import { cLike } from '../families/c-like';

export const kotlinLanguage = compileGrammar(cLike({
  name: 'kotlin',
  keywords: ["fun", "val", "var", "class", "object", "return", "if", "else", "when", "package"],
  nestedComments: true,
  extra: { root: [{ match: /"""/, tag: 'string', push: 'triple' }, { match: /(?:s)?"/, tag: 'string', push: 'template' }, { match: /[{}()[\],;:.]/, tag: 'punctuation' }], states: {triple: [{ match: /"""/, tag: 'string', pop: true }, { match: /./, tag: 'string' }], template: [{ match: /\$\{/, tag: 'punctuation', push: 'interpolation' }, { match: /(\$)([A-Za-z_]\w*)/, tag: ['punctuation', 'variable'] }, { match: /\\./, tag: 'escape' }, { match: /"/, tag: 'string', pop: true }, { match: /./, tag: 'string' }], interpolation: [{ match: /}/, tag: 'punctuation', pop: true }, { match: /[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*/, tag: 'variable' }, { match: /./, tag: 'operator' }]} }
}));
