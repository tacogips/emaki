import { compileGrammar } from '../grammar';
import { jsGrammar } from './javascript';

export const typescriptLanguage = compileGrammar({ ...jsGrammar({ types: true, jsx: false }), name: 'typescript' });
