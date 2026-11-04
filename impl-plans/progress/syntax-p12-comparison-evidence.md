# P12 comparison evidence progress

Measurements and notices are complete; the required pre/post per-file hash comparison remains unverified because no pre-edit hash snapshot was captured. Formal review and finalization are downstream. The assigned P10 dependency is accepted by dispatch. The spike is outside the repository at `$TMPDIR/emaki-ts-spike`.

## Toolchain manifest

- Node v26.12.1; npm 11.20.0; Vite 8.3.1. Version command: `node --version; npm --version; npx vite --version; npm ls --depth=0` (exit 0; `$TMPDIR/emaki-ts-spike/versions.log`).
- Initial command: `npm init -y && npm install --save-exact web-tree-sitter@0.25.10 tree-sitter-wasms@0.1.13 vite@8.3.1` in `$TMPDIR/emaki-ts-spike` (exit 0; `tmp/syntax-highlighting-20261102/syntax-p12-comparison-evidence/install.log`).
- Query packages: `npm install --save-exact tree-sitter-typescript@0.23.2 tree-sitter-python@0.23.6 tree-sitter-rust@0.23.2 tree-sitter-html@0.23.2 tree-sitter-javascript@0.23.1 tree-sitter-css@0.23.2` (exit 0; `$TMPDIR/emaki-ts-spike/install-grammars.log`); later replaced to match the prebuilt grammar ABI.
- Final query install: `npm_config_cache="$PWD/.npm-cache" npm install --ignore-scripts --save-exact tree-sitter-typescript@0.20.5 tree-sitter-python@0.21.0 tree-sitter-rust@0.20.4 tree-sitter-html@0.20.0 tree-sitter-javascript@0.20.3 tree-sitter-css@0.20.0` (exit 0; `$TMPDIR/emaki-ts-spike/install-grammars-v3.log`). A prior native-binding installation failed; see `$TMPDIR/emaki-ts-spike/install-grammars-v2.log`.
- `npx vite build` (exit 0; `$TMPDIR/emaki-ts-spike/build-v7.log`). The spike was smoke-tested before its final timing-only changes; the comparison harness is the final behavioral check.
- Installed `.wasm` and `.node` SHA-256 manifest (`find`/`shasum -a 256`, exit 0):

