import { compileGrammar } from '../grammar';
export const pythonLanguage = compileGrammar({ name: 'python', states: { root: [
{ match: /[rRbBfF]{0,2}"""/, tag: 'string', push: 'tripleDouble' },
{ match: /[rRbBfF]{0,2}'''/, tag: 'string', push: 'tripleSingle' },
{ match: /#[^\n]*/, tag: 'comment' },
{ match: /@[A-Za-z_]\w*/, tag: 'meta' },
{ match: /(\bdef\s+)([A-Za-z_]\w*)/, tag: ['keyword', 'function'] },
{ match: /\b(?:True|False|None)\b/, tag: 'constant' },
{ match: /\b(?:if|else|elif|for|while|return|class|def|in|import|from|as|pass|with|yield|async|await)\b/, tag: 'keyword' },
{ match: /[rRbBfF]{0,2}(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/, tag: 'string' },{ match: /\b\d+(?:\.\d+)?\b/, tag: 'number' },
], tripleDouble: [{ match: /"""/, tag: 'string', pop: true }, { match: /./, tag: 'string' }], tripleSingle: [{ match: /'''/, tag: 'string', pop: true }, { match: /./, tag: 'string' }], },  });
