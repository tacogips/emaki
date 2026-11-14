import { mockIPC, mockWindows } from '@tauri-apps/api/mocks';

declare global { interface Window { __tauriEditorMock: {
  files: Map<string, string>; nextOpen: string | null; nextSave: string | null; discard: boolean; confirmOpen: boolean; calls: string[];
  deferWrite: boolean; failWrite: boolean; releaseWrite(): void; text(): string; dispatchIdentity(): void; dirtyAtFocus?: boolean;
} ; __tauriEditorMockSeed?: { initialPath?: string; files?: Record<string, string> } } }
export function install() {
  mockWindows('main');
  const seed = window.__tauriEditorMockSeed;
  const mock: Window['__tauriEditorMock'] = window.__tauriEditorMock = { files: new Map<string, string>(Object.entries(seed?.files ?? {})), nextOpen: null, nextSave: null, discard: true, confirmOpen: true,
    calls: [] as string[], deferWrite: false, failWrite: false, releaseWrite() {}, text: () => '', dispatchIdentity() {} };
  mockIPC((cmd, args) => {
    mock.calls.push(cmd);
    const data = args as { path: string; contents: string };
    if (cmd === 'initial_path') return seed?.initialPath ?? null;
    if (cmd === 'pick_open_path') return mock.nextOpen;
    if (cmd === 'pick_save_path') return mock.nextSave;
    if (cmd === 'confirm_open_path') return mock.confirmOpen ? data.path : null;
    if (cmd === 'confirm_discard') return mock.discard;
    if (cmd === 'read_text_file') { if (!mock.files.has(data.path)) throw `file not found: ${data.path}`; return mock.files.get(data.path); }
    if (cmd === 'write_text_file') {
      if (mock.failWrite) throw `write failed: ${data.path}: mock`;
      if (mock.deferWrite) return new Promise(resolve => { mock.releaseWrite = () => { mock.files.set(data.path, data.contents); resolve(null); }; });
      mock.files.set(data.path, data.contents); return null;
    }
    if (cmd.startsWith('plugin:window|') || cmd.startsWith('plugin:event|')) return null;
    throw `unmocked: ${cmd}`;
  }, { shouldMockEvents: true });
}
