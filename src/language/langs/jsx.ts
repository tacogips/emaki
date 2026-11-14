import { compileGrammar } from '../grammar';
import { jsGrammar } from './javascript';

export const jsxLanguage = compileGrammar({ ...jsGrammar({ types: false, jsx: true }), name: 'jsx' });
