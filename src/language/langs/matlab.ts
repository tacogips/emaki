import { compileGrammar } from '../grammar';
export const matlabLanguage = compileGrammar({ name: 'matlab', states: {
  root: [
    { match: /^\s*%\{\s*$/, tag: 'comment', push: 'comment' }, { match: /%.*/, tag: 'comment' },
    { match: /(?<=[\w)\]])\s*(')/, tag: ['operator'] },
    { match: /'(?:''|[^'])*'/, tag: 'string' }, { match: /"(?:""|[^"])*"/, tag: 'string' },
    { match: /\b(?:function|end|if|else|elseif|for|while|switch|case|otherwise|return)\b/, tag: 'keyword' },
    { match: /\b\d+(?:\.\d+)?\b/, tag: 'number' }, { match: /[=+*\/-]+/, tag: 'operator' },
  ], comment: [{ match: /^\s*%\}\s*$/, tag: 'comment', pop: true }, { match: /./u, tag: 'comment' }],
} });
