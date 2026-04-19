---
title: CRLF Handling in Nested Structures
description: CRLF preservation applies uniformly to flat and nested CCL structures.
---

## Normative rule

Implementations that declare the `crlf_preserve_literal` behavior **must** handle `\r\n` line endings correctly during:

1. **Line splitting** — Treat `\r\n` as a single line terminator. Do not let a trailing `\r` leak into line content.
2. **Indentation detection** — Measure leading whitespace only after stripping line terminators. `\r` must not inflate whitespace counts.
3. **Hierarchy construction** — Produce the same nested structure regardless of whether input uses `\n` or `\r\n` line endings.

CRLF preservation is a single, indivisible behavior. There is no "flat-only" CRLF mode.

## Why

The naive implementation — splitting input on `\n` and treating lines as opaque — works for flat CCL but silently corrupts nested structures. A trailing `\r` left on each line:

- Miscounts indentation (a `\r` is not whitespace, so depth calculations drift).
- Breaks equality comparisons on values (`"foo\r"` ≠ `"foo"`).
- Shifts comments and values relative to their expected output.

Failures on `crlf_preserve_nested_structure` and `crlf_preserve_comments_and_values` (from the test suite) are **implementation bugs**, not legitimate behavior differences. No new behavior tag or variant is warranted to cover them.

## Implementation guidance

The canonical fix is to normalize line endings at the earliest possible point in the parsing pipeline:

```pseudocode
function parse(text):
    // Before any indentation analysis, split on \r\n OR \n
    lines = split_on_line_terminators(text)  // Strips terminators cleanly
    // Continue with the rest of parse using `lines`
```

Splitting only on `\n` and leaving `\r` attached will pass flat tests and fail nested ones.

## Related

- [Behavior Reference — Line Endings](/behavior-reference#line-endings)
- [Parsing Algorithm](/parsing-algorithm)
- Historical record: [ADR 002 in ccl-test-data](https://github.com/CatConfLang/ccl-test-data/blob/main/docs/adr/002-crlf-nested-handling.md)
