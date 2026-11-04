# P10 performance harness progress

Implementation complete; formal integrity, adversarial and integration reviews remain downstream. P09 dependency accepted by dispatch. The language demo loads raw fixtures and lazy languages, exposes timing counters, and installs the existing performance hook. The harness supports suite, dist and language selection while retaining JSON and diff budgets. Vite emits the language page and separate chunks.

## Verification (foreground, current source)

Logs are under `tmp/syntax-highlighting-20261102/syntax-p10-perf-harness/`.

| Command | Exit | Log |
|---|---:|---|
| `npm run check` | 0 | `check-final.log` |
| `npm run build` | 0 | `build-final.log` |
| `node scripts/perf.mjs --self-test` | 0 | `selftest.log` |
| `node scripts/perf.mjs --suite bogus` | 2 (expected) | `bogus.log` |
| `npm run perf -- --out perf-results/syntax-p10/full` | 0 | `perf.log` |
| `npm run e2e` | 0 (10 tests) | `e2e.log` |
| `npx vitest run test/boundary.test.ts` | 0 (2 tests) | `boundary.log` |
| `node scripts/perf.mjs --suite langs --langs typescript --browser chromium --loads 1 --keys 20 --out perf-results/syntax-p10/typescript-smoke` | 0 | `typescript-smoke.log` |
| Four TypeScript gate names assertion | 0 | `smoke-gates.log` |
| Built page and separate chunk count assertion | 0 | `chunks.log` |

The full run uses the default five loads and 200 keys for both browsers and every language; all 76 gates pass. The initial check failed on an incorrect `startState` call and was corrected; its log is `check.log`. Full raw measurements and environment are in `perf-results/syntax-p10/full/`.

## Full summary.json

