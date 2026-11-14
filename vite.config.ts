import { defineConfig } from 'vite';

const inputs = [
  new URL('./examples/index.html', import.meta.url).pathname,
  new URL('./examples/plugin-showcase/index.html', import.meta.url).pathname,
  new URL('./examples/json-10k/index.html', import.meta.url).pathname,
  new URL('./examples/diff/index.html', import.meta.url).pathname,
  new URL('./examples/languages/index.html', import.meta.url).pathname,
];

export default defineConfig({
  root: 'examples',
  base: './',
  optimizeDeps: { entries: inputs },
  server: { watch: { ignored: ['**/tauri-editor/src-tauri/**'] } },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    target: 'es2022',
    rollupOptions: {
      input: inputs,
    },
  },
});
