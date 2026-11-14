// @vitest-environment node
import { describe, expect, it } from 'vitest';

interface DirEntry { name: string; isDirectory(): boolean; isFile(): boolean }
interface NodeFs { readdirSync(path: string, options: { withFileTypes: true }): DirEntry[]; readFileSync(path: string, encoding: 'utf8'): string }
interface NodeProcess { cwd(): string }
const processApi = (globalThis as unknown as { process: NodeProcess }).process;
const forbidden = ['solid' + '-js', 'vac' + 'tr', '/' + 'editor/'];
const commonPackages = ['@codemirror/state', '@codemirror/commands'];
const testPackages = [...commonPackages, 'vitest', 'jsdom', 'playwright'];

const importPattern = () => /\b(?:import\s*(?:[^'";]*?\sfrom\s*)?|export\s+[^'";]*?\sfrom\s*|import\s*\(\s*)['"]([^'"]+)['"]/g;

function importsVim(file: string, source: string): string[] {
  if (file.startsWith('src/vim/')) return [];
  const issues: string[] = [];
  for (const match of source.matchAll(importPattern())) {
    const spec = match[1];
    if (!spec.startsWith('.')) continue;
    const parts = file.split('/').slice(0, -1);
    for (const component of spec.split('/')) {
      if (component === '..') parts.pop();
      else if (component !== '.' && component !== '') parts.push(component);
    }
    const path = parts.join('/');
    if (path === 'src/vim' || path.startsWith('src/vim/')) issues.push(`vim import: ${spec}`);
  }
  return issues;
}

function classify(file: string, source: string): string[] {
  const issues: string[] = [];
  for (const text of forbidden) if (source.includes(text)) issues.push(`forbidden text: ${text}`);
  for (const match of source.matchAll(importPattern())) {
    const spec = match[1];
    if (spec.startsWith('.')) {
      const parts = file.split('/').slice(0, -1);
      for (const component of spec.split('/')) {
        if (component === '..') { if (parts.length === 0) { issues.push(`escaping import: ${spec}`); break; } parts.pop(); }
        else if (component !== '.' && component !== '') parts.push(component);
      }
    } else {
      const allowed = file.startsWith('src/') ? commonPackages : file.endsWith('.config.ts') ? [...testPackages, 'vite', 'vitest/config'] : testPackages;
      if (!allowed.includes(spec) && !(spec.startsWith('node:') && !file.startsWith('src/'))) issues.push(`disallowed import: ${spec}`);
    }
  }
  return issues;
}

describe('package boundary', () => {
  it('classifies escaping paths, forbidden text and external packages', () => {
    expect(classify('src/a.ts', "im" + "port x from '../../" + 'editor/src/a' + "' ")).toContain("escaping import: ../../" + 'editor/src/a');
    expect(classify('src/a.ts', "const x = 'solid" + "-js'")).not.toEqual([]);
    expect(classify('src/a.ts', "im" + "port x from '@codemirror/" + "view'")).not.toEqual([]);
    expect(classify('src/a.ts', "im" + "port x from './ok'")).toEqual([]);
  });

  it('classifies vim imports', () => {
    expect(importsVim('src/editor.ts', "import { vim } from './vim/index'")).toEqual(['vim import: ./vim/index']);
    expect(importsVim('src/input/a.ts', "export { vim } from '../vim'")).toEqual(['vim import: ../vim']);
    expect(importsVim('src/a.ts', "import('./vim/index')")).toEqual(['vim import: ./vim/index']);
    expect(importsVim('src/vim/a.ts', "import x from './b'")).toEqual([]);
    expect(importsVim('src/a.ts', "import x from './vimish'")).toEqual([]);
  });

  it('keeps vim out of core', async () => {
    const spec: string = 'node:fs';
    const fs = await import(/* @vite-ignore */ spec) as NodeFs;
    const root = processApi.cwd();
    const violations: string[] = [];
    const walk = (relative: string): void => {
      for (const entry of fs.readdirSync(`${root}/${relative}`, { withFileTypes: true })) {
        const path = `${relative}/${entry.name}`;
        if (entry.isDirectory()) walk(path);
        else if (entry.isFile() && /\.(?:ts|mjs|html)$/.test(entry.name)) {
          for (const issue of importsVim(path, fs.readFileSync(`${root}/${path}`, 'utf8'))) violations.push(`${path}: ${issue}`);
        }
      }
    };
    walk('src');
    expect(violations, violations.join('\n')).toEqual([]);
  });

  it('keeps the package independent', async () => {
    const spec: string = 'node:fs';
    const fs = await import(/* @vite-ignore */ spec) as NodeFs;
    const root = processApi.cwd();
    const violations: string[] = [];
    const walk = (relative: string): void => {
      for (const entry of fs.readdirSync(`${root}/${relative}`, { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name === 'dist') continue;
        const path = relative ? `${relative}/${entry.name}` : entry.name;
        if (path === 'examples/tauri-editor') continue; // standalone subproject with its own package.json
        if (entry.isDirectory()) walk(path);
        else if (entry.isFile() && /\.(?:ts|mjs|html)$/.test(entry.name)) {
          for (const issue of classify(path, fs.readFileSync(`${root}/${path}`, 'utf8'))) violations.push(`${path}: ${issue}`);
        }
      }
    };
    walk('');
    expect(violations, violations.join('\n')).toEqual([]);
  });
});
