import { compileGrammar } from '../grammar';
import { jsGrammar } from './javascript';

export const tsxLanguage = compileGrammar({ ...jsGrammar({ types: true, jsx: true }), name: 'tsx' });
