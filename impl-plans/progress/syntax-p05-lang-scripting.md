# P05 scripting implementation progress

Intent: implement the 14 languages and fixture tests described by P05, using P01's grammar contract and design sections 5.4 and 6. P01 was admitted by dispatch. No shared or protected source paths were changed. Registry integration, formal reviews, commit and push belong to later workflow steps.

## Hashes

Pre-edit snapshot (SHA-256, or absent):
```
Pre-edit intent: create 14 language modules, 14 fixtures, expectation and test files, and progress log. Files absent at inspection; refuse overwrite if any appears. No shared files edited.
src/language/langs/python.ts absent
src/language/langs/ruby.ts absent
src/language/langs/perl.ts absent
src/language/langs/lua.ts absent
src/language/langs/r.ts absent
src/language/langs/tcl.ts absent
src/language/langs/bash.ts absent
src/language/langs/fish.ts absent
src/language/langs/batch.ts absent
src/language/langs/applescript.ts absent
src/language/langs/makefile.ts absent
src/language/langs/dockerfile.ts absent
src/language/langs/sql.ts absent
src/language/langs/regexp.ts absent
test/fixtures/languages/python.py absent
test/fixtures/languages/ruby.rb absent
test/fixtures/languages/perl.pl absent
test/fixtures/languages/lua.lua absent
test/fixtures/languages/r.r absent
test/fixtures/languages/tcl.tcl absent
test/fixtures/languages/bash.sh absent
test/fixtures/languages/fish.fish absent
test/fixtures/languages/batch.bat absent
test/fixtures/languages/applescript.applescript absent
test/fixtures/languages/makefile.mk absent
test/fixtures/languages/dockerfile.dockerfile absent
test/fixtures/languages/sql.sql absent
test/fixtures/languages/regexp.re absent
test/language/expectations/scripting.ts absent
test/language/langs/scripting.test.ts absent
impl-plans/progress/syntax-p05-lang-scripting.md absent
```
Post-edit source SHA-256:
```
src/language/langs/python.ts 8fb6dc341dc74c11bb41244cd3ae1ddbab7629aa7c5cfdc9bc195113e0eba63c
src/language/langs/ruby.ts 3b1a0c2495cd55e0f3bcb542f7518d74ed87e488ce06720cc5d4cfb748503f43
src/language/langs/perl.ts 09ceed712861a4657c085126c7cee6e8d82cffb652c0b653fb986a88bcc56f80
src/language/langs/lua.ts ff38c09449dbb6b98dd031962b35ef17658f81a160de603b5e411c87ab2588af
src/language/langs/r.ts e0d222d950fce373ed43a6429e8ddbd60903ddb3ff3fbfb2fc86db509fabefa2
src/language/langs/tcl.ts 9d49b016f193822e680f3051083f734cddd7e75f779b69ac1a40992d71439277
src/language/langs/bash.ts 2b313816c6ba9ab9d3b6f2524b8043c14b3b4008102dbaa413761f2c078fcff7
src/language/langs/fish.ts a7bde817534ade97196306c68b7c4b7bdd2860de36f67125f620bffeb91e6f75
src/language/langs/batch.ts 943dd961b0ad043e0111a59f3f85e8213c56bd0a3cd811d003af25af767924e1
src/language/langs/applescript.ts 608959e87d0e97f16887f886683c868d6486caa96a8ac41e6153a4f28f32a03a
src/language/langs/makefile.ts ef2da6be931ed35075fcfa26b67d4b62352eab3029ab4643cb1bc986f229b633
src/language/langs/dockerfile.ts 91de3462e4159fd6f6c4d12ef80dc9b4c9944df74a8f66a5828ae683147d3091
src/language/langs/sql.ts 9832978223f5683dae7bd0a97794de1abc212e235fdb5eef2466ccd0b126e6c4
src/language/langs/regexp.ts 188ad55ecc42a106a886418f5f1841f95a3b3bf460ac450d31adcd6c5101b4bf
test/fixtures/languages/python.py 7d15af5bd94836bd6e7ca045af5d1e20578f043b0d501e47fa861f00efb9c9f8
test/fixtures/languages/ruby.rb ef5d76364b3ad6932baab70d9e1679657013c230235859455911c1a90235edaa
test/fixtures/languages/perl.pl e8b40a3ad05167d7a6f036e180417df7e6ae74ffa0ada99e50c1541b1d4625a9
test/fixtures/languages/lua.lua 7bb3e6b5218533652774abb881a3a39fab15494aad9dbb200eb1e6ef4934e05e
test/fixtures/languages/r.r b10700af0646b569abf4bb6fdb20c30deb91aa3eea6cb317a978d7d5f147d751
test/fixtures/languages/tcl.tcl 351ad46ef691914607508a934adef010035c122e40285bb039651bab45502d32
test/fixtures/languages/bash.sh e3b0535e84ac238f522ae8850947ad7f9cc57ac8acb8a09417e7f61e49c7663a
test/fixtures/languages/fish.fish b9f7998bb0cee68da7d51c098907397c58a6e81c92a616e680660b0f4bf2ef4c
test/fixtures/languages/batch.bat ed72ffe073e3b20766613a04913379bad1c4687c05176b2c39c37715130c9d92
test/fixtures/languages/applescript.applescript 39306ac9c3f4231f90aadecf2ae5b6dd4857ac9266fc0bd1b1796198260fcb82
test/fixtures/languages/makefile.mk 6820ca7ee324995f87d6cb882e4867f906ab21a0d7e67cc68f8dc1dee09a78dd
test/fixtures/languages/dockerfile.dockerfile df699211cb2916cbab2461f9e90643de2b006353cc795f09c7c2e926c402a495
test/fixtures/languages/sql.sql 7cb214985d747915a5eeea4bfc2ccd885381c5394a9bdbfc280b9880f745854b
test/fixtures/languages/regexp.re 617140e245f24234da34435a39af597630f3de0235636e7708dd6d66eb45faa5
test/language/expectations/scripting.ts 9ecc9a3c3f0fcc1532d1fac96cedc2e76467fe5d098ecb7a5069cb5e7aea2190
test/language/langs/scripting.test.ts 0cc1b249b1c39e5c9d11534ce9332817a1a2c0065f4b00627ccba3cd3859c91e
```
Per-edit intent and snapshots: `tmp/syntax-p05/intent.txt`, `repair1-intent.log`, `fixture-expansion-intent.log`, `typefix-intent.log`, `add-tests-intent.log`, and corresponding pre-edit logs under `tmp/syntax-p05/`.