```
950977f544b45e481a4d92dee930ca654493eb7f14fd1ae8df6f1a971a4c1659  node_modules/tree-sitter-python/prebuilds/darwin-x64/tree-sitter-python.node
5b07cf173140479248e355b4f403ebf82857e8bf7a84d7b6973a8dca6e17d38e  node_modules/tree-sitter-python/prebuilds/win32-x64/tree-sitter-python.node
99ea3cd310317de0d35acd3283c471b65ec39539d54b8f02851f5f083945293b  node_modules/tree-sitter-python/prebuilds/darwin-arm64/tree-sitter-python.node
f1d5b490cf19804c5ec523130a8c6d49f554910e1b4b8063dcee1526647c63b2  node_modules/tree-sitter-python/prebuilds/linux-x64/tree-sitter-python.node
3890bf91d40e2f77f628b05390d5f0aa651ec2512662d6c1f4fe391e9bd7a8a0  node_modules/@rolldown/binding-darwin-arm64/rolldown-binding.darwin-arm64.node
aee1601d7145d89f262d4c777f308ef06ed53046ee49b780d31a98f02db2e253  node_modules/lightningcss-darwin-arm64/lightningcss.darwin-arm64.node
cb4b08f17afeb91d6ae00e2dcffb828c872fc9ea1f4a87871437d18a990f5f1e  node_modules/tree-sitter/prebuilds/darwin-x64/tree-sitter.node
5c77719e3366969cd489ea9fa8877a892dfef97171c219a05c8bbb0ff31c8d44  node_modules/tree-sitter/prebuilds/win32-x64/tree-sitter.node
228c3b6ac97fe5074f712d57df85b243d30d48fb881374613ae6d35037438886  node_modules/tree-sitter/prebuilds/darwin-arm64/tree-sitter.node
944ff6619f05f1cbbf14cf05c422f847df0b99e41264e8e782a41102f37489c1  node_modules/tree-sitter/prebuilds/linux-x64/tree-sitter.node
f38dcc4b43b818f9a0785bc1c6d5611a75ac4cdd428ff3f02757c34ca4e46d7f  node_modules/web-tree-sitter/tree-sitter.wasm
2b8b96e0f0f4624c4f885d40d76e25a25d9c58d40fe8ff4ab9563ee0297eed5e  node_modules/web-tree-sitter/lib/tree-sitter.wasm
2b8b96e0f0f4624c4f885d40d76e25a25d9c58d40fe8ff4ab9563ee0297eed5e  node_modules/web-tree-sitter/debug/tree-sitter.wasm
962b8668a0e16a6fb1fe232ba3e07ba4537a6b72c47293fddea0f6ea6ff9912e  node_modules/tree-sitter-wasms/out/tree-sitter-elm.wasm
9963ca89b616eaf04b08a43bc1fb0f07b85395bec313330851f1f1ead2f755b6  node_modules/tree-sitter-wasms/out/tree-sitter-go.wasm
9056d0fb0c337810d019fae350e8167786119da98f0f282aceae7ab89ee8253b  node_modules/tree-sitter-wasms/out/tree-sitter-python.wasm
5fc615467b1b98420ed7517e5bf9e1f88468132dd903d842dfb13714f6a1cb0c  node_modules/tree-sitter-wasms/out/tree-sitter-css.wasm
09129542bbea6d19aa33b54f93bae2b41128144970be13ce09af6697146c4527  node_modules/tree-sitter-wasms/out/tree-sitter-systemrdl.wasm
b5cb00c8d06ed0f10f1dbe497205b437809d7e87db1f638721a8cfb30e044449  node_modules/tree-sitter-wasms/out/tree-sitter-kotlin.wasm
160745e470f234cae903a9ba445d19e758d0b02e1197401fc765976c6254d2b6  node_modules/tree-sitter-wasms/out/tree-sitter-solidity.wasm
056b25072382f72deee2c64ec238ffc4bb8cf42844ef21502c0e70f03a8a0d66  node_modules/tree-sitter-wasms/out/tree-sitter-c.wasm
55bb617b6f01e14bab997861f0b20a2420cf6ba3199ffeb295b9ec398966d8a3  node_modules/tree-sitter-wasms/out/tree-sitter-php.wasm
637aac4415fb39a211a4f4292d63c66b5ce9c32fa2cd35464af4f681d91b9a1f  node_modules/tree-sitter-wasms/out/tree-sitter-java.wasm
160cfbb8ff7220886e99ed9699abceb6d837b4cd28993b9282c7f445a0554abd  node_modules/tree-sitter-wasms/out/tree-sitter-scala.wasm
836b2a51f6b2b4605ef7bfa908b978fed0fe838afb4eabaa9451552f12e953c1  node_modules/tree-sitter-wasms/out/tree-sitter-ql.wasm
6244521bb3fb60f34ce5f677f2af81facb2c38691193985ca5fa85e1b6f29250  node_modules/tree-sitter-wasms/out/tree-sitter-vue.wasm
7849ac8ce9d10a4684ca189ea8ad3654c20c38acb2d674a014a164398cbd37a2  node_modules/tree-sitter-wasms/out/tree-sitter-toml.wasm
68584527f712dbf2cc39776c56980c08516991f184a4a17bb67c2f436f0fc373  node_modules/tree-sitter-wasms/out/tree-sitter-embedded_template.wasm
72a07f94b0bc88b9123a6e41058e37ab9ca70d84a03b79511b25af7f435129b5  node_modules/tree-sitter-wasms/out/tree-sitter-tlaplus.wasm
93a5022855314cdb45458c7bb026a24a0ebc3a5ff6439e542e881f14dfa13a39  node_modules/tree-sitter-wasms/out/tree-sitter-ruby.wasm
4409921a70d0aa5bec7d1d7ce809a557a8ee1cf6ace901e3ac6a76e62cfea903  node_modules/tree-sitter-wasms/out/tree-sitter-rust.wasm
7f5364e4256cf7e55efd01dd52421ef2663caa8061b82659b7e4bf61064545ec  node_modules/tree-sitter-wasms/out/tree-sitter-dart.wasm
6266a7e32d68a3459104d994dc848df15d5672b0ea8e86d327274b694f8e6991  node_modules/tree-sitter-wasms/out/tree-sitter-c_sharp.wasm
fdb5219abe058369e16897aaa11eecf47ef4f546752c3ddbac339cdd89e1e667  node_modules/tree-sitter-wasms/out/tree-sitter-json.wasm
63812b9e275d26851264734868d27a1656bd44a2ef6eb3e85e6b03728c595ab5  node_modules/tree-sitter-wasms/out/tree-sitter-javascript.wasm
f6afdf53bfd6de76557bb7edb624a3a3869e14d9a83b78433f93617ecee42527  node_modules/tree-sitter-wasms/out/tree-sitter-cpp.wasm
5dea7cfff83d41d8f87fb8e434e1a5b292c0d670bfcdc42cb2af420ef490dde5  node_modules/tree-sitter-wasms/out/tree-sitter-yaml.wasm
41c4fdb2249a3aa6d87eed0d383081ff09725c2248b4977043a43825980ffcc7  node_modules/tree-sitter-wasms/out/tree-sitter-swift.wasm
60849b6320ee956233d77b017c65c45660e507d03ae70aa1bd5783458e2e9e18  node_modules/tree-sitter-wasms/out/tree-sitter-ocaml.wasm
6aa3b2c70e76f5d48eafef1093e9c4de383e13f2fdde2f4e9b98a378f6a8f1b6  node_modules/tree-sitter-wasms/out/tree-sitter-tsx.wasm
807dcdb1380a59befb112ed8fbd3d3872c7fadaf5903a769282b50973b30696d  node_modules/tree-sitter-wasms/out/tree-sitter-bash.wasm
7c1b5bfdca7e64b6c63b6040bb7ba0afc347df116f9030ca32f8535d7377f6ff  node_modules/tree-sitter-wasms/out/tree-sitter-objc.wasm
deedb03ccf150329ddfcc4ed92861c235bbae6f9692be6b93cac71617a4d42ab  node_modules/tree-sitter-wasms/out/tree-sitter-elisp.wasm
8515404dceed38e1ed86aa34b09fcf3379fff1b4ff9dd3967bcd6d1eb5ac3d8f  node_modules/tree-sitter-wasms/out/tree-sitter-typescript.wasm
59cc4531aa661e2de4c5bc04e4045b6bdd5d2bfa75045cbda5f673102d140eef  node_modules/tree-sitter-wasms/out/tree-sitter-zig.wasm
ae18d46336768b6c0eea07eb0b003408848766b3b67df1d807b40cbd93017bda  node_modules/tree-sitter-wasms/out/tree-sitter-rescript.wasm
82e91b9759ddca30d8978ebbfa8e347b4451b64c931f9ae62112e6db9b8fac20  node_modules/tree-sitter-wasms/out/tree-sitter-elixir.wasm
11b3405c1543fb012f5ed7f8ee73125076dce8b168301e1e787e4c717da6b456  node_modules/tree-sitter-wasms/out/tree-sitter-html.wasm
75ef809136d610068c5b2135741d89f5df62690a3d55169203351cb7cc85727d  node_modules/tree-sitter-wasms/out/tree-sitter-lua.wasm
a0e3e242f337ef84bef7969f807fba71364815c26ca75c6268f71d5d28bdf570  node_modules/tree-sitter-javascript/tree-sitter-javascript.wasm
40f2f51199e4f5fc46fa6b985fb3461bb63e6cd86c62bfa9bcee45ed4438d5fb  node_modules/fsevents/fsevents.node
```

