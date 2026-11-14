import { compileGrammar } from '../grammar';
import { cLike } from '../families/c-like';

export const hclLanguage = compileGrammar(cLike({
  name: 'hcl',
  keywords: ["resource", "variable", "output", "provider", "data", "locals", "module", "terraform"],
  extra: { root: [{ match: /(?:s)?"/, tag: 'string', push: 'template' }, { match: /<<-?([A-Za-z_]\w*)/, tag: 'punctuation', embed: { language: () => undefined, end: arg => new RegExp('^\\s*' + arg + '\\s*$'), endArg: m => m[1] ?? '' } }, { match: /[{}()[\],;:.]/, tag: 'punctuation' }, { match: /#.*/, tag: 'comment' }], states: {template: [{ match: /\$\{/, tag: 'punctuation', push: 'interpolation' }, { match: /(\$)([A-Za-z_]\w*)/, tag: ['punctuation', 'variable'] }, { match: /\\./, tag: 'escape' }, { match: /"/, tag: 'string', pop: true }, { match: /./, tag: 'string' }], interpolation: [{ match: /}/, tag: 'punctuation', pop: true }, { match: /[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*/, tag: 'variable' }, { match: /./, tag: 'operator' }]} }
}));
