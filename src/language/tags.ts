import type { Rgba } from '../render/palette';

export const standardTags = ['keyword', 'string', 'number', 'comment', 'operator', 'punctuation', 'type', 'function', 'variable', 'property', 'constant', 'tag', 'attribute', 'heading', 'emphasis', 'strong', 'link', 'regexp', 'escape', 'meta', 'inserted', 'deleted', 'invalid'] as const;
export type StandardTag = typeof standardTags[number];
const colors: Record<StandardTag, Rgba> = {
  keyword: [0.71, 0.56, 0.68, 1], string: [0.64, 0.75, 0.55, 1], number: [0.71, 0.56, 0.68, 1], comment: [0.55, 0.61, 0.69, 1], operator: [0.53, 0.75, 0.82, 1], punctuation: [0.85, 0.87, 0.91, 1], type: [0.56, 0.74, 0.73, 1], function: [0.53, 0.68, 0.82, 1], variable: [0.85, 0.87, 0.91, 1], property: [0.53, 0.75, 0.82, 1], constant: [0.82, 0.65, 0.55, 1], tag: [0.53, 0.75, 0.82, 1], attribute: [0.92, 0.8, 0.55, 1], heading: [0.53, 0.68, 0.82, 1], emphasis: [0.92, 0.8, 0.55, 1], strong: [0.92, 0.8, 0.55, 1], link: [0.53, 0.75, 0.82, 1], regexp: [0.92, 0.8, 0.55, 1], escape: [0.82, 0.65, 0.55, 1], meta: [0.56, 0.74, 0.73, 1], inserted: [0.64, 0.75, 0.55, 1], deleted: [0.75, 0.38, 0.42, 1], invalid: [0.9, 0.35, 0.4, 1],
};
export const defaultTokenColors: Record<string, Rgba> = Object.freeze({ ...colors, 'json-key': colors.property, 'json-string': colors.string, 'json-number': colors.number, 'json-bool': colors.constant, 'json-null': colors.constant, 'json-punct': colors.punctuation, 'json-invalid': colors.invalid });
