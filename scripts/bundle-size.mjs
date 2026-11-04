import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { execFileSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';

function usage(message) {
  console.error(`${message}\nUsage: node scripts/bundle-size.mjs [--root <dir>] [--entries all|core] [--out <file.json>]`);
  process.exit(2);
}

let root = process.cwd();
let selection = 'all';
let out;
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  const option = args[i];
  if (!['--root', '--entries', '--out'].includes(option) || !args[i + 1] || args[i + 1].startsWith('--')) usage(`Invalid argument: ${option}`);
  const value = args[++i];
  if (option === '--root') root = resolve(value);
  if (option === '--entries') selection = value;
  if (option === '--out') out = resolve(value);
}
root = resolve(root);
if (!['all', 'core'].includes(selection)) usage(`Invalid entries: ${selection}`);
if (!existsSync(resolve(root, 'src/index.ts'))) usage(`Invalid root: ${root}`);

const entries = {
  '.': 'src/index.ts',
  './engine': 'src/engine.ts',
  './json': 'src/language/json.ts',
  './diff': 'src/diff/index.ts',
};
if (selection === 'all') {
  entries['./languages'] = 'src/language/registry.ts';
  const languages = resolve(root, 'src/language/langs');
  if (existsSync(languages)) {
    for (const file of readdirSync(languages).filter((name) => name.endsWith('.ts')).sort()) {
      entries[`./languages/${file.slice(0, -3)}`] = `src/language/langs/${file}`;
    }
  }
}
let gitHead = null;
try {
  const gitRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  if (resolve(gitRoot) === root) {
    gitHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  }
} catch {
  // An archive has no Git metadata.
}
const result = { root, gitHead, entries: {}, skipped: [] };
const spec = 'vite';
const { build } = await import(spec);
process.chdir(root);
const size = (code) => ({ raw: Buffer.byteLength(code), gzip: gzipSync(code).length });
for (const [name, file] of Object.entries(entries)) {
  const entry = resolve(root, file);
  if (!existsSync(entry)) {
    result.skipped.push(name);
    continue;
  }
  const built = await build({
    configFile: false,
    logLevel: 'silent',
    root,
    build: {
      write: false,
      minify: true,
      target: 'es2022',
      lib: { entry, formats: ['es'], fileName: 'entry' },
      rollupOptions: { external: [/^@codemirror\//] },
    },
  });
  const outputs = (Array.isArray(built) ? built : [built]).flatMap((item) => item.output);
  const chunks = outputs.filter((item) => item.type === 'chunk');
  const byName = new Map(chunks.map((chunk) => [chunk.fileName, chunk]));
  const included = new Set();
  function include(chunk) {
    if (!chunk || included.has(chunk.fileName)) return;
    included.add(chunk.fileName);
    for (const dependency of chunk.imports) include(byName.get(dependency));
  }
  chunks.filter((chunk) => chunk.isEntry).forEach(include);
  const code = chunks.filter((chunk) => included.has(chunk.fileName)).map((chunk) => chunk.code).join('');
  const lazyChunks = chunks.filter((chunk) => !included.has(chunk.fileName)).map((chunk) => size(chunk.code));
  result.entries[name] = { file: relative(root, entry), ...size(code), ...(lazyChunks.length ? { lazyChunks } : {}) };
}
const json = `${JSON.stringify(result, null, 2)}\n`;
if (out) writeFileSync(out, json);
process.stdout.write(json);