```json
{
  "gates": [
    {
      "browser": "chromium",
      "name": "firstPaintMs",
      "value": 62.400000005960464,
      "budget": 200,
      "pass": true
    },
    {
      "browser": "chromium",
      "name": "scrollWorkP95",
      "value": 8.800000011920929,
      "budget": 16.7,
      "pass": true
    },
    {
      "browser": "chromium",
      "name": "keyWorkP95",
      "value": 8,
      "budget": 16.7,
      "pass": true
    },
    {
      "browser": "chromium",
      "name": "nextFrameRatio",
      "value": 1,
      "budget": 0.95,
      "pass": true
    },
    {
      "browser": "chromium",
      "name": "sizeScaling",
      "value": 3.5,
      "budget": 6.400000035762787,
      "pass": true
    },
    {
      "browser": "chromium",
      "name": "diffLatencyP95",
      "value": 32.599999994039536,
      "budget": 100,
      "pass": true
    },
    {
      "browser": "chromium",
      "name": "firstPaintMs@typescript",
      "value": 66.2000000178814,
      "budget": 200,
      "pass": true
    },
    {
      "browser": "chromium",
      "name": "scrollWorkP95@typescript",
      "value": 8.800000011920929,
      "budget": 16.7,
      "pass": true
    },
    {
      "browser": "chromium",
      "name": "keyWorkP95@typescript",
      "value": 8.299999982118607,
      "budget": 16.7,
      "pass": true
    },
    {
      "browser": "chromium",
      "name": "nextFrameRatio@typescript",
      "value": 1,
      "budget": 0.95,
      "pass": true
    },
    {
      "browser": "chromium",
      "name": "firstPaintMs@python",
      "value": 54.099999994039536,
      "budget": 200,
      "pass": true
    },
    {
      "browser": "chromium",
      "name": "scrollWorkP95@python",
      "value": 7.700000017881393,
      "budget": 16.7,
      "pass": true
    },
    {
      "browser": "chromium",
      "name": "keyWorkP95@python",
      "value": 8,
      "budget": 16.7,
      "pass": true
    },
    {
      "browser": "chromium",
      "name": "nextFrameRatio@python",
      "value": 1,
      "budget": 0.95,
      "pass": true
    },
    {
      "browser": "chromium",
      "name": "firstPaintMs@rust",
      "value": 62.29999998211861,
      "budget": 200,
      "pass": true
    },
    {
      "browser": "chromium",
      "name": "scrollWorkP95@rust",
      "value": 7.9000000059604645,
      "budget": 16.7,
      "pass": true
    },
    {
      "browser": "chromium",
      "name": "keyWorkP95@rust",
      "value": 9.199999958276749,
      "budget": 16.7,
      "pass": true
    },
    {
      "browser": "chromium",
      "name": "nextFrameRatio@rust",
      "value": 1,
      "budget": 0.95,
      "pass": true
    },
    {
      "browser": "chromium",
      "name": "firstPaintMs@c",
      "value": 64.40000000596046,
      "budget": 200,
      "pass": true
    },
    {
      "browser": "chromium",
      "name": "scrollWorkP95@c",
      "value": 8.099999994039536,
      "budget": 16.7,
      "pass": true
    },
    {
      "browser": "chromium",
      "name": "keyWorkP95@c",
      "value": 7.999999970197678,
      "budget": 16.7,
      "pass": true
    },
    {
      "browser": "chromium",
      "name": "nextFrameRatio@c",
      "value": 1,
      "budget": 0.95,
      "pass": true
    },
    {
      "browser": "chromium",
      "name": "firstPaintMs@markdown",
      "value": 47.900000005960464,
      "budget": 200,
      "pass": true
    },
    {
      "browser": "chromium",
      "name": "scrollWorkP95@markdown",
      "value": 7.0999999940395355,
      "budget": 16.7,
      "pass": true
    },
    {
      "browser": "chromium",
      "name": "keyWorkP95@markdown",
      "value": 8.499999970197678,
      "budget": 16.7,
      "pass": true
    },
    {
      "browser": "chromium",
      "name": "nextFrameRatio@markdown",
      "value": 1,
      "budget": 0.95,
      "pass": true
    },
    {
      "browser": "chromium",
      "name": "firstPaintMs@html",
      "value": 65.2000000178814,
      "budget": 200,
      "pass": true
    },
    {
      "browser": "chromium",
      "name": "scrollWorkP95@html",
      "value": 11.599999994039536,
      "budget": 16.7,
      "pass": true
    },
    {
      "browser": "chromium",
      "name": "keyWorkP95@html",
      "value": 7.800000011920929,
      "budget": 16.7,
      "pass": true
    },
    {
      "browser": "chromium",
      "name": "nextFrameRatio@html",
      "value": 1,
      "budget": 0.95,
      "pass": true
    },
    {
      "browser": "chromium",
      "name": "firstPaintMs@css",
      "value": 62.80000001192093,
      "budget": 200,
      "pass": true
    },
    {
      "browser": "chromium",
      "name": "scrollWorkP95@css",
      "value": 8.700000017881393,
      "budget": 16.7,
      "pass": true
    },
    {
      "browser": "chromium",
      "name": "keyWorkP95@css",
      "value": 8,
      "budget": 16.7,
      "pass": true
    },
    {
      "browser": "chromium",
      "name": "nextFrameRatio@css",
      "value": 1,
      "budget": 0.95,
      "pass": true
    },
    {
      "browser": "chromium",
      "name": "firstPaintMs@yaml",
      "value": 46.80000001192093,
      "budget": 200,
      "pass": true
    },
    {
      "browser": "chromium",
      "name": "scrollWorkP95@yaml",
      "value": 6.699999988079071,
      "budget": 16.7,
      "pass": true
    },
    {
      "browser": "chromium",
      "name": "keyWorkP95@yaml",
      "value": 8.099999994039536,
      "budget": 16.7,
      "pass": true
    },
    {
      "browser": "chromium",
      "name": "nextFrameRatio@yaml",
      "value": 1,
      "budget": 0.95,
      "pass": true
    },
    {
      "browser": "webkit",
      "name": "firstPaintMs",
      "value": 81,
      "budget": 200,
      "pass": true
    },
    {
      "browser": "webkit",
      "name": "scrollWorkP95",
      "value": 8,
      "budget": 16.7,
      "pass": true
    },
    {
      "browser": "webkit",
      "name": "keyWorkP95",
      "value": 9,
      "budget": 16.7,
      "pass": true
    },
    {
      "browser": "webkit",
      "name": "nextFrameRatio",
      "value": 1,
      "budget": 0.95,
      "pass": true
    },
    {
      "browser": "webkit",
      "name": "sizeScaling",
      "value": 8,
      "budget": 16,
      "pass": true
    },
    {
      "browser": "webkit",
      "name": "diffLatencyP95",
      "value": 32,
      "budget": 100,
      "pass": true
    },
    {
      "browser": "webkit",
      "name": "firstPaintMs@typescript",
      "value": 82,
      "budget": 200,
      "pass": true
    },
    {
      "browser": "webkit",
      "name": "scrollWorkP95@typescript",
      "value": 8,
      "budget": 16.7,
      "pass": true
    },
    {
      "browser": "webkit",
      "name": "keyWorkP95@typescript",
      "value": 9,
      "budget": 16.7,
      "pass": true
    },
    {
      "browser": "webkit",
      "name": "nextFrameRatio@typescript",
      "value": 1,
      "budget": 0.95,
      "pass": true
    },
    {
      "browser": "webkit",
      "name": "firstPaintMs@python",
      "value": 89,
      "budget": 200,
      "pass": true
    },
    {
      "browser": "webkit",
      "name": "scrollWorkP95@python",
      "value": 8,
      "budget": 16.7,
      "pass": true
    },
    {
      "browser": "webkit",
      "name": "keyWorkP95@python",
      "value": 8,
      "budget": 16.7,
      "pass": true
    },
    {
      "browser": "webkit",
      "name": "nextFrameRatio@python",
      "value": 1,
      "budget": 0.95,
      "pass": true
    },
    {
      "browser": "webkit",
      "name": "firstPaintMs@rust",
      "value": 77,
      "budget": 200,
      "pass": true
    },
    {
      "browser": "webkit",
      "name": "scrollWorkP95@rust",
      "value": 8,
      "budget": 16.7,
      "pass": true
    },
    {
      "browser": "webkit",
      "name": "keyWorkP95@rust",
      "value": 9,
      "budget": 16.7,
      "pass": true
    },
    {
      "browser": "webkit",
      "name": "nextFrameRatio@rust",
      "value": 1,
      "budget": 0.95,
      "pass": true
    },
    {
      "browser": "webkit",
      "name": "firstPaintMs@c",
      "value": 68,
      "budget": 200,
      "pass": true
    },
    {
      "browser": "webkit",
      "name": "scrollWorkP95@c",
      "value": 7,
      "budget": 16.7,
      "pass": true
    },
    {
      "browser": "webkit",
      "name": "keyWorkP95@c",
      "value": 7,
      "budget": 16.7,
      "pass": true
    },
    {
      "browser": "webkit",
      "name": "nextFrameRatio@c",
      "value": 1,
      "budget": 0.95,
      "pass": true
    },
    {
      "browser": "webkit",
      "name": "firstPaintMs@markdown",
      "value": 50,
      "budget": 200,
      "pass": true
    },
    {
      "browser": "webkit",
      "name": "scrollWorkP95@markdown",
      "value": 7,
      "budget": 16.7,
      "pass": true
    },
    {
      "browser": "webkit",
      "name": "keyWorkP95@markdown",
      "value": 8,
      "budget": 16.7,
      "pass": true
    },
    {
      "browser": "webkit",
      "name": "nextFrameRatio@markdown",
      "value": 1,
      "budget": 0.95,
      "pass": true
    },
    {
      "browser": "webkit",
      "name": "firstPaintMs@html",
      "value": 72,
      "budget": 200,
      "pass": true
    },
    {
      "browser": "webkit",
      "name": "scrollWorkP95@html",
      "value": 8,
      "budget": 16.7,
      "pass": true
    },
    {
      "browser": "webkit",
      "name": "keyWorkP95@html",
      "value": 9,
      "budget": 16.7,
      "pass": true
    },
    {
      "browser": "webkit",
      "name": "nextFrameRatio@html",
      "value": 1,
      "budget": 0.95,
      "pass": true
    },
    {
      "browser": "webkit",
      "name": "firstPaintMs@css",
      "value": 79,
      "budget": 200,
      "pass": true
    },
    {
      "browser": "webkit",
      "name": "scrollWorkP95@css",
      "value": 7,
      "budget": 16.7,
      "pass": true
    },
    {
      "browser": "webkit",
      "name": "keyWorkP95@css",
      "value": 8,
      "budget": 16.7,
      "pass": true
    },
    {
      "browser": "webkit",
      "name": "nextFrameRatio@css",
      "value": 1,
      "budget": 0.95,
      "pass": true
    },
    {
      "browser": "webkit",
      "name": "firstPaintMs@yaml",
      "value": 55,
      "budget": 200,
      "pass": true
    },
    {
      "browser": "webkit",
      "name": "scrollWorkP95@yaml",
      "value": 7,
      "budget": 16.7,
      "pass": true
    },
    {
      "browser": "webkit",
      "name": "keyWorkP95@yaml",
      "value": 7,
      "budget": 16.7,
      "pass": true
    },
    {
      "browser": "webkit",
      "name": "nextFrameRatio@yaml",
      "value": 1,
      "budget": 0.95,
      "pass": true
    }
  ],
  "allPass": true
}
```
