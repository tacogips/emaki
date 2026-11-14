# P08 implementation progress

- Implemented additive C1 keymap replacement and cmdline access, construction-time map initialization, and ex bang forwarding; added regression tests including pending-prefix reset.
- Per-edit intended behavior and pre/post SHA-256 hashes: `tmp/vim-20261111/vim-p08-engine-keymap-contract/*.intent.json`.
- `npx vitest run test/vim`: exit 1; 1151 passed, 1 failed. `tmp/vim-20261111/vim-p08-engine-keymap-contract/vitest.log` records the sibling-owned `src/vim/keymap-store.ts` DOM-global purity failure. Rerun after p09 resolves it.
- `npx vitest run test/vim/search-ex.test.ts`: exit 0; 73 passed. Log: `tmp/vim-20261111/vim-p08-engine-keymap-contract/search-ex.log`.
- `npx tsc --noEmit`: exit 0. Log: `tmp/vim-20261111/vim-p08-engine-keymap-contract/tsc.log`.
- `git diff --name-only f204032b695104f402d3217542d7fb06f56feeed -- src ':!src/vim'`: exit 0, empty. Log: `tmp/vim-20261111/vim-p08-engine-keymap-contract/core-diff.log`.
- `git diff -U0 f204032b695104f402d3217542d7fb06f56feeed -- src/vim/host.ts`: exit 0, additions only. Log: `tmp/vim-20261111/vim-p08-engine-keymap-contract/c1-diff.log`.
- Results reflect the moving shared tree. Formal review, integration, and finalization are downstream.

## Redispatch verification

- `npx vitest run test/vim`: exit 1; 1151 passed, 1 failed. `tmp/vim-20261111/vim-p08-engine-keymap-contract/redispatch-vitest.log` confirms the unchanged sibling-owned purity failure. The p09 amendment to `test/vim/purity.test.ts` is required before rerunning.
- `npx vitest run test/vim/search-ex.test.ts`: exit 0; 73 passed. Log: `tmp/vim-20261111/vim-p08-engine-keymap-contract/redispatch-search-ex.log`.
- `npx tsc --noEmit`: exit 0. Log: `tmp/vim-20261111/vim-p08-engine-keymap-contract/redispatch-tsc.log`.
- Core boundary diff: exit 0, empty. Log: `tmp/vim-20261111/vim-p08-engine-keymap-contract/redispatch-core-diff.log`.
- C1 diff: exit 0, additive only. Log: `tmp/vim-20261111/vim-p08-engine-keymap-contract/redispatch-c1-diff.log`.
- These checks ran on the moving shared tree; formal review remains downstream. UF-2 is a low evidence-provenance risk and requires no repair.

## RF-1 evidence-only rerun

The earlier purity blocker is resolved by the p09 UF-1 amendment associated with checkpoint 57dac59; the preceding failed runs are historical. No p08 source or test was edited in this rerun. Source SHA-256: host.ts `3b2841cec18caa61aa55b4734d4d9dbb3212d892c8f63902989f4bdb7854eca6`, controller.ts `91672896d5d4f7aec134516b97c01da79605e2169bee7bb1337f109e5d3c854c`, search-ex.test.ts `8309efbd9705dfb6759347fa8d9c607edad8e9c0287749cfc258622561679e3d` (unchanged).

- `npx vitest run test/vim`: exit 0, 34 files, 1152/1152 tests passed. Log: `tmp/vim-20261111/vim-p08-engine-keymap-contract/rerun3-vitest.log`.
- `npx vitest run test/vim/search-ex.test.ts`: exit 0, 73/73 passed. Log: `tmp/vim-20261111/vim-p08-engine-keymap-contract/rerun3-search-ex.log`.
- `npx tsc --noEmit`: exit 0. Log: `tmp/vim-20261111/vim-p08-engine-keymap-contract/rerun3-tsc.log`.
- `git diff --name-only f204032b695104f402d3217542d7fb06f56feeed -- src ':!src/vim'`: exit 0, empty. Log: `tmp/vim-20261111/vim-p08-engine-keymap-contract/rerun3-core-diff.log`.
- `git diff -U0 f204032b695104f402d3217542d7fb06f56feeed -- src/vim/host.ts`: exit 0, additions only. Log: `tmp/vim-20261111/vim-p08-engine-keymap-contract/rerun3-c1-diff.log`.

Implementation criteria and required verification are complete on the shared tree. Test-integrity and adversarial decisions remain downstream. UF-2 remains a low historical evidence-provenance risk.