Installed executable entry-point SHA-256 (`find node_modules/.bin -type l -exec shasum -a 256 {} +`, exit 0):

```
dc022adc093b9b79e1a0ef4b6bc3e6a52e3d627102113dad4afacbbe81f13a26  node_modules/.bin/node-gyp-build
27e6a2d2e63549eb0b3c2d9a9067b7646f9157a120b7f345a12a1e20c997a998  node_modules/.bin/prebuild-install
e4eb9be1a3e3feb3f8979ef08c3bf3ef8430f4f22df9c4e427353a1577accbe8  node_modules/.bin/nanoid
98d6df62aa3c84284db17944a2a8017f911640e9c4d3de907a9f93b467ee47c8  node_modules/.bin/rolldown
bd6c871026985937dc945011fc54b74b47f5998154216d7b8d40d5ed782e4402  node_modules/.bin/semver
de5833362e640673962f16e255bf8738d4380a68601b9af26217eee4e1bac36d  node_modules/.bin/vite
e0b3a3a04166e6ecf1020cb31c0c4a54432c16d6d88714bd4de2214cf67dec81  node_modules/.bin/node-gyp-build-optional
82383f5748af5f9380dbcde8f0166088614bf024e25bdbe073bb87cd385336ba  node_modules/.bin/rc
34c19ff8b6675d6d27c63a7df44d77a442805eeea8756d1c89e0264f4a3028f6  node_modules/.bin/node-gyp-build-test
```

## Bundle measurements

P00 baseline (`impl-plans/progress/syntax-p00-bundle-size.md`): `.` 160599/42528, `./engine` 158740/42723, `./json` 2853/1387, `./diff` 3011/1269 bytes raw/gzip. Language entries did not exist in the baseline.

