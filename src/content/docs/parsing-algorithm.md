---
title: Parsing Algorithm
description: Rules every CCL parser must implement, plus two viable strategies (greedy recursive-descent "pacman" and line-oriented indent-stack) with worked examples, complexity notes, and references to real implementations.
---

CCL is parsed through recursive descent to a fixed point. The algorithm is simple:

1. Parse text into key-value entries
2. Build nested objects from indented entries
3. Recursively parse values that contain more CCL
4. Stop when no more CCL syntax remains (fixed point)

Two parser architectures realize this recipe — a [greedy recursive-descent ("pacman") parser](/parsing-algorithm/pacman) and a [line-oriented indent-stack parser](/parsing-algorithm/indent-stack). Both produce identical trees from the same input; the choice is about implementation size, streaming behavior, and worst-case complexity. See [Choosing a strategy](#choosing-a-strategy) below for a comparison.

## Rules every parser must implement

The following rules are strategy-agnostic — every CCL parser must honor them regardless of which architecture it adopts.

### Input Format

CCL consists of key-value pairs separated by `=`:

```ccl
key = value
another = value with spaces
nested =
  child = nested value
  sibling = another nested
```

### Parse Entries

Find the `=` delimiter and split into key and value. The strategy used depends on the `delimiter_first_equals` or `delimiter_prefer_spaced` behavior (see [Behavior Reference](/behavior-reference#delimiter-mode)):

```
"key = value"  →  Entry {key: "key", value: "value"}
"a = b = c"    →  Entry {key: "a", value: "b = c"}   (delimiter_first_equals)
"a = b = c"    →  Entry {key: "a=b", value: "c"}      (delimiter_prefer_spaced, spaced = preferred)
```

**Key whitespace rules**:
- Trim all whitespace from keys (including newlines): `"  key  "` → `"key"`
- Keys can span multiple lines — see [Multi-Line Keys](#multi-line-keys) below

**Value whitespace rules**:
- Trim leading whitespace on first line: `key =   value` → `"value"`
- Trim trailing whitespace on final line
- Preserve internal structure (newlines + indentation for continuation lines)

**Indentation tracking**:
1. Determine the **baseline indentation** (N) for the current parsing context
2. For each subsequent line, compare its indentation to N:
   - `indent > N` → continuation line (part of value)
   - `indent ≤ N` → new entry starts
3. Which characters count as whitespace: both spaces and tabs count as indentation whitespace. (How leading tabs on *continuation* lines are normalized afterward is governed by the [`continuation_tab_to_space` vs `continuation_tab_preserve`](/behavior-reference#tab-handling) behavior, not by this counting step.)

:::caution[Context-Dependent Baseline]
The baseline N is determined differently depending on parsing context:
- **Top-level parsing**: N = 0 with `toplevel_indent_strip` behavior (default), or N = first key's indent with `toplevel_indent_preserve`
- **Nested parsing** (recursive calls): N = first content line's indentation (always)

See [Continuation Lines](/continuation-lines) for detailed examples and [Behavior Reference](/behavior-reference#continuation-baseline) for choosing between baseline behaviors.
:::

**First content line rule**: The first non-empty content line in any parsing context **always starts a new entry**, regardless of its indentation. Continuation detection (the `indent > N` check above) only applies to lines *after* the first entry has been established.

Without this rule, a parser using `toplevel_indent_strip` (N = 0) would incorrectly treat the very first indented line of a document as a "continuation of nothing" — every line would have `indent > 0` and there would be no preceding entry to attach to. The first-line rule ensures parsing always begins by creating an entry. See [Continuation Lines — First Content Line Rule](/continuation-lines#top-level-parsing) for worked examples.

**Special keys**:
- Empty key `= value` → list item
- Comment entry `/= text` → key is `/`, value is `text`

### Multi-Line Keys

:::note[Feature Tag]
Tests for multi-line key behavior are tagged `feature:multiline_keys` for reporting purposes.
:::

When a line has no `=` delimiter, it is the beginning of a multi-line key. The OCaml reference implementation's parser reads `many (not_char '=')` which naturally consumes across line boundaries until `=` is found — multi-line keys are a natural consequence of the parsing algorithm.

The rule is:

1. **Buffer** the line's content (trimmed).
2. **Continue reading** until a line containing `=` is found.
3. The buffered text plus any text before `=` on the final line forms the key (with all whitespace including newlines collapsed and trimmed).

**Examples:**

```
key
= val
```
Line 1 has no `=` → buffer `"key"`. Line 2 has `=` with nothing before it → key is `"key"`, value is `"val"`.

```
long key
name = Alice
```
Lines are consumed until `=` is found. The text before `=` spans both lines → key is `"long key name"`, value is `"Alice"`.

**Implementation approaches:**
- **Parser combinator** (as in the OCaml reference): Reading `many (not_char '=')` naturally consumes across line boundaries until `=` is found, making multi-line keys implicit.
- **Explicit buffering**: Buffer lines without `=` and consume the buffer when a line containing `=` is found, prepending the buffer to the key.

### Build Hierarchy

`build_hierarchy` always returns a map (object/dict). Multiple entries with the same key (including empty key `""` for list items) accumulate into a list stored under that key. See [Functions Reference: build_hierarchy](/reference/functions#build_hierarchy) for the normative API and hierarchy-building rules, and [Bare List Hierarchy Representation](/reference/decisions/bare-list-hierarchy/) for the canonical output shape when entries have empty keys.

Indentation determines structure. Example:

```ccl
parent =
  child = nested
  sibling = another
```

The parser records `parent`'s indentation level (0). Lines `child` and `sibling` have greater indentation (2), so they become part of `parent`'s value:

```
Entry {key: "parent", value: "child = nested\nsibling = another"}
```

### Recursive Parsing (Fixed Point)

Parse values that contain CCL syntax:

```
value: "child = nested\nsibling = another"
→ Contains '=' → Parse recursively
→ Results in: {child: "nested", sibling: "another"}
```

**Fixed-point termination**:
- Parse value as CCL
- If parsing yields structure → recurse on nested values
- If value has no '=' → stop (fixed point reached)
- Prevents infinite recursion: plain strings have no structure to parse

:::note[Nested Parsing Context]
When recursively parsing a multiline value, the parser must detect that it's in a **nested context** (the value starts with `\n`) and use the first content line's indentation as the baseline—regardless of the `toplevel_indent_strip`/`toplevel_indent_preserve` behavior setting.

For example, the value `"\n  host = localhost\n  port = 8080"`:
1. Starts with `\n` → nested context
2. First content line `  host = localhost` has indent 2 → N = 2
3. Both lines have indent 2, which is NOT > 2 → two separate entries

This is why the same text produces different results depending on context. See [Continuation Lines](/continuation-lines) for the complete algorithm.
:::

### Complete Example

Input:
```ccl
database =
  host = localhost
  port = 5432

users =
  = alice
  = bob
```

**Parse entries:**
```
Entry {key: "database", value: "host = localhost\nport = 5432"}
Entry {key: "users", value: "= alice\n= bob"}
```

**Recursive parsing:**
```
database.value contains '=' → parse recursively:
  Entry {key: "host", value: "localhost"}
  Entry {key: "port", value: "5432"}

users.value contains '=' → parse recursively:
  Entry {key: "", value: "alice"}
  Entry {key: "", value: "bob"}
```

**Build objects:**
```json
{
  "database": {
    "host": "localhost",
    "port": "5432"
  },
  "users": ["alice", "bob"]
}
```

Fixed point reached: "localhost", "5432", "alice", "bob" contain no '=' → stop.

## Choosing a strategy

| Criterion              | [Pacman](/parsing-algorithm/pacman) (OCaml)         | [Indent-stack](/parsing-algorithm/indent-stack) (TS, Gleam) |
| ---------------------- | --------------------------------------------------- | ----------------------------------------------------------- |
| Time                   | O(N·D) typical; O(N²) worst                         | O(N)                                                        |
| Memory                 | O(N) (holds value slices recursively)               | O(D) baseline state + O(N) flat entries                     |
| Streaming input        | Not streaming-friendly                              | Natural (tokenize line-by-line)                             |
| Implementation size    | Very compact (~91 lines with combinators)           | Medium (hundreds of lines)                                  |
| Self-recursive grammar | Yes (parser *is* its own sub-parser)                | No (two phases)                                             |
| Multi-line keys        | Natural fallout of `many (not_char '=')`            | Feasible (Gleam does it with explicit buffering)            |
| Good fit for           | Combinator-heavy languages, compact implementations | Large/streaming inputs, predictable worst case              |

Pick **[pacman](/parsing-algorithm/pacman)** when implementation size wins and you have good combinator support. Pick **[indent-stack](/parsing-algorithm/indent-stack)** when streaming or worst-case guarantees matter, or when your language's ecosystem leans imperative or state-machine-friendly. Both satisfy the rules in [Rules every parser must implement](#rules-every-parser-must-implement); validate conformance against [`ccl-test-data`](https://github.com/CatConfLang/ccl-test-data).

## Error Handling Essentials

**Malformed input**:
- Line with no '=' → part of a [multi-line key](#multi-line-keys); buffer and continue reading until `=` is found
- Inconsistent indentation → use explicit indentation counting
- Empty lines → ignore

**Edge cases**:
- Keys with '=' in them → depends on delimiter strategy. With `delimiter_first_equals` (default), the first '=' is always the split point so keys cannot contain '='. With `delimiter_prefer_spaced`, ` = ` is preferred, allowing '=' in keys. See [Behavior Reference](/behavior-reference#delimiter-mode)
- Values with '=' → fine, parse recursively
- Unicode in keys/values → valid, CCL is UTF-8
- CRLF vs LF → CCL treats only LF as a newline, so CRs present are preserved as-is

## Why This Is Core CCL

From the blog post:

> "The simplest possible config language is just key-value pairs. That's it."

The recursive fixed-point algorithm is _how_ those key-value pairs create nested structure. The OCaml type definition makes this explicit:

```ocaml
type t = Fix of t Map.Make(String).t
```

This says: "A CCL value is a fixed point of a map from strings to CCL values."

The recursion _is_ the structure. The fixed point _is_ the termination.

## What's NOT in This Algorithm

These are library conveniences, not core CCL:

- **Type conversion**: "5432" → integer (user's job)
- **Validation**: checking required keys (user's job)
- **Dotted key expansion**: `foo.bar` → nested object (optional)
- **Pretty printing**: formatting output (implementation detail)

Core CCL is: parse key-value pairs recursively until fixed point.