## Verification

- `npx vitest run test/language/langs/scripting.test.ts > tmp/syntax-p05/test-final2.log 2>&1`: exit 0, 21 tests passed.
- `npm run check > tmp/syntax-p05/check-final2.log 2>&1`: exit 0; no diagnostics.
- P05 owned-path check grep: exit 1, no matches, `tmp/syntax-p05/check-owned.log`.
- `npx vitest run test/boundary.test.ts > tmp/syntax-p05/boundary-final2.log 2>&1`: exit 0, 2 tests passed.
- P05 owned-path boundary grep: exit 1, no matches, `tmp/syntax-p05/boundary-owned.log`.
- Earlier `test-attempt1.log` exited 1 (two fixture expectations), corrected. Earlier `check.log` exited 1 (readonly test helper), corrected. Final-source gates above supersede them.
- All tests run on the moving shared tree; serial integration must repeat aggregate gates. No non-owned diagnostics observed in final logs.

## Current verification and completion

The execution contract explicitly authorizes the evidence directory. The previous evidence-path blocker is resolved. On the current moving shared tree:

- `npx vitest run test/language/langs/scripting.test.ts`: exit 0, 21 passed; `tmp/syntax-highlighting-20261102/syntax-p05-lang-scripting/test.log`.
- `npm run check`: exit 0, `tmp/syntax-highlighting-20261102/syntax-p05-lang-scripting/check.log`.
- Owned check grep: exit 1, no matches; `tmp/syntax-highlighting-20261102/syntax-p05-lang-scripting/check-owned.log`.
- `npx vitest run test/boundary.test.ts`: exit 0, 2 passed; `tmp/syntax-highlighting-20261102/syntax-p05-lang-scripting/boundary.log`.
- Owned boundary grep: exit 1, no matches; `tmp/syntax-highlighting-20261102/syntax-p05-lang-scripting/boundary-owned.log`.
- All 14 fixture files have 20–21 lines. No non-owned diagnostics appeared in the current logs. Implementation criteria are complete; formal review and serial integration remain downstream.

Blockers: none.
