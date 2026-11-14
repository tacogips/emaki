# vimhost-p01-engine-contract progress

Implementation complete on the shared moving tree. The accepted design §§12.2–12.6 and C-R5-1 guided the additive host types, action registry and ex aliases, hook defaults, conditional renderers, full facade snapshot, coalesced delivery, tapMode and userEvent forwarding. No test files were edited by this plan. The public adapter, action schema, new regression tests, documentation, formal reviews and serial finalization belong to downstream plans or steps.

Core baseline was captured before source edits: `tmp/vim-host-20261111/vimhost-p01-engine-contract/core-before.json`, command exit 0. A shell wrapper initially reported exit 1 due to zsh's readonly `status` variable after the baseline command had run; the command was immediately rerun successfully before source edits.

SHA-256 before → after:
- `src/vim/host.ts`: `3b2841cec18caa61aa55b4734d4d9dbb3212d892c8f63902989f4bdb7854eca6` → `657b125fc86f149447b95f7e553d5b1de9354cad2306bd8f6ff64da6334a9ed5`
- `src/vim/types.ts`: `d5c2b4e7f4ac3732626ed09655fc337e181d33f108c4c16dc6078a03137e935b` → `4cb1cc11d47ab95c2157e4b45b79358a9c2e49e34c03578194e51c39162cdd2e`
- `src/vim/controller.ts`: `91672896d5d4f7aec134516b97c01da79605e2169bee7bb1337f109e5d3c854c` → `a0677a5c0d352e72494a80e43d073deb74d1ef9525ba6f390912e8a729c9712f`

Final-source verification on the moving shared tree (logs in `tmp/vim-host-20261111/vimhost-p01-engine-contract/`):
- `npx tsc --noEmit`: 0 (`tsc-final.log`).
- `npx vitest run test/vim`: 0, 1183 passed (`vim-final.log`).
- `npx vitest run test/boundary.test.ts test/vim/purity.test.ts`: 0, 5 passed (`boundary-final.log`).
- `git diff --name-only 6351463 -- src ':!src/vim'`: 0, empty (`diff-final.log`).
- `git diff -U0 6351463 -- src/vim/host.ts`: 0, additive except the two specified signature lines (`host-diff-final.log`).

Completion criteria satisfied for this plan; downstream integration and stable serial verification remain pending.

## IR-W3-2 redispatch

Added `VimController.blur()` and a facade delegate through `wrapped(() => engine.blur())`, preserving the engine algorithm and coalescing. This exposes the focus-loss seam needed by p07. SHA-256 before → after: `src/vim/host.ts` `657b125fc86f149447b95f7e553d5b1de9354cad2306bd8f6ff64da6334a9ed5` → `4f95a970eba14594876c4f6062d5d5f61c8a54756ba25aa4443c0e608db415a7`; `src/vim/controller.ts` `a0677a5c0d352e72494a80e43d073deb74d1ef9525ba6f390912e8a729c9712f` → `70a3bd3ad955ca89bd4e4c6d8b616366a2826084c523835f31f6e8d38d5593d6`. The host change is one added line relative to the recorded prior hash.

Current shared-tree checks: `npx tsc --noEmit` exit 0; boundary/purity exit 0 (5/5); core source diff exit 0 and empty. `npx vitest run test/vim` exit 1 (1274 passed, 1 failed): the known p05 host-action exception propagation defect in `src/vim/mapper.ts` remains outside this plan's write scope. Logs use the `ir-w3-2-` prefix under the plan artifact root. The required aggregate must be rerun after IR-W3-1 lands. The p07 blur behavioral regression and independent reviews remain downstream.

## Amendment round 1 verification

The earlier aggregate failure is superseded for p01 by the accepted amendment: mapper parity is retained, and p05 owns the exception tests. No source edit was necessary on redispatch; the existing IR-W3-2 repair remains present. Current SHA-256: host `4f95a970eba14594876c4f6062d5d5f61c8a54756ba25aa4443c0e608db415a7`; controller `70a3bd3ad955ca89bd4e4c6d8b616366a2826084c523835f31f6e8d38d5593d6`; types `4cb1cc11d47ab95c2157e4b45b79358a9c2e49e34c03578194e51c39162cdd2e`.

Fresh moving-tree verification, logs under `tmp/vim-host-20261111/vimhost-p01-engine-contract/`: `npx tsc --noEmit` exit 0 (`amendment-r1-tsc.log`); `npx vitest run test/vim --exclude test/vim/host-actions.test.ts` exit 0, 1250 passed (`amendment-r1-vim.log`); boundary and purity exit 0, 5 passed (`amendment-r1-boundary.log`); core source diff exit 0 and empty (`amendment-r1-core-diff.log`); host additive diff exit 0 (`amendment-r1-host-diff.log`). Baseline bundle evidence was captured before the original source edits. Plan implementation criteria are satisfied; unfiltered aggregate, p07 tests and formal reviews are downstream.
