---
title: Test Results Format
description: Structured JSON output that CCL test runners emit so external tools — dashboards, CI checks, viewers — can analyze results without re-parsing runner-specific text.
---

CCL test runners emit a structured JSON document describing each test outcome. Dashboards, CI checks, viewers, and the cross-implementation matrix on this site all consume that document. This page covers the shape, the design principle behind it, and how to derive the breakdowns you usually want.

:::note
The authoritative schema lives in [`schemas/test-results-format.json`](https://github.com/CatConfLang/ccl-test-data/blob/main/schemas/test-results-format.json) in the ccl-test-data repo. Worked examples for consumer-side aggregation are in [`docs/consuming-results.md`](https://github.com/CatConfLang/ccl-test-data/blob/main/docs/consuming-results.md).
:::

## Why a Standard Output Format

Without a shared schema, every dashboard or comparison tool has to special-case each runner's output (text, TAP, JUnit, ad-hoc JSON). The results format gives third-party tools one shape to consume, regardless of which language the runner is written in.

If you're building a runner, emit this. If you're building a viewer or CI check, consume this.

## Design Principle: Raw Outcomes, Consumer-Side Aggregation

The format contains **only raw per-test outcomes** plus their tag metadata (`features`, `behaviors`, `variants`). It deliberately does **not** pre-compute pass/fail counts, feature-support matrices, or compliance scores.

Different consumers want different aggregations, and everything they need is already in the per-test records. A runner that pre-computed a "feature support summary" would lock consumers into one particular view.

:::tip[For runner authors]
Don't add summary printouts ("Feature support: comments 100%") to your runner's output. Emit the results document; let consumers derive whatever breakdown they need.
:::

## Document Shape

Every results document has four top-level fields:

```json
{
  "$schema": "https://raw.githubusercontent.com/CatConfLang/ccl-test-data/v1.1.0/schemas/test-results-format.json",
  "generatedAt": "2026-04-30T18:21:09Z",
  "implementation": {
    "name": "ccl-typescript",
    "version": "0.6.0",
    "language": "typescript",
    "variant": "reference_compliant",
    "implementedFunctions": ["parse", "build_hierarchy", "compose"]
  },
  "testSuite": {
    "version": "v1.1.0",
    "totalTests": 412
  },
  "tests": [ /* array of TestOutcome */ ]
}
```

### `$schema`

Pin to a release tag URL (e.g. `…/v1.1.0/schemas/test-results-format.json`). This declares which version of the format the document targets and lets consumers reject documents whose shape they can't yet read.

### `implementation`

Identifies the implementation under test. The interesting field is **`implementedFunctions`** — the set of functions the implementation actually has wired up.

This list is the only piece of metadata that **cannot be recovered from outcomes alone**. Without it, a consumer can't distinguish "function not implemented" (the runner emitted `todo` for every test of that function) from "function implemented but failing" (some pass, some fail). Always include it.

### `testSuite`

`version` (optional) is the test-suite version string from the corpus's `.version` file. Including it lets viewers correlate runs over time against the same corpus.

`totalTests` should equal `tests.length`; consumers should treat a mismatch as a soft warning.

### `tests`

A flat array of `TestOutcome` records. One record per `(test name, validation function)` pair.

## TestOutcome

```json
{
  "name": "multiline_key_basic",
  "validation": "parse",
  "features": ["multiline_keys", "whitespace"],
  "behaviors": [],
  "variants": [],
  "outcome": "fail",
  "error": "expected 2 entries, got 1",
  "durationMs": 0.42
}
```

| Field | Required | Notes |
|---|---|---|
| `name` | yes | Test name from the corpus. |
| `validation` | yes | CCL function being validated (`parse`, `build_hierarchy`, …). Free-form string — viewers should tolerate unknown values. |
| `features` | yes | Feature tags from the test case. Empty array allowed. |
| `behaviors` | yes | Behavior tags from the test case. Empty array allowed. |
| `variants` | yes | Variant tags from the test case. Empty array allowed. |
| `outcome` | yes | One of `"pass"`, `"fail"`, `"skip"`, `"todo"`. |
| `reason` | no | Human-readable reason for `skip` or `todo`. |
| `error` | no | Human-readable error message for `fail`. |
| `durationMs` | no | Per-test execution time in milliseconds. |

The tag arrays are **always present** (even when empty), so consumers never have to branch on "tag list missing vs empty."

### Outcome Values

- **`pass`** — test ran and the assertion matched.
- **`fail`** — test ran and the assertion did not match. Populate `error` with a useful message.
- **`skip`** — test was filtered out before running (e.g. it required a function the implementation hasn't wired up, or its `conflicts` ruled it out). Populate `reason`.
- **`todo`** — the test could run, but the function it validates is stubbed/unimplemented. Populate `reason`. Combined with `implementation.implementedFunctions`, viewers use this to classify a function as "implemented" vs "todo" vs "unsupported."

The enum is intentionally small. Richer status spaces (errored / xfail / xpass / flaky) collapse down to these four — typically into `fail` with a descriptive `error` string.

## Deriving the Breakdowns You Want

The full code recipes (feature-support summary, behavior breakdown, function classification, cross-implementation matrix) live in [`docs/consuming-results.md`](https://github.com/CatConfLang/ccl-test-data/blob/main/docs/consuming-results.md). The shape of all of them is the same: iterate `tests`, group by whatever tag you care about, and tally outcomes.

The minimum viable feature-support summary, in JavaScript:

```javascript
const support = new Map();
for (const test of results.tests) {
  for (const feature of test.features) {
    const row = support.get(feature) ?? { pass: 0, fail: 0, skip: 0, todo: 0 };
    row[test.outcome]++;
    support.set(feature, row);
  }
}
```

A feature is "fully supported" when `fail === 0` and at least one test passes.

## What's Intentionally Out of Scope

A few things that look like gaps are deliberate:

- **No actual-vs-expected diff.** The format records *whether* a test failed, not the offending value. Consumers that want a diff re-load the source fixture by `(testSuite.version, name, validation)` and inspect it.
- **No environment block.** OS, arch, commit SHA are out of scope; if you want them for run-over-run comparison, store them alongside the document at the artifact level (e.g. a CI sidecar file), not inside it.
- **No aggregate timing.** `durationMs` is per-test; total wall time is a one-line sum on the consumer side.
- **No `xfail`/`xpass`/flaky.** The enum stays at four values. Implementations with richer statuses map them down to `pass`/`fail`/`skip`/`todo` — usually `fail` plus a descriptive `error`.

## See Also

- [`schemas/test-results-format.json`](https://github.com/CatConfLang/ccl-test-data/blob/main/schemas/test-results-format.json) — full schema definition.
- [`docs/consuming-results.md`](https://github.com/CatConfLang/ccl-test-data/blob/main/docs/consuming-results.md) — code recipes for deriving summaries, breakdowns, and matrices.
- [Test Suite Guide](/test-suite-guide/) — the *input* side: what test fixtures look like and how runners filter them.
- [Implementing CCL](/implementing-ccl/) — guidance for implementers building a CCL library.
