# Snapshot tests implementation progress

Implemented `test/vim/snapshot.test.ts`: snapshot fields, subscription and public delivery, delayed hints, hop labels and selection, default/all-off and independent render switches. Tests use the shared working tree. Formal review and serial integration remain downstream.

| Reference case | Disposition and evidence |
| --- | --- |
| controller snapshot subscription lifecycle | Ported: snapshot delivery and public payload cases. |
| controller-io pending register/count and mode labels/cursor | Existing `test/vim/controller-io.test.ts`; snapshot fields and operator cursor additionally tested in `snapshot.test.ts`. |
| delayed hints and suspended timeout | Ported: delayed hints case advances 100 ms and 5000 ms; mapping completion clears hints. |
| Escape closes hints; blur clears mapper/hop | Ported through exported `createVimController`: hop blur clears hop and pending with one delivery; operator-pending blur returns to normal, clears pending and preserves the document. Escape and input flush are also tested. |
| char hop label and jump | Ported against snapshot and host selection in `test/vim/snapshot.test.ts`. |
| hop Escape clears overlay | Ported snapshot cancellation; existing `test/vim/hop.test.ts` checks marks. |
| visual hop extends selection | Ported in `snapshot.test.ts`. |
| operator hop deletes inclusively | Ported against snapshot and document in `test/vim/snapshot.test.ts`. |
| mark argument avoids hop; disabled hop inert | Ported against snapshot and selection in `test/vim/snapshot.test.ts`. |
| recorded hop replay | Existing `test/vim/keymap-controller.test.ts` verifies recorded replay and cursor positions. |
| hint entry construction and hop session labels | Existing `test/vim/hints.test.ts` and `test/vim/hop.test.ts` cover these algorithms. |
| status mode label, pending, recording, search, info/error | Snapshot data covered here and in existing controller tests; framework DOM, role and reactive rendering assertions excluded as UI rendering. |
| status prompt focus, submit, composition, cancel, mode button, disposal | Framework DOM/event assertions excluded; tapMode owned by p09 and prompt controller behavior by existing tests. |

Verification logs under `tmp/vim-host-20261111/vimhost-p07-snapshot-tests/`. The initial visual-hop fixture omitted the visual mapping and then sent a multi-character label as one key; attempts 02 and 04 record these failures and attempt 05 passes after correcting the fixture.

Amendment round 1: the two public blur cases pass in `amendment-r1-snapshot.log` (17 tests). TypeScript and boundary verification are recorded in `amendment-r1-tsc.log` and `amendment-r1-boundary.log`. These checks run on the shared working tree; formal review and serial integration remain downstream.