After: `node scripts/bundle-size.mjs --entries all --out tmp/syntax-p12/after.json` (exit 0; `tmp/syntax-highlighting-20261102/syntax-p12-comparison-evidence/after.log`). The exact JSON follows:

```json
{
  "root": "/Users/taco/gits/tacogips/emaki",
  "gitHead": "93020c4c0a3f8973cc615d8ee41ecd91e67fafb5",
  "entries": {
    ".": {
      "file": "src/index.ts",
      "raw": 160599,
      "gzip": 42528
    },
    "./engine": {
      "file": "src/engine.ts",
      "raw": 158740,
      "gzip": 42723
    },
    "./json": {
      "file": "src/language/json.ts",
      "raw": 2853,
      "gzip": 1387
    },
    "./diff": {
      "file": "src/diff/index.ts",
      "raw": 3011,
      "gzip": 1269
    },
    "./languages": {
      "file": "src/language/registry.ts",
      "raw": 15239,
      "gzip": 4085,
      "lazyChunks": [
        {
          "raw": 441,
          "gzip": 289
        },
        {
          "raw": 640,
          "gzip": 337
        },
        {
          "raw": 551,
          "gzip": 355
        },
        {
          "raw": 420,
          "gzip": 289
        },
        {
          "raw": 510,
          "gzip": 345
        },
        {
          "raw": 593,
          "gzip": 323
        },
        {
          "raw": 580,
          "gzip": 372
        },
        {
          "raw": 1905,
          "gzip": 807
        },
        {
          "raw": 474,
          "gzip": 298
        },
        {
          "raw": 1012,
          "gzip": 542
        },
        {
          "raw": 1075,
          "gzip": 443
        },
        {
          "raw": 1269,
          "gzip": 536
        },
        {
          "raw": 861,
          "gzip": 399
        },
        {
          "raw": 374,
          "gzip": 237
        },
        {
          "raw": 561,
          "gzip": 360
        },
        {
          "raw": 438,
          "gzip": 286
        },
        {
          "raw": 307,
          "gzip": 228
        },
        {
          "raw": 876,
          "gzip": 390
        },
        {
          "raw": 319,
          "gzip": 219
        },
        {
          "raw": 419,
          "gzip": 300
        },
        {
          "raw": 752,
          "gzip": 425
        },
        {
          "raw": 3784,
          "gzip": 1622
        },
        {
          "raw": 725,
          "gzip": 388
        },
        {
          "raw": 1037,
          "gzip": 449
        },
        {
          "raw": 467,
          "gzip": 273
        },
        {
          "raw": 1153,
          "gzip": 426
        },
        {
          "raw": 1298,
          "gzip": 545
        },
        {
          "raw": 448,
          "gzip": 300
        },
        {
          "raw": 701,
          "gzip": 345
        },
        {
          "raw": 491,
          "gzip": 313
        },
        {
          "raw": 569,
          "gzip": 353
        },
        {
          "raw": 743,
          "gzip": 403
        },
        {
          "raw": 3543,
          "gzip": 1189
        },
        {
          "raw": 1373,
          "gzip": 707
        },
        {
          "raw": 409,
          "gzip": 284
        },
        {
          "raw": 222,
          "gzip": 184
        },
        {
          "raw": 1264,
          "gzip": 496
        },
        {
          "raw": 390,
          "gzip": 268
        },
        {
          "raw": 1129,
          "gzip": 524
        },
        {
          "raw": 354,
          "gzip": 253
        },
        {
          "raw": 1182,
          "gzip": 387
        },
        {
          "raw": 587,
          "gzip": 334
        },
        {
          "raw": 1238,
          "gzip": 586
        },
        {
          "raw": 1016,
          "gzip": 520
        },
        {
          "raw": 830,
          "gzip": 395
        },
        {
          "raw": 1494,
          "gzip": 464
        },
        {
          "raw": 726,
          "gzip": 406
        },
        {
          "raw": 836,
          "gzip": 451
        },
        {
          "raw": 1018,
          "gzip": 384
        },
        {
          "raw": 1023,
          "gzip": 463
        },
        {
          "raw": 800,
          "gzip": 383
        },
        {
          "raw": 991,
          "gzip": 547
        },
        {
          "raw": 227,
          "gzip": 171
        },
        {
          "raw": 691,
          "gzip": 377
        },
        {
          "raw": 535,
          "gzip": 332
        },
        {
          "raw": 1118,
          "gzip": 480
        },
        {
          "raw": 520,
          "gzip": 307
        },
        {
          "raw": 349,
          "gzip": 234
        },
        {
          "raw": 495,
          "gzip": 286
        },
        {
          "raw": 631,
          "gzip": 315
        },
        {
          "raw": 228,
          "gzip": 200
        },
        {
          "raw": 1034,
          "gzip": 494
        },
        {
          "raw": 894,
          "gzip": 480
        },
        {
          "raw": 1239,
          "gzip": 479
        },
        {
          "raw": 1338,
          "gzip": 629
        },
        {
          "raw": 685,
          "gzip": 362
        },
        {
          "raw": 849,
          "gzip": 435
        },
        {
          "raw": 687,
          "gzip": 388
        },
        {
          "raw": 491,
          "gzip": 310
        },
        {
          "raw": 294,
          "gzip": 213
        },
        {
          "raw": 392,
          "gzip": 252
        },
        {
          "raw": 463,
          "gzip": 267
        },
        {
          "raw": 982,
          "gzip": 451
        },
        {
          "raw": 222,
          "gzip": 183
        },
        {
          "raw": 243,
          "gzip": 187
        },
        {
          "raw": 727,
          "gzip": 395
        },
        {
          "raw": 392,
          "gzip": 261
        },
        {
          "raw": 1005,
          "gzip": 538
        },
        {
          "raw": 486,
          "gzip": 323
        }
      ]
    },
    "./languages/actionscript": {
      "file": "src/language/langs/actionscript.ts",
      "raw": 6012,
      "gzip": 2403
    },
    "./languages/applescript": {
      "file": "src/language/langs/applescript.ts",
      "raw": 4362,
      "gzip": 1842
    },
    "./languages/asp": {
      "file": "src/language/langs/asp.ts",
      "raw": 10447,
      "gzip": 3401
    },
    "./languages/bash": {
      "file": "src/language/langs/bash.ts",
      "raw": 5415,
      "gzip": 2216
    },
    "./languages/batch": {
      "file": "src/language/langs/batch.ts",
      "raw": 5505,
      "gzip": 2247
    },
    "./languages/bibtex": {
      "file": "src/language/langs/bibtex.ts",
      "raw": 4315,
      "gzip": 1829
    },
    "./languages/c": {
      "file": "src/language/langs/c.ts",
      "raw": 6151,
      "gzip": 2456
    },
    "./languages/clojure": {
      "file": "src/language/langs/clojure.ts",
      "raw": 5261,
      "gzip": 2147
    },
    "./languages/cpp": {
      "file": "src/language/langs/cpp.ts",
      "raw": 6583,
      "gzip": 2600
    },
    "./languages/csharp": {
      "file": "src/language/langs/csharp.ts",
      "raw": 6646,
      "gzip": 2518
    },
    "./languages/css": {
      "file": "src/language/langs/css.ts",
      "raw": 4897,
      "gzip": 1975
    },
    "./languages/d": {
      "file": "src/language/langs/d.ts",
      "raw": 6432,
      "gzip": 2482
    },
    "./languages/diff": {
      "file": "src/language/langs/diff.ts",
      "raw": 4096,
      "gzip": 1753
    },
    "./languages/dockerfile": {
      "file": "src/language/langs/dockerfile.ts",
      "raw": 5893,
      "gzip": 2384
    },
    "./languages/dot": {
      "file": "src/language/langs/dot.ts",
      "raw": 6009,
      "gzip": 2396
    },
    "./languages/erb": {
      "file": "src/language/langs/erb.ts",
      "raw": 11135,
      "gzip": 3534
    },
    "./languages/erlang-html": {
      "file": "src/language/langs/erlang-html.ts",
      "raw": 10978,
      "gzip": 3480
    },
    "./languages/erlang": {
      "file": "src/language/langs/erlang.ts",
      "raw": 4598,
      "gzip": 1905
    },
    "./languages/fish": {
      "file": "src/language/langs/fish.ts",
      "raw": 5414,
      "gzip": 2217
    },
    "./languages/go": {
      "file": "src/language/langs/go.ts",
      "raw": 6323,
      "gzip": 2481
    },
    "./languages/graphql": {
      "file": "src/language/langs/graphql.ts",
      "raw": 6296,
      "gzip": 2473
    },
    "./languages/groovy": {
      "file": "src/language/langs/groovy.ts",
      "raw": 6608,
      "gzip": 2525
    },
    "./languages/haml": {
      "file": "src/language/langs/haml.ts",
      "raw": 4189,
      "gzip": 1787
    },
    "./languages/haskell": {
      "file": "src/language/langs/haskell.ts",
      "raw": 4875,
      "gzip": 1939
    },
    "./languages/hcl": {
      "file": "src/language/langs/hcl.ts",
      "raw": 6869,
      "gzip": 2606
    },
    "./languages/html": {
      "file": "src/language/langs/html.ts",
      "raw": 9397,
      "gzip": 3131
    },
    "./languages/ini": {
      "file": "src/language/langs/ini.ts",
      "raw": 4683,
      "gzip": 1975
    },
    "./languages/java": {
      "file": "src/language/langs/java.ts",
      "raw": 6314,
      "gzip": 2487
    },
    "./languages/javascript": {
      "file": "src/language/langs/javascript.ts",
      "raw": 7158,
      "gzip": 2601
    },
    "./languages/json": {
      "file": "src/language/langs/json.ts",
      "raw": 1373,
      "gzip": 707
    },
    "./languages/jsp": {
      "file": "src/language/langs/jsp.ts",
      "raw": 12787,
      "gzip": 4059
    },
    "./languages/jsx": {
      "file": "src/language/langs/jsx.ts",
      "raw": 7221,
      "gzip": 2622
    },
    "./languages/kotlin": {
      "file": "src/language/langs/kotlin.ts",
      "raw": 6835,
      "gzip": 2562
    },
    "./languages/latex": {
      "file": "src/language/langs/latex.ts",
      "raw": 4353,
      "gzip": 1842
    },
    "./languages/lisp": {
      "file": "src/language/langs/lisp.ts",
      "raw": 5116,
      "gzip": 2103
    },
    "./languages/lua": {
      "file": "src/language/langs/lua.ts",
      "raw": 4904,
      "gzip": 1890
    },
    "./languages/makefile": {
      "file": "src/language/langs/makefile.ts",
      "raw": 4309,
      "gzip": 1844
    },
    "./languages/markdown": {
      "file": "src/language/langs/markdown.ts",
      "raw": 4960,
      "gzip": 2057
    },
    "./languages/matlab": {
      "file": "src/language/langs/matlab.ts",
      "raw": 4552,
      "gzip": 1901
    },
    "./languages/nix": {
      "file": "src/language/langs/nix.ts",
      "raw": 5216,
      "gzip": 1974
    },
    "./languages/objc": {
      "file": "src/language/langs/objc.ts",
      "raw": 6297,
      "gzip": 2466
    },
    "./languages/objcpp": {
      "file": "src/language/langs/objcpp.ts",
      "raw": 6407,
      "gzip": 2509
    },
    "./languages/ocaml": {
      "file": "src/language/langs/ocaml.ts",
      "raw": 4740,
      "gzip": 1897
    },
    "./languages/pascal": {
      "file": "src/language/langs/pascal.ts",
      "raw": 6594,
      "gzip": 2539
    },
    "./languages/perl": {
      "file": "src/language/langs/perl.ts",
      "raw": 4522,
      "gzip": 1891
    },
    "./languages/php": {
      "file": "src/language/langs/php.ts",
      "raw": 12758,
      "gzip": 4055
    },
    "./languages/plaintext": {
      "file": "src/language/langs/plaintext.ts",
      "raw": 227,
      "gzip": 171
    },
    "./languages/properties": {
      "file": "src/language/langs/properties.ts",
      "raw": 4919,
      "gzip": 2049
    },
    "./languages/protobuf": {
      "file": "src/language/langs/protobuf.ts",
      "raw": 6106,
      "gzip": 2454
    },
    "./languages/python": {
      "file": "src/language/langs/python.ts",
      "raw": 4840,
      "gzip": 1983
    },
    "./languages/r": {
      "file": "src/language/langs/r.ts",
      "raw": 4242,
      "gzip": 1816
    },
    "./languages/rd": {
      "file": "src/language/langs/rd.ts",
      "raw": 4071,
      "gzip": 1746
    },
    "./languages/regexp": {
      "file": "src/language/langs/regexp.ts",
      "raw": 4217,
      "gzip": 1801
    },
    "./languages/restructuredtext": {
      "file": "src/language/langs/restructuredtext.ts",
      "raw": 4353,
      "gzip": 1827
    },
    "./languages/ruby": {
      "file": "src/language/langs/ruby.ts",
      "raw": 4756,
      "gzip": 1982
    },
    "./languages/rust": {
      "file": "src/language/langs/rust.ts",
      "raw": 6465,
      "gzip": 2529
    },
    "./languages/scala": {
      "file": "src/language/langs/scala.ts",
      "raw": 6810,
      "gzip": 2553
    },
    "./languages/sql": {
      "file": "src/language/langs/sql.ts",
      "raw": 4407,
      "gzip": 1878
    },
    "./languages/svelte": {
      "file": "src/language/langs/svelte.ts",
      "raw": 9900,
      "gzip": 3262
    },
    "./languages/swift": {
      "file": "src/language/langs/swift.ts",
      "raw": 6258,
      "gzip": 2453
    },
    "./languages/tcl-html": {
      "file": "src/language/langs/tcl-html.ts",
      "raw": 10550,
      "gzip": 3419
    },
    "./languages/tcl": {
      "file": "src/language/langs/tcl.ts",
      "raw": 4213,
      "gzip": 1822
    },
    "./languages/tex": {
      "file": "src/language/langs/tex.ts",
      "raw": 4114,
      "gzip": 1762
    },
    "./languages/textile": {
      "file": "src/language/langs/textile.ts",
      "raw": 4185,
      "gzip": 1784
    },
    "./languages/toml": {
      "file": "src/language/langs/toml.ts",
      "raw": 5210,
      "gzip": 2113
    },
    "./languages/tsx": {
      "file": "src/language/langs/tsx.ts",
      "raw": 7221,
      "gzip": 2624
    },
    "./languages/typescript": {
      "file": "src/language/langs/typescript.ts",
      "raw": 7242,
      "gzip": 2623
    },
    "./languages/vue": {
      "file": "src/language/langs/vue.ts",
      "raw": 9781,
      "gzip": 3241
    },
    "./languages/xml": {
      "file": "src/language/langs/xml.ts",
      "raw": 5064,
      "gzip": 2108
    },
    "./languages/yaml": {
      "file": "src/language/langs/yaml.ts",
      "raw": 4727,
      "gzip": 1987
    },
    "./languages/zig": {
      "file": "src/language/langs/zig.ts",
      "raw": 6057,
      "gzip": 2410
    }
  },
  "skipped": []
}

```

