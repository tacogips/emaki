import { compileGrammar, type Rule } from '../grammar';

const common: Rule[] = [
  { match: /\/\*/, tag: 'comment', push: 'comment' },
  { match: /@[\w-]+/, tag: 'keyword' },
  { match: /[.#][\w-]+/, tag: 'attribute' },
  { match: /[a-z][\w-]*/i, tag: 'tag' },
  { match: /\{/, tag: 'punctuation', push: 'block' },
];
export const cssLanguage = compileGrammar({
  name: 'css',
  states: {
    root: common,
    block: [
      { match: /\}/, tag: 'punctuation', pop: true },
      { match: /([\w-]+)(\s*:)/, tag: ['property', 'punctuation'], push: 'value' },
      ...common,
    ],
    value: [
      { match: /(?=\})/, pop: true },
      { match: /;/, tag: 'punctuation', pop: true },
      { match: /\/\*/, tag: 'comment', push: 'comment' },
      { match: /![\w-]+/, tag: 'keyword' },
      { match: /#[\da-f]{3,8}\b/i, tag: 'constant' },
      { match: /\b\d+(?:\.\d+)?(?:[a-z%]+)?/i, tag: 'number' },
      { match: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/, tag: 'string' },
    ],
    comment: [{ match: /\*\//, tag: 'comment', pop: true }, { match: /./, tag: 'comment' }],
  },
});
