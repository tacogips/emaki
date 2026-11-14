import { vim, compileKeymap, LocalKeymapStore, type Vim, type KeymapIssue, type VimExCommand } from 'emaki/vim';
import { createEditor, type EditorHandle } from 'emaki';
import { languages, resolveLanguage, loadLanguage, defaultTokenColors } from 'emaki/languages';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';

if (import.meta.env.MODE === 'mock') await (await import('./mock-ipc')).install();
const host = document.querySelector<HTMLElement>('#editor')!;
const status = document.querySelector<HTMLElement>('#status-msg')!;
const select = document.querySelector<HTMLSelectElement>('#lang')!;
const vimToggle = document.querySelector<HTMLInputElement>('#vim')!;
const vimMode = document.querySelector<HTMLElement>('#vim-mode')!;
const keymapButton = document.querySelector<HTMLButtonElement>('#vim-keymap')!;
const keymapClear = document.querySelector<HTMLButtonElement>('#vim-keymap-clear')!;
const pos = document.querySelector<HTMLElement>('#pos')!;
for (const info of languages) { const option = document.createElement('option'); option.value = info.id; option.textContent = info.name; select.append(option); }
let docId = 0, rev = 0, path: string | null = null, dirty = false, langId = 'plaintext', handle: EditorHandle, busy = false, token = 0;
let vimOn = false;
try { vimOn = localStorage.getItem('emaki-tauri-editor.vim') === '1'; } catch {}
vimToggle.checked = vimOn;
let currentVim: Vim | undefined, detachVim: (() => void) | undefined;
const keymapStore = new LocalKeymapStore({ key: 'emaki-tauri-editor.vim.keymap' });
let userKeymap = await keymapStore.load();
let clean: EditorHandle['state']['doc'], pendingTitle: string | undefined, inflight = false, traceDirty = false;
try { traceDirty = localStorage.getItem('emaki-tauri-editor.traceDirty') === '1'; } catch {}
const basename = (p: string) => p.split(/[\\/]/).pop() || p;
const detect = (p: string) => resolveLanguage({ filename: basename(p) })?.id ?? 'plaintext';
async function flushTitle() {
  inflight = true;
  while (pendingTitle !== undefined) {
    const t = pendingTitle; pendingTitle = undefined;
    try { await getCurrentWindow().setTitle(t); } catch (err) { status.textContent = String(err); }
  }
  inflight = false;
}
function title() { const t = `${path ? basename(path) : 'Untitled'}${dirty ? ' •' : ''} — emaki`; document.title = t; pendingTitle = t; if (!inflight) void flushTitle(); }
function position() { const head = handle.state.selection.main.head, line = handle.state.doc.lineAt(head); pos.textContent = `Ln ${line.number}, Col ${head - line.from + 1}`; }
async function mount(text: string, id: string, sel?: { anchor: number; head: number }, keepDirty = false, live = false) {
  const current = ++token;
  let language;
  try { language = await loadLanguage(id); } catch (err) { if (current !== token) return; status.textContent = String(err); id = 'plaintext'; language = await loadLanguage(id); }
  if (current !== token) return;
  if (live) { text = handle.state.doc.toString(); sel = handle.state.selection.main; keepDirty = dirty; }
  detachVim?.();
  handle?.destroy();
  currentVim = vimOn ? vim({ ex, keymap: userKeymap ?? undefined }) : undefined;
  handle = createEditor(host, { doc: text, language, modalKeys: currentVim, theme: { tokens: defaultTokenColors } });
  detachVim = currentVim?.attach(handle, host);
  currentVim?.onChange(renderMode);
  renderMode();
  if (currentVim?.keymapIssues.length) showIssues(currentVim.keymapIssues);
  if (sel) handle.dispatch({ selection: { anchor: Math.min(sel.anchor, handle.state.doc.length), head: Math.min(sel.head, handle.state.doc.length) } });
  if (!live) clean = handle.state.doc;
  langId = id; dirty = keepDirty; select.value = id;
  handle.onUpdate(update => {
    if (update.docChanged) {
      rev++; const eqClean = handle.state.doc.eq(clean), next = !eqClean;
      if (traceDirty) { const changes: [number, number, string][] = []; update.changes.iterChanges((from, to, _fromB, _toB, inserted) => changes.push([from, to, inserted.toString()])); console.debug('[dirty-trace]', { userEvent: update.userEvent, changes, eqClean }); }
      if (next !== dirty) { dirty = next; title(); }
    }
    if (update.docChanged || update.selectionSet) position();
  });
  position(); title(); handle.focus();
  if (import.meta.env.MODE === 'mock') {
    window.__tauriEditorMock.dirtyAtFocus = dirty;
    window.__tauriEditorMock.text = () => handle.state.doc.toString();
    window.__tauriEditorMock.dispatchIdentity = () => handle.dispatch({ changes: { from: 0, to: handle.state.doc.length, insert: handle.state.doc } });
  }
}
const guard = () => dirty ? invoke<boolean>('confirm_discard') : Promise.resolve(true);
async function openPath(p: string) { const text = await invoke<string>('read_text_file', { path: p }); docId++; path = p; dirty = false; await mount(text, detect(p)); }
async function newFile() { if (!(await guard())) return; docId++; path = null; dirty = false; await mount('', 'plaintext'); }
async function openFile() { if (!(await guard())) return; const p = await invoke<string | null>('pick_open_path'); if (p) await openPath(p); }
async function save(as = false, suggested?: string) {
  const saveAs = as || !path;
  const destination = saveAs ? await invoke<string | null>('pick_save_path', { suggested: suggested ?? (path ? basename(path) : 'untitled.txt') }) : path;
  if (!destination) return;
  const snap = { docId, doc: handle.state.doc };
  await invoke('write_text_file', { path: destination, contents: snap.doc.toString() });
  if (docId !== snap.docId) return;
  if (saveAs) path = destination;
  clean = snap.doc; dirty = !handle.state.doc.eq(clean);
  status.textContent = dirty ? 'Saved (newer edits unsaved)' : 'Saved';
  title();
  const id = detect(destination);
  if (saveAs && id !== langId) await mount(handle.state.doc.toString(), id, handle.state.selection.main, dirty, true);
}
function run(action: () => Promise<unknown>) {
  if (busy) return;
  busy = true;
  void Promise.resolve().then(action).catch(err => { status.textContent = String(err); }).finally(() => { busy = false; });
}
function showIssues(issues: readonly KeymapIssue[]) {
  const errors = issues.filter(i => i.severity === 'error').length;
  const warnings = issues.filter(i => i.severity === 'warning').length;
  status.textContent = `keymap: ${errors} error(s), ${warnings} warning(s): ${issues.slice(0, 3).map(i => `${i.path}: ${i.message}`).join('; ')}${issues.length > 3 ? '; …' : ''}`;
}
function renderMode() {
  vimMode.hidden = keymapButton.hidden = keymapClear.hidden = !vimOn;
  if (!currentVim) return;
  const state = currentVim.state;
  const labels: Record<string, string> = { normal: 'NORMAL', 'operator-pending': 'NORMAL', insert: 'INSERT', visual: 'VISUAL', 'visual-line': 'VISUAL LINE', 'visual-block': 'VISUAL BLOCK', replace: 'REPLACE' };
  vimMode.textContent = state.prompt ? state.prompt.kind + state.prompt.text : labels[state.mode] ?? state.mode.toUpperCase();
  if (state.message) status.textContent = state.message;
}
async function openNamed(p: string) {
  if (!(await guard())) return;
  const confirmed = await invoke<string | null>('confirm_open_path', { path: p });
  if (confirmed) await openPath(confirmed);
}
function ex(cmd: VimExCommand): boolean {
  const { name, args, bang } = cmd;
  if (['w', 'write'].includes(name) && !args && !bang) run(() => save());
  else if (['w', 'write', 'saveas', 'sav'].includes(name) && args && !bang) run(() => save(true, basename(args)));
  else if (['wq', 'x'].includes(name)) run(async () => { await save(); if (!dirty) await getCurrentWindow().destroy(); });
  else if (['q', 'quit'].includes(name)) run(async () => { if (bang || await guard()) await getCurrentWindow().destroy(); });
  else if (['e', 'edit'].includes(name)) run(() => args ? openNamed(args) : openFile());
  else return false;
  return true;
}
select.addEventListener('change', () => { void mount(handle.state.doc.toString(), select.value, handle.state.selection.main, dirty, true); });
vimToggle.addEventListener('change', () => {
  vimOn = vimToggle.checked;
  try { localStorage.setItem('emaki-tauri-editor.vim', vimOn ? '1' : '0'); } catch {}
  void mount(handle.state.doc.toString(), langId, handle.state.selection.main, dirty, true);
});
keymapButton.addEventListener('click', () => run(async () => {
  const p = await invoke<string | null>('pick_open_path'); if (!p) return;
  const text = await invoke<string>('read_text_file', { path: p });
  const result = compileKeymap(text);
  if (!result.keymap) { showIssues(result.issues); return; }
  const saved = await keymapStore.save(text); userKeymap = text; currentVim?.setKeymap(text);
  if (result.issues.length) { showIssues(result.issues); status.textContent = `Keymap loaded; ${status.textContent}`; }
  else status.textContent = 'Keymap loaded';
  if (!saved.ok) status.textContent += ` (not persisted: ${saved.reason})`;
}));
keymapClear.addEventListener('click', () => run(async () => {
  await keymapStore.clear(); userKeymap = null; currentVim?.setKeymap(null); status.textContent = 'Keymap reset';
}));
window.addEventListener('keydown', e => {
  const mod = /Mac|iPhone|iPad/.test(navigator.userAgent) ? e.metaKey : e.ctrlKey, key = e.key.toLowerCase();
  if (!mod || !['n', 'o', 's'].includes(key)) return;
  e.preventDefault(); e.stopPropagation();
  run(() => key === 'n' ? newFile() : key === 'o' ? openFile() : save(e.shiftKey));
}, true);
await getCurrentWindow().onCloseRequested(async e => { if (dirty && !(await guard())) e.preventDefault(); });
try { const p = await invoke<string | null>('initial_path'); if (p) await openPath(p); else { docId++; await mount('', 'plaintext'); } }
catch (err) { status.textContent = String(err); docId++; path = null; await mount('', 'plaintext'); }
