// @vitest-environment node

import { describe, expect, it } from 'vitest';

interface DirEntry { name: string; isDirectory(): boolean; isFile(): boolean }
interface NodeFs { readdirSync(path: string, options: { withFileTypes: true }): DirEntry[]; readFileSync(path: string, encoding: 'utf8'): string }
interface NodeProcess { cwd(): string }
const processApi = (globalThis as unknown as { process: NodeProcess }).process;

function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '');
}

describe('Vim core purity', () => {
  it('keeps Vim source DOM-free and independent of CodeMirror view', async () => {
    const spec: string = 'node:fs';
    const fs = await import(/* @vite-ignore */ spec) as NodeFs;
    const root = `${processApi.cwd()}/src/vim`;
    const files: string[] = [];
    const visit = (directory: string): void => {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const path = `${directory}/${entry.name}`;
        if (entry.isDirectory()) visit(path);
        else if (entry.isFile() && entry.name.endsWith('.ts')) files.push(path);
      }
    };
    visit(root);
    expect(files.length).toBeGreaterThanOrEqual(3);
    const hostGlobalExemptions = new Set(['index.ts', 'adapter.ts', 'keymap-store.ts'].map(path => `${root}/${path}`));
    const fullCheckFiles = files.filter(file => !hostGlobalExemptions.has(file));
    expect(fullCheckFiles).toEqual(expect.arrayContaining(['controller.ts', 'keymap-runtime.ts', 'mapper.ts'].map(path => `${root}/${path}`)));
    const violations: string[] = [];
    const viewCheckedFiles: string[] = [];
    for (const file of files) {
      const source = withoutComments(fs.readFileSync(file, 'utf8'));
      if (!hostGlobalExemptions.has(file)) {
        if (/\b(?:document|window|navigator|localStorage|HTMLElement)\b/.test(source)) violations.push(`${file}: DOM global`);
        if (/\b(?:setTimeout|clearTimeout|setInterval|clearInterval)\b/.test(source)) violations.push(`${file}: timer global`);
      }
      if (/from\s+['"]@codemirror\/view['"]/.test(source)) violations.push(`${file}: @codemirror/view import`);
      viewCheckedFiles.push(file);
    }
    expect(viewCheckedFiles).toEqual(expect.arrayContaining(files.filter(file => hostGlobalExemptions.has(file))));
    expect(violations, violations.join('\n')).toEqual([]);
  });
});
