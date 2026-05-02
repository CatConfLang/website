---
title: Implementing CCL
description: Language-specific patterns and guidance for building CCL implementations.
---

:::tip[Core Philosophy]
**Adapt this API to your language's idioms.** There's no required API - make choices that feel natural for your ecosystem.
:::

## Core Requirements

Every CCL implementation needs three operations:

1. **`parse`** — Top-level parsing: text → flat key-value entries.
2. **`parse_indented`** — Nested-value parsing: re-parse an indented multiline value with baseline N taken from the first content line.
3. **`build_model`** — Flat entries → the canonical recursive map model (`Map<string, Model>`). See [Functions Reference — Canonical Data Model](/reference/functions#canonical-data-model).

`build_model` calls `parse_indented` whenever a value contains nested CCL syntax. `build_hierarchy` is **not** required — it's a JSON-friendly projection of `build_model` documented under [optional functions](/reference/functions#build_hierarchy).

### `parse` vs `parse_indented`

The two functions differ in how they pick the indentation baseline **N**:

| Function | Use Case | Baseline N |
|----------|----------|------------|
| `parse` | Top-level parsing | N = 0 (any indented line is a continuation) |
| `parse_indented` | Nested value parsing | N = indentation of the first content line |

With the `toplevel_indent_strip` behavior, you need context detection:

```pseudocode
function parse(text):
    if text is empty or text[0] != '\n':
        baseline = 0                      // Top-level: always 0
    else:
        baseline = find_first_line_indent(text)  // Nested: dynamic
    return parse_with_baseline(text, baseline)
```

#### Worked example

Input:
```ccl
server =
  host = localhost
  port = 8080
```

**Step 1 — Top-level `parse` (N = 0):**

```
"server ="              indent 0 → new entry
"  host = localhost"    indent 2 > 0 → continuation
"  port = 8080"         indent 2 > 0 → continuation

Result: [{key: "server", value: "\n  host = localhost\n  port = 8080"}]
```

**Step 2 — `build_model` calls `parse_indented` on the value:**

```
Value starts with '\n' → nested context
First content line "  host = localhost" has indent 2 → N = 2

"  host = localhost"    indent 2, 2 > 2 is false → new entry
"  port = 8080"         indent 2, 2 > 2 is false → new entry

Result: [{key: "host", value: "localhost"}, {key: "port", value: "8080"}]
```

Final hierarchy: `{"server": {"host": "localhost", "port": "8080"}}`

If a parser always used N = 0, top-level parsing would work but nested values like `"\n  host = localhost\n  port = 8080"` would collapse into a single entry because every line has indent > 0. See [Continuation Lines](/continuation-lines) for the full algorithm and [Behavior Reference](/behavior-reference#continuation-baseline) for top-level baseline choices.

## Language Patterns

### Functional (Gleam, OCaml)

```gleam
pub fn parse(text: String) -> Result(List(Entry), ParseError)
pub fn build_hierarchy(entries: List(Entry)) -> Result(CCL, ObjectError)
```

Use Result types, pattern matching, immutable data.

### Imperative (Go, Java)

```go
func Parse(text string) ([]Entry, error)
func BuildHierarchy(entries []Entry) (CCL, error)
```

Use error returns, interfaces, builder patterns.

### Dynamic (Python, JavaScript)

```python
def parse(text: str) -> list[Entry]
def build_hierarchy(entries: list[Entry]) -> CCL
```

Use exceptions, native collections, optional type hints.

## Recursive Parsing Algorithm

```pseudocode
function build_hierarchy(entries):
    result = {}
    for (key, value) in entries:
        if key == "":
            add_to_list(result, value)
        else if value_looks_like_ccl(value):
            nested = parse(value)  # Uses nested context detection
            result[key] = build_hierarchy(nested)  # Recurse
        else:
            result[key] = value
    return result
```

**Fixed-point termination**: Recurse until no more CCL syntax found.

:::caution[Critical: Nested Parsing Context]
When `build_hierarchy` calls `parse` on a nested value, the parser must detect that the value starts with `\n` and use the first content line's indentation as the baseline—regardless of the `toplevel_indent_strip`/`toplevel_indent_preserve` behavior setting for top-level parsing.

This is the most common source of parsing bugs. See [Continuation Lines](/continuation-lines) for the complete algorithm and [Behavior Reference](/behavior-reference#continuation-baseline) for top-level baseline choices.
:::

See [Parsing Algorithm](/parsing-algorithm) for details.

## Optional Features

**Type-Safe Access** (library convenience):
```pseudocode
get_string(ccl, path...): string
get_int(ccl, path...): int
```

**Entry Processing** (composition utilities):
```pseudocode
filter(entries, predicate): entries
compose(entries1, entries2): entries
```

**Parse Variants**:
- `load(text)` — convenience function combining `parse` + `build_hierarchy` in a single call

See [Library Features](/library-features) for details.

## Testing

Use [CCL Test Suite](https://github.com/CatConfLang/ccl-test-data) to validate your implementation:

1. **Core Parsing**: Filter tests by `functions: ["parse"]`
2. **Model Construction**: Filter by `functions` containing `build_model` (or `build_hierarchy` for the JSON-projection tests)
3. **Typed Access**: Filter by `validation` starting with `get_`
4. **Behavior conflicts**: Skip tests where `conflicts.behaviors` or `conflicts.variants` matches your choices

See [Test Suite Guide](/test-suite-guide) for complete filtering examples.

## Internal Representation Choices

How you represent CCL data internally affects which features are easy to implement.

### The OCaml Approach

The reference OCaml implementation represents all data as nested `KeyMap` structures:

```ocaml
type ccl = KeyMap of ccl StringMap.t
```

**Advantages**:
- Uniform data structure (everything is a nested map)
- Elegant recursion with `fix` function
- Clean pattern matching and algebraic properties

**Trade-off**: This model cannot distinguish between a string value:
```ccl
name = Alice
```
and a nested key with empty value:
```ccl
name =
  Alice =
```

Both produce identical models: `{ "name": { "Alice": {} } }`

### Alternative: Tagged Union

For implementations that need structure-preserving `print`, use a tagged union:

```pseudocode
type Value =
  | String(string)
  | Object(map<string, Value>)
  | List(list<Value>)
```

**Advantages**:
- Easy to implement `print` (structure recovery is straightforward)
- Can distinguish string values from nested structures
- Natural representation for most languages

### Lazy Hierarchy Building

Another approach: preserve original entries and build hierarchy on-demand:

```pseudocode
type CCL = {
  entries: List(Entry),
  hierarchy: Lazy(Object)
}
```

**Advantages**:
- Perfect structure preservation for `print`
- Can support both `print` and `canonical_format`
- Deferred parsing cost

See [Library Features](/library-features#formatting-functions) for details on `print` vs `canonical_format`.

## Common Challenges

**Equals in Keys**: With `delimiter_prefer_spaced`, prefer ` = ` as delimiter when multiple `=` exist. Fall back to first `=` when no spaced delimiter is found.

**Infinite Recursion**: Fixed-point algorithm terminates naturally

**Duplicate Keys**: Merge into object or list based on value types

**Empty Keys**: Treat `= value` as list item

**Unicode/CRLF**: Break _only_ on LF; preserve CR, preserve unicode

See [Syntax Reference](/syntax-reference) for edge cases.
