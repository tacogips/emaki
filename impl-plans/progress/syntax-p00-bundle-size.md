# P00 bundle-size progress

Implementation complete; formal review and finalization remain downstream. The archived baseline was extracted read-only from `1de212f` with `git archive 1de212f src package.json` into `tmp/syntax-p00/baseline-clean`, using the plan-local artifact directory as `TMPDIR`. The script changes its working directory to the measured root because Vite emits module path comments relative to the process working directory; otherwise identical sources produce different size measurements.

Baseline JSON:

```json
{
  "root": "/Users/taco/gits/tacogips/emaki/tmp/syntax-p00/baseline-clean",
  "gitHead": null,
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
    }
  },
  "skipped": []
}
```

- [x] Script supports core/all entries, missing entry reporting, in-memory Vite builds, static and lazy chunks, gzip, and JSON output.
- [x] Current core measurement exits 0; `.` is 160599 raw and 42528 gzip bytes, equal to the baseline. All four entries match.
- [x] Invalid option and nonexistent root exit 2.
- [x] Owned-path boundary grep prints nothing (exit 1). The workspace-wide boundary test is informational per plan: 1 of 2 tests fails on `tmp/syntax-highlighting-20261102/checkpoint/gen.mjs` (forbidden text and disallowed import), a checkpoint artifact outside P00 ownership; no P00 violation was reported.
- [x] Build uses `write: false`; dist remains unchanged.

Evidence directory: `tmp/syntax-highlighting-20261102/syntax-p00-bundle-size/`. Final source logs: `baseline-v2.log` (exit 0), `current-v2.log` (exit 0), `bogus-v2.log` (exit 2), `root-v2.log` (exit 2), `boundary-v2.log` (exit 1, 2 tests, 1 failed), `boundary-grep-v2.log` (exit 1, no matches). Earlier baseline logs exposed module-path-dependent sizes before the correction and are retained as prior evidence.

Fresh shared-tree verification: `baseline-recheck.log` and `current-recheck.log` both exit 0 and report identical sizes for all four entries, including `.` at 160599 raw and 42528 gzip bytes. `bogus-recheck.log` and `root-recheck.log` exit 2 as expected. `boundary-recheck.log` exits 0 (2 tests passed); `boundary-grep-recheck.log` exits 1 with no matches. `dist-recheck.log` is empty (exit 0). The earlier boundary failure above was transient and the fresh run passes. Archive and extraction logs are `archive-recheck.log` and `extract-recheck.log` (both exit 0). Formal review and finalization remain downstream.