## Results and completion criteria

- [x] `node scripts/perf.mjs --suite langs --langs typescript,python,rust,html --out perf-results/syntax-p12/canvas-cmp` exited 0; full log `tmp/syntax-highlighting-20261102/syntax-p12-comparison-evidence/perf-canvas.log`. A spike smoke overlapped the WebKit Rust slice, so `node scripts/perf.mjs --suite langs --browser webkit --langs rust --out perf-results/syntax-p12/canvas-webkit-rust` was repeated without overlap (exit 0; `tmp/syntax-highlighting-20261102/syntax-p12-comparison-evidence/perf-canvas-webkit-rust.log`). Section 10 uses that replacement slice. All canvas gates pass.
- [x] `node scripts/perf.mjs --suite langs --dist "$TMPDIR/emaki-ts-spike/dist" --langs typescript,python,rust,html --out perf-results/syntax-p12/treesitter-final` exited 1, as expected for measured budget misses; full log `tmp/syntax-highlighting-20261102/syntax-p12-comparison-evidence/perf-ts-final.log`. Key p95 misses: Chromium HTML 25.7 ms; WebKit Python 17 ms and HTML 33 ms. The initial run was interrupted (exit 130; `tmp/syntax-highlighting-20261102/syntax-p12-comparison-evidence/perf-ts.log`) to correct its re-highlight counter to include query time; its results are superseded.
- [x] The spike sizes were measured from built assets with gzip; command output and byte counts: `tmp/syntax-highlighting-20261102/syntax-p12-comparison-evidence/spike-sizes.log`. The bundle gates pass: core delta 0 bytes, registry 4085 bytes gzip, all 71 languages within limits (`tmp/syntax-highlighting-20261102/syntax-p12-comparison-evidence/bundle-gates.log`).
- [x] Design §10 records all comparison rows, bundle entries, embedding evidence, licenses and per-file line counts. The §3.3 rule confirms the canvas-native decision. No hybrid proposal is triggered: canvas passed and tree-sitter did not pass every budget.
- [x] `npx vitest run test/language/embedded.test.ts` exited 0 (3 tests; `tmp/syntax-highlighting-20261102/syntax-p12-comparison-evidence/embedded.log`). `npx vitest run test/boundary.test.ts` exited 0 (2 tests; `tmp/syntax-highlighting-20261102/syntax-p12-comparison-evidence/boundary-final.log`). `grep -c 'blocked:\|TBD' design-docs/specs/design-syntax-highlighting.md` printed 0 and exited 1 (no matches; `tmp/syntax-highlighting-20261102/syntax-p12-comparison-evidence/placeholders.log`).
- [ ] Pre/post per-file hashes are unavailable. `git diff --stat -- src test scripts examples package.json` exited 0; pre/post stat logs compare identical (`scope.log`, `scope-final.log`, `scope-compare.log` under the evidence directory). These paths contain existing sibling work; P12 made no edits there. This stat comparison is not a file-hash comparison.

