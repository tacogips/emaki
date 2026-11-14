# P04 web implementation progress

Intent snapshot: implement the nine named compiled languages and static HTML/Vue/Svelte embeds; provide 20–60 line samples including NAnt and four or more expectations per language; pass the scoped behavioral test and owned-path diagnostic checks; retain hashes, logs and blockers. The accepted design and P04 plan align; P01 is accepted in runtime dispatch.

Pre-edit states and exact intentions, including the initial absence and subsequent fresh contents and SHA-256 hashes, are preserved in `tmp/syntax-p04/intent-01.json` through `intent-08.json` (the initial sequence includes `.txt` files for 02–04). Final source SHA-256 hashes:

- `src/language/langs/javascript.ts`: `6f2738c944bbcc5df45027404711614d86690250acaaf80fc2df4921a717b24e`
- `src/language/langs/typescript.ts`: `0ee5fafa95e11cb511219574af225b16a38697bc4b8018dc688b80668642a071`
- `src/language/langs/tsx.ts`: `135ef7bfef70161ab30419ffa09ce0cb0e45132006b87453e7589aa3ba92f223`
- `src/language/langs/jsx.ts`: `e3d5e38942ec0de8b6c7118dbe42fbf9881687d9cefa55af941ff8500850bb63`
- `src/language/langs/css.ts`: `5483e89c8f8810e047a6f4b5b078dc4919cf071fd446e939212832e8e1691636`
- `src/language/langs/html.ts`: `552bb3e5b1b755fa6aa96ca2da3e591f98745b95e47a67d0ec6580df1cf37cc5`
- `src/language/langs/xml.ts`: `730efd7d7d8294ff34192a2eaf26e907bd186f151abf906e08ad6918defe42b2`
- `src/language/langs/vue.ts`: `f89595354da26e413cbea480ce55ff8f5fbe9d265c5ef043d8b80c99f2f0e103`
- `src/language/langs/svelte.ts`: `8aea012e31f497fe734e7be5491267eb52f7ca4011a3ed4776671e55b31866a1`
- `test/fixtures/languages/javascript.js`: `6f233db35bebd2ac072735ee555a2bca67d5e353a67c1b5e18ef5ea8ae7ae330`
- `test/fixtures/languages/typescript.ts`: `4576e57347d206e47dc920aede2767e69fd66bc9f85fd7ad21ebc28cf018b598`
- `test/fixtures/languages/tsx.tsx`: `c372800f43afad36041c31a054ebebfce43ca84a42a79a3a56e8a3d912526a8e`
- `test/fixtures/languages/jsx.jsx`: `e5cd00e1da49acfe2fac7addfded130c2b223ae4f7f31a3edafa833bf003ad47`
- `test/fixtures/languages/css.css`: `9a13b41852ff4e6c25f589a74d154b465551b95c02cfce9c5b0b68d14e3742ef`
- `test/fixtures/languages/html.html`: `bc8d99d3dcb1d4530307826491377451f1f37586876e7fc518a9c441eb59c555`
- `test/fixtures/languages/xml.xml`: `a4d1d64530e9e251d3e44d0c71426476aa76cb759f9fda15d66e82f5fb290a66`
- `test/fixtures/languages/vue.vue`: `df84349c32b55568a1ca4f3957298a851ab9de361362a86e954cf9429318cc16`
- `test/fixtures/languages/svelte.svelte`: `563ae8e4a3686ffb469e0bd0a3338cabe2cc1fc8da90ebb2814cd5f3e8f7ed94`
- `test/fixtures/languages/nant.build`: `3ec3e05eeb3a1643e27e4e9ec58b5bee29c696747d61318ae79919ab2aaf3b8c`
- `test/language/expectations/web.ts`: `d8dc8c87c1c4486b0f8c2e0c9b372709456eb521bf3173c59c1de890ea9dd032`
- `test/language/langs/web.test.ts`: `f0b562c502f4d7a362b3c52f910e76d114b8a51553c13b48d35a636d319964c3`

Final verification on the moving shared tree, with complete logs in `tmp/syntax-highlighting-20261102/syntax-p04-lang-web/`:
- `npx vitest run test/language/langs/web.test.ts`: exit 0, 18 tests passed, `test.log`.
- `npm run check`: exit 0, `check.log`; owned-path grep exit 1, no matches, `check-owned.log`.
- `npx vitest run test/boundary.test.ts`: exit 0, 2 tests passed, `boundary.log`; owned-path grep exit 1, no matches, `boundary-owned.log`.
- Fixtures contain 21–22 lines each. No non-owned diagnostics in final logs. Earlier moving-tree check diagnostics in `tmp/syntax-p04/check.log` belonged to P05 (`test/language/langs/scripting.test.ts`); final check has no diagnostics.

Blockers: none. The Vue multiline-opening-tag and Svelte nested-brace limitations remain as accepted in the design; TSX generic arrows can be tagged as JSX. Formal review, registry wiring and commit are downstream workflow work.
