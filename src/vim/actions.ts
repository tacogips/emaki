export type BuiltinActionId = 'emaki.evaluate' | 'emaki.evaluateAll' | 'emaki.hush' | 'emaki.format'
  | 'emaki.diagnostic.next' | 'emaki.diagnostic.prev' | 'emaki.completion'
  | 'hop.char1' | 'hop.char1Line' | 'hop.word' | 'hop.line';

export type ActionId = string;

export const ACTION_MODES: Readonly<Record<BuiltinActionId, readonly ('n' | 'i' | 'x' | 'o')[]>> = {
  'emaki.evaluate': ['n', 'x', 'i'],
  'emaki.evaluateAll': ['n', 'x', 'i'],
  'emaki.hush': ['n', 'x', 'i'],
  'emaki.format': ['n', 'x', 'i'],
  'emaki.diagnostic.next': ['n', 'x'],
  'emaki.diagnostic.prev': ['n', 'x'],
  'emaki.completion': ['n', 'x', 'i'],
  'hop.char1': ['n', 'x', 'o'],
  'hop.char1Line': ['n', 'x', 'o'],
  'hop.word': ['n', 'x', 'o'],
  'hop.line': ['n', 'x', 'o'],
};

export function isActionId(value: string): value is BuiltinActionId {
  return Object.prototype.hasOwnProperty.call(ACTION_MODES, value);
}

export function isHostActionId(value: string): boolean {
  return value.length <= 128 && /^[A-Za-z][A-Za-z0-9_-]*(\.[A-Za-z0-9_-]+)+$/.test(value)
    && !value.startsWith('hop.') && !isActionId(value);
}

export const isHopAction = (id: string): boolean => id.startsWith('hop.');