The raw comparison, summaries and environment metadata are under `perf-results/syntax-p12/`. The full bundle JSON and toolchain hashes are above. All checks ran on a shared working tree; final stable integration verification is downstream.

Built spike `.wasm` SHA-256 (`find "$TMPDIR/emaki-ts-spike/dist" -name '*.wasm' -type f -exec shasum -a 256 {} +`, exit 0):

```
5fc615467b1b98420ed7517e5bf9e1f88468132dd903d842dfb13714f6a1cb0c  /var/folders/wn/q3_zjgs15t9_367s8627fd0w0000gn/T//emaki-ts-spike/dist/assets/tree-sitter-css-CBTpjut-.wasm
f38dcc4b43b818f9a0785bc1c6d5611a75ac4cdd428ff3f02757c34ca4e46d7f  /var/folders/wn/q3_zjgs15t9_367s8627fd0w0000gn/T//emaki-ts-spike/dist/assets/tree-sitter-qKYAACSa.wasm
8515404dceed38e1ed86aa34b09fcf3379fff1b4ff9dd3967bcd6d1eb5ac3d8f  /var/folders/wn/q3_zjgs15t9_367s8627fd0w0000gn/T//emaki-ts-spike/dist/assets/tree-sitter-typescript-CJTR_Zg_.wasm
11b3405c1543fb012f5ed7f8ee73125076dce8b168301e1e787e4c717da6b456  /var/folders/wn/q3_zjgs15t9_367s8627fd0w0000gn/T//emaki-ts-spike/dist/assets/tree-sitter-html-DQIQtd-o.wasm
9056d0fb0c337810d019fae350e8167786119da98f0f282aceae7ab89ee8253b  /var/folders/wn/q3_zjgs15t9_367s8627fd0w0000gn/T//emaki-ts-spike/dist/assets/tree-sitter-python-cGXEcG0A.wasm
4409921a70d0aa5bec7d1d7ce809a557a8ee1cf6ace901e3ac6a76e62cfea903  /var/folders/wn/q3_zjgs15t9_367s8627fd0w0000gn/T//emaki-ts-spike/dist/assets/tree-sitter-rust-BKz9L6EP.wasm
63812b9e275d26851264734868d27a1656bd44a2ef6eb3e85e6b03728c595ab5  /var/folders/wn/q3_zjgs15t9_367s8627fd0w0000gn/T//emaki-ts-spike/dist/assets/tree-sitter-javascript-CgNCF_LE.wasm
```

