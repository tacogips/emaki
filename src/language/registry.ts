import type { LineLanguage } from '../types';
export { standardTags, defaultTokenColors } from './tags';
export type { StandardTag } from './tags';
export interface LanguageInfo { id: string; name: string; aliases: readonly string[]; extensions: readonly string[]; filenames: readonly string[] }
export const languages: readonly LanguageInfo[] = [
  { id: "plaintext", name: "plaintext", aliases: ["text", "txt"], extensions: ["txt"], filenames: [] },
  { id: "json", name: "json", aliases: ["jsonc"], extensions: ["json", "jsonc"], filenames: [] },
  { id: "c", name: "c", aliases: [], extensions: ["c", "h"], filenames: [] },
  { id: "cpp", name: "cpp", aliases: ["c++"], extensions: ["cpp", "cc", "cxx", "hpp", "hh", "hxx", "ipp", "inl"], filenames: [] },
  { id: "csharp", name: "csharp", aliases: ["c#", "cs"], extensions: ["cs", "csx"], filenames: [] },
  { id: "objc", name: "objc", aliases: ["objective-c"], extensions: ["m"], filenames: [] },
  { id: "objcpp", name: "objcpp", aliases: ["objective-c++"], extensions: ["mm"], filenames: [] },
  { id: "d", name: "d", aliases: [], extensions: ["d", "di"], filenames: [] },
  { id: "go", name: "go", aliases: ["golang"], extensions: ["go"], filenames: [] },
  { id: "rust", name: "rust", aliases: ["rs"], extensions: ["rs"], filenames: [] },
  { id: "zig", name: "zig", aliases: [], extensions: ["zig"], filenames: [] },
  { id: "swift", name: "swift", aliases: [], extensions: ["swift"], filenames: [] },
  { id: "pascal", name: "pascal", aliases: ["delphi"], extensions: ["pas", "dpr"], filenames: [] },
  { id: "actionscript", name: "actionscript", aliases: ["as"], extensions: ["as"], filenames: [] },
  { id: "java", name: "java", aliases: [], extensions: ["java", "bsh"], filenames: [] },
  { id: "groovy", name: "groovy", aliases: ["gradle"], extensions: ["groovy", "gvy", "gradle"], filenames: [] },
  { id: "scala", name: "scala", aliases: [], extensions: ["scala", "sbt"], filenames: [] },
  { id: "kotlin", name: "kotlin", aliases: ["kt"], extensions: ["kt", "kts"], filenames: [] },
  { id: "protobuf", name: "protobuf", aliases: ["proto", "protocol-buffers"], extensions: ["proto"], filenames: [] },
  { id: "graphql", name: "graphql", aliases: ["gql"], extensions: ["graphql", "gql"], filenames: [] },
  { id: "dot", name: "dot", aliases: ["graphviz"], extensions: ["dot", "gv"], filenames: [] },
  { id: "properties", name: "properties", aliases: ["java-properties"], extensions: ["properties"], filenames: [] },
  { id: "ini", name: "ini", aliases: [], extensions: ["ini", "cfg"], filenames: [] },
  { id: "toml", name: "toml", aliases: [], extensions: ["toml"], filenames: ["Cargo.lock"] },
  { id: "hcl", name: "hcl", aliases: ["terraform", "tf"], extensions: ["hcl", "tf", "tfvars"], filenames: [] },
  { id: "javascript", name: "javascript", aliases: ["js", "js-erb"], extensions: ["js", "mjs", "cjs", "htc", "js.erb"], filenames: [] },
  { id: "typescript", name: "typescript", aliases: ["ts"], extensions: ["ts", "mts", "cts", "d.ts"], filenames: [] },
  { id: "tsx", name: "tsx", aliases: [], extensions: ["tsx"], filenames: [] },
  { id: "jsx", name: "jsx", aliases: [], extensions: ["jsx"], filenames: [] },
  { id: "css", name: "css", aliases: [], extensions: ["css"], filenames: [] },
  { id: "html", name: "html", aliases: ["htm", "xhtml"], extensions: ["html", "htm", "shtml", "xhtml"], filenames: [] },
  { id: "xml", name: "xml", aliases: ["nant", "xsd", "svg"], extensions: ["xml", "xsd", "xslt", "svg", "rss", "build"], filenames: [] },
  { id: "vue", name: "vue", aliases: [], extensions: ["vue"], filenames: [] },
  { id: "svelte", name: "svelte", aliases: [], extensions: ["svelte"], filenames: [] },
  { id: "python", name: "python", aliases: ["py"], extensions: ["py", "pyw", "pyi"], filenames: ["SConstruct"] },
  { id: "ruby", name: "ruby", aliases: ["rb", "rails"], extensions: ["rb", "rake", "gemspec", "rxml", "builder"], filenames: ["Gemfile", "Rakefile"] },
  { id: "perl", name: "perl", aliases: ["pl"], extensions: ["pl", "pm", "pod", "t"], filenames: [] },
  { id: "lua", name: "lua", aliases: [], extensions: ["lua"], filenames: [] },
  { id: "r", name: "r", aliases: [], extensions: ["r", "rprofile"], filenames: [] },
  { id: "tcl", name: "tcl", aliases: [], extensions: ["tcl"], filenames: [] },
  { id: "bash", name: "bash", aliases: ["sh", "shell", "zsh", "ksh", "shell-unix-generic"], extensions: ["sh", "bash", "zsh", "ksh"], filenames: [".bashrc", ".zshrc", ".profile", ".bash_profile"] },
  { id: "fish", name: "fish", aliases: [], extensions: ["fish"], filenames: [] },
  { id: "batch", name: "batch", aliases: ["bat", "cmd"], extensions: ["bat", "cmd"], filenames: [] },
  { id: "applescript", name: "applescript", aliases: [], extensions: ["applescript"], filenames: [] },
  { id: "makefile", name: "makefile", aliases: ["make"], extensions: ["mk", "mak"], filenames: ["Makefile", "makefile", "GNUmakefile", "CMakeLists.txt"] },
  { id: "dockerfile", name: "dockerfile", aliases: ["docker"], extensions: ["dockerfile"], filenames: ["Dockerfile"] },
  { id: "sql", name: "sql", aliases: ["sql-erb"], extensions: ["sql", "ddl", "dml", "sql.erb", "erbsql"], filenames: [] },
  { id: "regexp", name: "regexp", aliases: ["regex"], extensions: ["re"], filenames: [] },
  { id: "haskell", name: "haskell", aliases: ["hs", "lhs"], extensions: ["hs", "lhs"], filenames: [] },
  { id: "ocaml", name: "ocaml", aliases: ["ml", "ocamllex", "ocamlyacc", "camlp4"], extensions: ["ml", "mli", "mll", "mly"], filenames: [] },
  { id: "erlang", name: "erlang", aliases: ["erl"], extensions: ["erl", "hrl"], filenames: ["Emakefile"] },
  { id: "clojure", name: "clojure", aliases: ["clj"], extensions: ["clj", "cljs", "cljc", "edn"], filenames: [] },
  { id: "lisp", name: "lisp", aliases: ["elisp", "common-lisp"], extensions: ["lisp", "cl", "el", "lsp"], filenames: [] },
  { id: "nix", name: "nix", aliases: [], extensions: ["nix"], filenames: [] },
  { id: "matlab", name: "matlab", aliases: [], extensions: ["matlab"], filenames: [] },
  { id: "markdown", name: "markdown", aliases: ["md", "multimarkdown"], extensions: ["md", "markdown", "mdown", "mmd"], filenames: [] },
  { id: "restructuredtext", name: "restructuredtext", aliases: ["rst"], extensions: ["rst", "rest"], filenames: [] },
  { id: "textile", name: "textile", aliases: [], extensions: ["textile"], filenames: [] },
  { id: "latex", name: "latex", aliases: [], extensions: ["tex", "ltx"], filenames: [] },
  { id: "tex", name: "tex", aliases: [], extensions: ["sty", "cls"], filenames: [] },
  { id: "bibtex", name: "bibtex", aliases: ["bib"], extensions: ["bib"], filenames: [] },
  { id: "rd", name: "rd", aliases: [], extensions: ["rd"], filenames: [] },
  { id: "diff", name: "diff", aliases: ["patch"], extensions: ["diff", "patch"], filenames: [] },
  { id: "yaml", name: "yaml", aliases: ["yml"], extensions: ["yaml", "yml"], filenames: [] },
  { id: "haml", name: "haml", aliases: [], extensions: ["haml"], filenames: [] },
  { id: "php", name: "php", aliases: [], extensions: ["php", "php3", "php4", "php5", "phtml"], filenames: [] },
  { id: "asp", name: "asp", aliases: [], extensions: ["asp", "asa"], filenames: [] },
  { id: "jsp", name: "jsp", aliases: [], extensions: ["jsp"], filenames: [] },
  { id: "erb", name: "erb", aliases: ["rhtml", "html-erb"], extensions: ["erb", "rhtml", "html.erb"], filenames: [] },
  { id: "erlang-html", name: "erlang-html", aliases: ["yaws"], extensions: ["yaws"], filenames: [] },
  { id: "tcl-html", name: "tcl-html", aliases: ["adp"], extensions: ["adp"], filenames: [] },
]
;
const loaders: Record<string, () => Promise<Record<string, unknown>>> = {
  "plaintext": () => import('./langs/plaintext'),
  "json": () => import('./langs/json'),
  "c": () => import('./langs/c'),
  "cpp": () => import('./langs/cpp'),
  "csharp": () => import('./langs/csharp'),
  "objc": () => import('./langs/objc'),
  "objcpp": () => import('./langs/objcpp'),
  "d": () => import('./langs/d'),
  "go": () => import('./langs/go'),
  "rust": () => import('./langs/rust'),
  "zig": () => import('./langs/zig'),
  "swift": () => import('./langs/swift'),
  "pascal": () => import('./langs/pascal'),
  "actionscript": () => import('./langs/actionscript'),
  "java": () => import('./langs/java'),
  "groovy": () => import('./langs/groovy'),
  "scala": () => import('./langs/scala'),
  "kotlin": () => import('./langs/kotlin'),
  "protobuf": () => import('./langs/protobuf'),
  "graphql": () => import('./langs/graphql'),
  "dot": () => import('./langs/dot'),
  "properties": () => import('./langs/properties'),
  "ini": () => import('./langs/ini'),
  "toml": () => import('./langs/toml'),
  "hcl": () => import('./langs/hcl'),
  "javascript": () => import('./langs/javascript'),
  "typescript": () => import('./langs/typescript'),
  "tsx": () => import('./langs/tsx'),
  "jsx": () => import('./langs/jsx'),
  "css": () => import('./langs/css'),
  "html": () => import('./langs/html'),
  "xml": () => import('./langs/xml'),
  "vue": () => import('./langs/vue'),
  "svelte": () => import('./langs/svelte'),
  "python": () => import('./langs/python'),
  "ruby": () => import('./langs/ruby'),
  "perl": () => import('./langs/perl'),
  "lua": () => import('./langs/lua'),
  "r": () => import('./langs/r'),
  "tcl": () => import('./langs/tcl'),
  "bash": () => import('./langs/bash'),
  "fish": () => import('./langs/fish'),
  "batch": () => import('./langs/batch'),
  "applescript": () => import('./langs/applescript'),
  "makefile": () => import('./langs/makefile'),
  "dockerfile": () => import('./langs/dockerfile'),
  "sql": () => import('./langs/sql'),
  "regexp": () => import('./langs/regexp'),
  "haskell": () => import('./langs/haskell'),
  "ocaml": () => import('./langs/ocaml'),
  "erlang": () => import('./langs/erlang'),
  "clojure": () => import('./langs/clojure'),
  "lisp": () => import('./langs/lisp'),
  "nix": () => import('./langs/nix'),
  "matlab": () => import('./langs/matlab'),
  "markdown": () => import('./langs/markdown'),
  "restructuredtext": () => import('./langs/restructuredtext'),
  "textile": () => import('./langs/textile'),
  "latex": () => import('./langs/latex'),
  "tex": () => import('./langs/tex'),
  "bibtex": () => import('./langs/bibtex'),
  "rd": () => import('./langs/rd'),
  "diff": () => import('./langs/diff'),
  "yaml": () => import('./langs/yaml'),
  "haml": () => import('./langs/haml'),
  "php": () => import('./langs/php'),
  "asp": () => import('./langs/asp'),
  "jsp": () => import('./langs/jsp'),
  "erb": () => import('./langs/erb'),
  "erlang-html": () => import('./langs/erlang-html'),
  "tcl-html": () => import('./langs/tcl-html'),
};
const byName = (value: string) => languages.find(x => [x.id, x.name, ...x.aliases].some(v => v.toLowerCase() === value));
const byExtension = (value: string) => languages.find(x => x.extensions.some(v => v.toLowerCase() === value));
export function resolveLanguage(query: { name?: string; extension?: string; filename?: string; fenceInfo?: string }): LanguageInfo | undefined {
  if (query.fenceInfo !== undefined) {
    const word = query.fenceInfo.trim().split(/\s+/)[0]!.replace(/^\{\.?/, '').replace(/}$/, '').split(',')[0]!.toLowerCase();
    const result = byName(word) ?? byExtension(word); if (result) return result;
  }
  if (query.name !== undefined) { const result = byName(query.name.toLowerCase()); if (result) return result; }
  if (query.filename !== undefined) {
    const base = query.filename.split(/[\\/]/).pop()!.toLowerCase();
    const exact = languages.find(x => x.filenames.some(v => v.toLowerCase() === base)); if (exact) return exact;
    for (let i = base.indexOf('.'); i >= 0; i = base.indexOf('.', i + 1)) { const result = byExtension(base.slice(i + 1)); if (result) return result; }
  }
  if (query.extension !== undefined) return byExtension(query.extension.toLowerCase().replace(/^\./, ''));
  return undefined;
}
const cache = new Map<string, Promise<LineLanguage<string>>>();
export function loadLanguage(idOrInfo: string | LanguageInfo, opts?: { embedded?: readonly string[] | 'all' }): Promise<LineLanguage<string>> {
  const info = resolveLanguage({ name: typeof idOrInfo === 'string' ? idOrInfo : idOrInfo.id });
  if (!info) return Promise.reject(new Error(`unknown language: ${typeof idOrInfo === 'string' ? idOrInfo : idOrInfo.id}`));
  const embedded = info.id === 'markdown' && opts?.embedded !== undefined ? opts.embedded : undefined;
  const ids = embedded === 'all' ? languages.filter(x => x.id !== 'markdown').map(x => x.id) : embedded?.map(x => resolveLanguage({ fenceInfo: x })?.id).filter((x): x is string => x !== undefined && x !== 'markdown');
  const unique = ids ? [...new Set(ids)].sort() : undefined;
  const key = `${info.id}|${embedded === 'all' ? 'all' : unique ? unique.join(',') : ''}`;
  const existing = cache.get(key); if (existing) return existing;
  const promise = (async () => {
    const loaded = new Map<string, LineLanguage<string>>();
    if (unique) await Promise.all(unique.map(async id => { loaded.set(id, await loadLanguage(id)); }));
    const module = await loaders[info.id]!();
    if (info.id === 'markdown' && unique) {
      const create = module.createMarkdownLanguage as (resolve: (info: string) => LineLanguage<string> | undefined) => LineLanguage<string>;
      return create(fence => { const resolved = resolveLanguage({ fenceInfo: fence }); return resolved ? loaded.get(resolved.id) : undefined; });
    }
    const exportName = info.id.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()) + 'Language';
    const language = module[exportName];
    if (!language) throw new Error(`missing ${exportName} export for language ${info.id}`);
    return language as LineLanguage<string>;
  })();
  cache.set(key, promise); void promise.catch(() => { if (cache.get(key) === promise) cache.delete(key); });
  return promise;
}
