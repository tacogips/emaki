import { defineConfig } from 'vite';
const repoRoot = new URL('../..', import.meta.url).pathname;
export default defineConfig({
  base: './', clearScreen: false,
  server: { port: 1420, strictPort: true, fs: { allow: [repoRoot] } },
  resolve: { alias: [{ find: /^emaki$/, replacement: repoRoot + 'src/index.ts' }, { find: /^emaki\/vim$/, replacement: repoRoot + 'src/vim/index.ts' }, { find: /^emaki\/languages$/, replacement: repoRoot + 'src/language/registry.ts' }] },
  build: { target: 'es2022', outDir: 'dist', emptyOutDir: true },
});
