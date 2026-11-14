import { compileGrammar, type GrammarDef, type Rule } from '../grammar';

export function jsGrammar(opts: { types: boolean; jsx: boolean }): GrammarDef {
  const comments: Rule[] = [{ match: /\/\/.*$/, tag: 'comment' }, { match: /\/\*/, tag: 'comment', push: 'comment' }];
  const values: Rule[] = [
    { match: /\b(?:return|typeof|case|do|else|in|of|new|delete|void|throw)\b/, tag: 'keyword', next: 'root' },
    { match: /\b(?:const|let|var|function|if|for|while|class|export|import|from|async|await|extends|default|this|true|false|null|undefined)\b/, tag: 'keyword' },
    ...(opts.types ? [{ match: /\b(?:interface|type|enum|satisfies|declare|readonly|as)\b/, tag: 'keyword' as const }, { match: /\b(?:string|number|boolean|unknown|never)\b/, tag: 'type' as const }] : []),
    { match: /\b(?:0[bBoOxX][\da-fA-F_]+|\d[\d_]*(?:\.\d[\d_]*)?)(?:n)?\b/, tag: 'number', next: 'rootAfterValue' },
    { match: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/, tag: 'string', next: 'rootAfterValue' },
    { match: /`/, tag: 'string', push: 'template' },
    { match: /[a-zA-Z_$][\w$]*/, next: 'rootAfterValue' },
    { match: /[)\]]/, tag: 'punctuation', next: 'rootAfterValue' },
    ...(opts.types ? [{ match: /[<>]/, tag: 'punctuation' as const, next: 'root' }] : []),
    { match: /[({\[,;:!?=+*%&|^~<>-]/, tag: 'operator', next: 'root' },
  ];
  const jsx: Rule[] = opts.jsx ? [{ match: /<>/, tag: 'tag', push: 'jsxText' }, { match: /<\/?[A-Za-z][\w.:-]*/, tag: 'tag', push: 'jsxTag' }] : [];
  const expr: Rule[] = [...comments, ...jsx, { match: /\/(?![/*])(?:\\.|\[(?:\\.|[^\]\\])*\]|[^/\n\\])+\/[a-z]*/i, tag: 'regexp', next: 'rootAfterValue' }, ...values];
  const after: Rule[] = [{ match: /^/, next: 'root' }, ...comments, { match: /\//, tag: 'operator', next: 'root' }, ...values];
  const nested = (rules: Rule[], state: string): Rule[] => rules.map(r => ({ ...r, ...(r.next ? { next: r.next === 'rootAfterValue' ? `${state}AfterValue` : state } : {}) }));
  const nestedStates = (state: string): Record<string, Rule[]> => ({
    [state]: [{ match: /\}/, tag: 'punctuation', pop: true }, { match: /\{/, tag: 'punctuation', push: 'brace' }, ...nested(expr, state)],
    [`${state}AfterValue`]: [{ match: /\}/, tag: 'punctuation', pop: true }, { match: /\{/, tag: 'punctuation', push: 'brace' }, ...nested(after, state)],
  });
  return { name: 'javascript', states: {
    root: expr, rootAfterValue: after,
    comment: [{ match: /\*\//, tag: 'comment', pop: true }, { match: /./, tag: 'comment' }],
    template: [{ match: /`/, tag: 'string', pop: true, next: 'rootAfterValue' }, { match: /\$\{/, tag: 'punctuation', push: 'tplExpr' }, { match: /\\./, tag: 'escape' }, { match: /./, tag: 'string' }],
    ...nestedStates('tplExpr'),
    ...nestedStates('brace'),
    jsxTag: [{ match: /\/>/, tag: 'tag', pop: true }, { match: />/, tag: 'tag', next: 'jsxText' }, { match: /[\w:-]+(?=\s*=)/, tag: 'attribute' }, { match: /"[^"]*"|'[^']*'/, tag: 'string' }, { match: /\{/, tag: 'punctuation', push: 'brace' }],
    jsxText: [{ match: /<\/[\w.:-]+\s*>|<\/>/, tag: 'tag', pop: true }, { match: /<[\w.:-]+/, tag: 'tag', push: 'jsxTag' }, { match: /\{/, tag: 'punctuation', push: 'brace' }],
  } };
}
export const javascriptLanguage = compileGrammar(jsGrammar({ types: false, jsx: false }));