## Current-turn recheck

The accepted P10 dependency is present in dispatch. `node scripts/bundle-size.mjs --entries all --out tmp/syntax-p12/after-recheck.json` exited 0 (`tmp/syntax-highlighting-20261102/syntax-p12-comparison-evidence/after-recheck.log`); its JSON is byte-identical to `after.json` (`bundle-compare-recheck.log`, exit 0). `npx vitest run test/boundary.test.ts test/language/embedded.test.ts` exited 0 with 5 tests passed (`tests-recheck.log`). The placeholder grep printed 0 and exited 1 (`placeholders-recheck.log`); the scoped diff command exited 0 (`scope-recheck.log`). All these log paths are under `tmp/syntax-highlighting-20261102/syntax-p12-comparison-evidence/`.

SHA-256 manifests of every current file under `src`, `test`, `scripts`, and `examples`, plus `package.json`, match before and after this recheck (`scope-before-current.sha256`, `scope-after-current.sha256`, and `scope-hash-recheck.log`, exit 0). This confirms no changes during this recheck only; it does not recover the missing pre-implementation hashes identified above. The original plan-wide pre/post hash requirement remains unverified and needs the original snapshot or an authorized disposition. Formal reviews and finalization remain downstream.

## Operator disposition (2026-11-04)

The workflow stopped P12 only because no pre-edit per-file hash snapshot of non-owned paths was captured, which reruns cannot recover. The operator accepted P12 after a manual scope check: no tree-sitter or web-tree-sitter reference exists under src, test, scripts, examples, package.json, vite.config.ts or tsconfig.json; package.json adds only the language exports and THIRD_PARTY_NOTICES.md; the spike stayed under $TMPDIR. Combined-tree gates passed: npm run check, npm test (335/335), npm run build, npm run perf (Chromium and WebKit, 8 languages, allPass), npm run e2e (10/10), and scripts/bundle-size.mjs (core `.` raw 160599 unchanged).
