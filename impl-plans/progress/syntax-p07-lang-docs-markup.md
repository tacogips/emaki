# P07 progress

Intent: implement twelve assigned language entries; Markdown dynamic fences, YAML blocks, plaintext and JSON re-export; eleven 20–60 line fixtures and expectations; focused tests, owned diagnostics and hashes.

Dependency: syntax-p01-engine-contract accepted by runtime dispatch. Design §§4.3, 5.3 and 6 align with plan.

Pre-edit SHA-256 values were absent for all files (tmp/syntax-p07/intent.json); per-edit intent and pre-edit contents for the correction are in tmp/syntax-p07/edit-2-intent.txt, edit-2-before.txt and edit-2-sha.txt.

Post-edit SHA-256:
- src/language/langs/markdown.ts: 1af0c046ef9149031e888ba23f4bb2e9609f04c8dc28b3494cf4a39da1bab1f2
- src/language/langs/restructuredtext.ts: 8159918fcd205dcbc15afd22269e576ccc6507ed93f074120830e2995dc8ed5f
- src/language/langs/textile.ts: 1013333980fa933d1f587a9b3df79ad738d2101d612102361cfb4652d11d6d25
- src/language/langs/latex.ts: 2d70a09864f08cdf3f346058ddcfffec85b97435cd1ff4b7ab7905b8c9eb48bf
- src/language/langs/tex.ts: 3b03d11ee582d6ffb236dd12bf110a753e9b1b0dbae0a66075dca593c52548c4
- src/language/langs/bibtex.ts: 8802acefabca6054f33d8c47a340f12626f973541fd52932a6744b086d17209c
- src/language/langs/rd.ts: 8c68f6582739cba007757628223b47fd6d64da2285a4e74baf08b031d5c25f8a
- src/language/langs/diff.ts: f9ba0d2b85b7dd212ff47837b25c422a0f8dc29e7d568c610e417e31429ba9e9
- src/language/langs/yaml.ts: d760b204ace274f36f6b413d11c2d954308bc04b26954f24b82ab346cff3a570
- src/language/langs/haml.ts: 304fd60718f0c1fa10389bed25f2f7f6e8643a165cd52bcc394d15d1b84325a2
- src/language/langs/plaintext.ts: 7ece3cbcd6a213b70d8d28b48dd3006454ccd706ff2b73e683b0adbf9a278735
- src/language/langs/json.ts: fb10e90cdc0e35bcc589bc3da5346e752bb3ef4e4adcb3b61d7f8aa8dfd85f36
- test/fixtures/languages/markdown.md: e969649ee739c6a8792da7758afb88d3535d479d09f66555994eab670876d6df
- test/fixtures/languages/restructuredtext.rst: bbe7416c54413aa90e827f87c3691259bcbcdc41e181b20556510316dcfdc0a4
- test/fixtures/languages/textile.textile: bb5b000a2417e8c80ccf89a5de11cd43444d2d3b6303630cb20ab372d16a85c7
- test/fixtures/languages/latex.tex: 9afb995eedf3ead451f362a7c788d47b18b09c81c862ef5c07cf03e35ba929a8
- test/fixtures/languages/tex.tex: 0e054671f54af759b5a7869a5f353d0f8c406741b3e3cdeba07635801f173beb
- test/fixtures/languages/bibtex.bib: 6d9469631184d4fb767e67a37de4092f90c30c0277f9f272df945c995dffddf5
- test/fixtures/languages/rd.rd: 72d2b6c8fff18d6a0e5172fbefba7f3fb7528e8b91c19b05362de71e46c8c228
- test/fixtures/languages/diff.diff: e78aad0c668650de0b323b37f0051cd1edfc5c7e1c0d578b92f93c97e4a8add8
- test/fixtures/languages/yaml.yaml: f2954892eb167c0d848d21b17e95cac35c9f1da55a9f7c7144b4d98e0025d006
- test/fixtures/languages/haml.haml: 37abdca3be4e82bda1b19cf6ce6640ac71be5564e5594651d44518075a2cdf39
- test/fixtures/languages/json.json: ced4453d4950c6d4ce6fb1cf65c8459a79a85d72846156b827fb0ffd519a3995
- test/language/expectations/docs-markup.ts: 1801c1fc9efec87ed23135c2c1782c3e8a8570b5c2bb0ae895a6348d6ae89fe6
- test/language/langs/docs-markup.test.ts: d8371761a662bd5fdc90c5cf25553efc9ecf1edaed2bfcfecc7f670daeb8dbce

Verification on moving shared tree (all paths relative to repository root):
- npx vitest run test/language/langs/docs-markup.test.ts: exit 0, 13 passed; tmp/syntax-p07/test.log.
- npx vitest run test/language/json.test.ts: exit 0, 3 passed; tmp/syntax-p07/json-test.log.
- npm run check: exit 0; tmp/syntax-p07/check.log.
- owned check grep: exit 1, no matches; tmp/syntax-p07/check-owned.log.
- npx vitest run test/boundary.test.ts: exit 0, 2 passed; tmp/syntax-p07/boundary.log.
- owned boundary grep: exit 1, no matches; tmp/syntax-p07/boundary-owned.log.
- Initial focused test exit 1 (Haml marker assertion), corrected; tmp/syntax-p07/test-initial.log.

Fresh moving-tree verification: the runtime explicitly authorizes the evidence directory `tmp/syntax-highlighting-20261102/syntax-p07-lang-docs-markup/`; the earlier evidence-path blocker is resolved. Focused docs-markup: exit 0, 13 passed (`test.log`); JSON regression: exit 0, 3 passed (`json-test.log`); npm run check: exit 0 (`check.log`); boundary: exit 0, 2 passed (`boundary.log`); both owned-path greps: exit 1 with no matches (`check-owned.log`, `boundary-owned.log`). No non-owned diagnostics or remaining blockers. All listed log names are in that evidence directory. Serial stable-tree gates remain downstream.

Formal integrity and adversarial reviews, registry integration and final commit remain downstream.
