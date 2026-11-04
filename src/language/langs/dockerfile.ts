import { compileGrammar } from '../grammar';
import { bashLanguage } from './bash';
export const dockerfileLanguage = compileGrammar({ name: 'dockerfile', states: { root: [
{ match: /^\s*#.*$/, tag: 'comment' },
{ match: /^\s*(RUN)\b/i, tag: ['keyword'], embed: { language: bashLanguage, end: /(?<!\\)$/ } },
{ match: /^\s*(FROM|COPY|ADD|CMD|ENV|WORKDIR|ENTRYPOINT|ARG|EXPOSE|LABEL)\b/i, tag: ['keyword'] },
{ match: /\b\d+(?:\.\d+)?\b/, tag: 'number' },
] } });
