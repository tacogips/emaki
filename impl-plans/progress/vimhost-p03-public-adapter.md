# vimhost-p03-public-adapter progress

Implemented the public snapshot, options, guarded tapMode, and low-level wrapper with platform and scheduler defaults; facade getters remain live. The update bridge remains unchanged. The public API test checks the documented value list and snapshot assignability.

- `src/vim/index.ts` SHA-256: `1126b7eb06d69ed44b605f652282d66d7854d2305e55fb137b3e960f44d74bfb`
- `test/vim/public-api.test.ts` SHA-256: `6cba7a2d4ded6942a4c9c7e758ee620e97f7c5e75e5185bb105877a41dc47bc4`
- `npx tsc --noEmit`: exit 0.
- `npx vitest run test/vim`: exit 0, 1183 tests passed, including unchanged editor integration.
- `npx vitest run test/boundary.test.ts test/vim/purity.test.ts`: exit 0, 5 tests passed.
- `cd examples/tauri-editor && npm run check`: exit 0.
- `rg -n 'navigator' src/vim`: only `src/vim/index.ts`.

Logs are under `tmp/vim-host-20261111/vimhost-p03-public-adapter/`. Checks ran on the shared working tree; formal reviews and serial integration remain downstream.
