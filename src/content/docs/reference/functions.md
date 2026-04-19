---
title: Functions Reference
description: Signatures and canonical behavior for every CCL function the test suite validates.
---

This page is the canonical reference for every CCL function the [test suite](https://github.com/catconflang/ccl-test-data) exercises. Each heading is the stable anchor for the corresponding `function:*` tag (e.g. `function:parse` → [`#parse`](#parse)).

For the full recursive algorithm, see [Parsing Algorithm](/parsing-algorithm). For patterns and examples, see [Implementing CCL](/implementing-ccl) and [Library Features](/library-features).

## Core

### parse

**Tag:** `function:parse`

```pseudocode
parse(text: string) → Entry[]
```

Converts CCL text into a flat list of key-value entries. Splits each line on its delimiter, trims keys, preserves in-value whitespace, folds continuation lines into the preceding value using the baseline-N rule.

Under the `toplevel_indent_strip` behavior, top-level parsing uses **N = 0** and strips leading whitespace on top-level keys. Under `toplevel_indent_preserve`, the baseline is determined dynamically from the first content line.

See [Continuation Lines](/continuation-lines) for the baseline-N algorithm and [Behavior Reference — Continuation Baseline](/behavior-reference#continuation-baseline) for the top-level choice.

```ccl
host = localhost
port = 8080
```

→ `[{key: "host", value: "localhost"}, {key: "port", value: "8080"}]`

---

### parse_indented

**Tag:** `function:parse_indented`

```pseudocode
parse_indented(text: string) → Entry[]
```

Nested-value parsing. Determines baseline **N** from the indentation of the first content line, then parses with that baseline. Used internally by [`build_hierarchy`](#build_hierarchy) to re-parse nested values.

`parse_indented` and `parse` differ only in how they pick N. See [`parse` vs `parse_indented`](/implementing-ccl#parse-vs-parse_indented) for the worked example.

---

### build_hierarchy

**Tag:** `function:build_hierarchy`

```pseudocode
build_hierarchy(entries: Entry[]) → CCL
```

Converts flat entries into a nested object by recursively calling `parse_indented` on each value and building hierarchy until a fixed point. Duplicate keys accumulate into lists; bare-list entries (empty key) produce an array of objects.

See [Bare List Hierarchy Representation](/reference/decisions/bare-list-hierarchy/) for the canonical output shape and [Parsing Algorithm — Build Hierarchy](/parsing-algorithm#build-hierarchy) for the recursion.

```ccl
server =
  host = localhost
  port = 8080
```

→ `{"server": {"host": "localhost", "port": "8080"}}`

---

### load

**Tag:** `function:load`

```pseudocode
load(text: string) → CCL
```

Convenience combining `parse` + `build_hierarchy` in one call. Equivalent to `build_hierarchy(parse(text))`.

## Typed Access

All typed accessors navigate a `CCL` value by a key path. They support both positional (`get_string(ccl, "database", "host")`) and dotted (`get_string(ccl, "database.host")`) invocations — the test suite validates both forms.

Accessor behavior under ambiguous values is governed by:

- [`boolean_strict` vs `boolean_lenient`](/behavior-reference#boolean-parsing) — which strings coerce to `true`/`false`.
- [`list_coercion_enabled` vs `list_coercion_disabled`](/behavior-reference#list-coercion) — whether `get_list` on a single value yields a one-element list or an error.

**Error conditions (uniform across typed accessors):**

- **Missing path segment** — fail with a path-aware error (implementations should include the full path and available siblings to aid debugging).
- **Intermediate segment is a scalar, not an object** — fail; the path cannot descend through a non-object value.
- **Type conversion failure** — e.g. `get_int` on `"hello"`. Fail with both the expected type and the raw value.
- **Empty path** — implementation-defined; tests don't require a specific behavior.

### get_string

**Tag:** `function:get_string`

```pseudocode
get_string(ccl: CCL, ...path: string) → string
```

Returns the raw string value at the given path. No coercion.

---

### get_int

**Tag:** `function:get_int`

```pseudocode
get_int(ccl: CCL, ...path: string) → int
```

Parses the string at the given path as an integer. Errors if the value is not a valid integer.

---

### get_bool

**Tag:** `function:get_bool`

```pseudocode
get_bool(ccl: CCL, ...path: string) → bool
```

Coerces the string at the given path to a boolean. The accepted set of truthy/falsy tokens depends on the [Boolean Parsing](/behavior-reference#boolean-parsing) behavior.

---

### get_float

**Tag:** `function:get_float`

```pseudocode
get_float(ccl: CCL, ...path: string) → float
```

Parses the string at the given path as a floating-point number.

---

### get_list

**Tag:** `function:get_list`

```pseudocode
get_list(ccl: CCL, ...path: string) → string[]
```

Returns an array of string values at the given path. Bare-list entries (empty-key children) are the canonical source; `get_list` has well-defined array semantics regardless of how `build_hierarchy` represents bare lists (see [Bare List Hierarchy](/reference/decisions/bare-list-hierarchy/)).

Single-value coercion depends on [List Coercion](/behavior-reference#list-coercion).

## Processing

### filter

**Tag:** `function:filter`

```pseudocode
filter(entries: Entry[], predicate) → Entry[]
```

Filters entries. The test suite validates `filter` used to strip comment entries — keys beginning with `/` (see [Comments](/reference/features#comments)).

---

### compose

**Tag:** `function:compose`

```pseudocode
compose(left: Entry[], right: Entry[]) → Entry[]
```

Concatenates two entry lists so duplicate keys between them merge at object level when passed through `build_hierarchy`. `compose` is expected to be associative; the test suite validates this via the `compose_associative` algebraic property (and the `identity_left`/`identity_right` identity properties).

---

### expand_dotted

**Tag:** `function:expand_dotted`

```pseudocode
expand_dotted(entries: Entry[]) → Entry[]
```

Transforms entries with dotted keys (e.g. `database.host = localhost`) into nested structures. Opt-in: CCL treats dotted keys as literal strings by default. See [Dotted Keys Explained](/dotted-keys-explained) and the [`experimental_dotted_keys`](/reference/features#experimental_dotted_keys) feature.

## Formatting

### print

**Tag:** `function:print`

```pseudocode
print(ccl: CCL) → string
```

Renders a `CCL` value back to text in a structure-preserving form. Distinct from [`canonical_format`](#canonical_format), which imposes a normalized ordering.

See [Library Features — Formatting](/library-features#formatting-functions) for the `print` vs `canonical_format` comparison.

---

### canonical_format

**Tag:** `function:canonical_format`

```pseudocode
canonical_format(ccl: CCL) → string
```

Renders a `CCL` value in a canonical form: stable key ordering, consistent indentation (per [`indent_spaces`](/behavior-reference#indentation-style) vs `indent_tabs`), no redundant whitespace. Two inputs that are semantically equal produce identical canonical output.

---

### round_trip

**Tag:** `function:round_trip`

```pseudocode
round_trip(text: string) → string
```

`canonical_format(load(text))`. Validates the round-trip property: round-tripping a canonical input must be a fixed point.

## See Also

- [Features Reference](/reference/features/) — language features every conformant implementation handles
- [Behavior Reference](/behavior-reference/) — implementation choices with mutually-exclusive pairs
- [Variants Reference](/reference/variants/) — spec-compliance variants
- [Decisions](/reference/decisions/bare-list-hierarchy/) — canonical decisions on ambiguous semantics
