---
title: Parsing Algorithm
description: Rules every CCL parser must implement, plus two viable strategies (line-oriented indent-stack and greedy recursive-descent) with worked examples, complexity notes, and references to real implementations.
---

# CCL Parsing Algorithm

CCL is parsed through recursive descent to a fixed point. The algorithm is simple:

1. Parse text into key-value entries
2. Build nested objects from indented entries
3. Recursively parse values that contain more CCL
4. Stop when no more CCL syntax remains (fixed point)

Two parser architectures realize this recipe — a [line-oriented indent-stack](#strategy-1--line-oriented-indent-stack) and a [greedy recursive-descent ("pacman")](#strategy-2--greedy-recursive-descent-pacman). Both produce identical trees from the same input; the choice is about implementation size, streaming behavior, and worst-case complexity.

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
3. Which characters count as whitespace depends on parser behavior:
   - `tabs_as_whitespace`: spaces and tabs are whitespace
   - `tabs_as_content`: only spaces are whitespace; tabs are content

:::caution[Context-Dependent Baseline]
The baseline N is determined differently depending on parsing context:
- **Top-level parsing**: N = 0 with `toplevel_indent_strip` behavior (default), or N = first key's indent with `toplevel_indent_preserve`
- **Nested parsing** (recursive calls): N = first content line's indentation (always)

See [Continuation Lines](/continuation-lines) for detailed examples and [Behavior Reference](/behavior-reference#continuation-baseline) for choosing between baseline behaviors.
:::

**Special keys**:
- Empty key `= value` → list item
- Comment entry `/ = text` → key is `/`, value is `text`

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

`build_hierarchy` always returns a map (object/dict). Multiple entries with the same key (including empty key `""` for list items) accumulate into a list stored under that key. See [AI Implementation Guide: build_hierarchy](/ai-implementation-guide#build_hierarchy) for the full algorithm and type details, and [Bare List Hierarchy Representation](/reference/decisions/bare-list-hierarchy/) for the canonical output shape when entries have empty keys.

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

## Strategy 1 — Line-oriented indent-stack

Used by the [TypeScript](https://github.com/tylerbutler/ccl-typescript) (`packages/ccl-ts/src/ccl.ts`) and [Gleam](https://github.com/tylerbutler/ccl_gleam) (`src/ccl/parser.gleam`) implementations. Similar in spirit to how Python, YAML, and Pug parse indentation.

**Idea:** walk input line by line, tracking a baseline indent. For each line, if `indent > baseline` it is a continuation of the current entry's value; otherwise it starts a new entry. Emit a flat list of `Entry {key, value: string}`. Build the tree in a second pass that recursively re-parses any value containing `=` until the fixed point.

```pseudocode
def parse_ccl(text):
    entries = parse_entries(text)  # split on '='
    hierarchy = build_hierarchy(entries)  # group by indentation
    return recursively_parse(hierarchy)  # fixed point

def recursively_parse(entries):
    result = {}
    for entry in entries:
        value = entry.value

        if contains_ccl_syntax(value):  # Has '=' character
            # Recursively parse the value
            parsed = parse_ccl(value)
            result[entry.key] = parsed
        else:
            # Fixed point: plain string
            result[entry.key] = value

    return result
```

**Worked trace** on the input from [Complete Example](#complete-example) above (top-level `baseline = 0`, followed by a recursive call with `baseline = 2` for each non-empty nested value):

| Line              | Indent | Baseline | Decision                               | Flat entry list after this line                                                                         |
| ----------------- | -----: | -------: | -------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `database =`      |      0 |        0 | indent ≤ baseline → **open entry**     | `[{database, ""}]`                                                                                      |
| `  host = ...`    |      2 |        0 | indent > baseline → **continuation**   | `[{database, "host = localhost"}]`                                                                      |
| `  port = 5432`   |      2 |        0 | indent > baseline → **continuation**   | `[{database, "host = localhost\nport = 5432"}]`                                                         |
| (blank)           |      – |        – | ignored                                | unchanged                                                                                               |
| `users =`         |      0 |        0 | indent ≤ baseline → **close + open**   | `[{database, …}, {users, ""}]`                                                                          |
| `  = alice`       |      2 |        0 | indent > baseline → **continuation**   | `[{database, …}, {users, "= alice"}]`                                                                   |
| `  = bob`         |      2 |        0 | indent > baseline → **continuation**   | `[{database, …}, {users, "= alice\n= bob"}]`                                                            |

`build_hierarchy` then recurses into each value that contains `=`, re-running the same tokenizer with the nested baseline (here, `2`), until the leaves (`localhost`, `5432`, `alice`, `bob`) contain no `=` and the fixed point is reached.

**Complexity:** **O(N)**. Each byte is visited once during tokenization and once more during recursive value re-parse, so total work is O(N). Tokenization is streaming-friendly. Natural fit for imperative languages (TypeScript) and for functional recursive state machines (Gleam).

**Good fit when** you want predictable performance on large inputs, a clean separation of tokenization from tree-building, or straightforward integration with typed AST libraries.

## Strategy 2 — Greedy recursive-descent ("pacman")

Used by the [OCaml reference implementation](https://github.com/tylerbutler/ccl-ocaml/blob/main/lib/parser.ml) (~91 lines with [Angstrom](https://github.com/inhabitedtype/angstrom) combinators).

**Idea:** greedily consume bytes until a syntactic landmark.

- `=` terminates a key (`many (not_char '=')` in Angstrom).
- A line whose indent is ≤ the parent's `expected_prefix_len` terminates a value.

Produce a flat list of `{key, value: string}` pairs for the current scope. For each value, recursively feed the collected string back into the same parser. If it parses as more key/values, the value becomes a nested map; otherwise it stays a string. The indent of the first inner line becomes the new `prefix_len` for that scope.

Framing (from [issue #2](https://github.com/tylerbutler/ccl-website/issues/2)): *"eat bytes until the indent wall drops, then ask the parser to chew the mouthful and tell me what it was."* The parser for nested content **is** the top-level parser applied to a sub-slice — the recursion literally *is* the structure. This matches the OCaml type definition quoted in [Why This Is Core CCL](#why-this-is-core-ccl) below: `type t = Fix of t Map.Make(String).t`.

```pseudocode
def parse(text, prefix_len=0):
    entries = []
    while not eof(text):
        key   = consume_until('=')                # many (not_char '=')
        value = consume_until_dedent(prefix_len)  # multiline; stops at line with indent ≤ prefix_len
        entries.append((key.strip(), value))
    return {k: reparse(v) for k, v in entries}

def reparse(value):
    if '=' not in value:
        return value                              # fixed point: plain string
    inner_prefix = indent_of_first_content_line(value)
    return parse(value, inner_prefix)
```

**Worked trace** on the same input:

1. Top-level `parse(_, prefix_len=0)` consumes bytes until each value's dedent, yielding two flat entries with string values:
   ```
   [
     ("database", "\n  host = localhost\n  port = 5432"),
     ("users",    "\n  = alice\n  = bob"),
   ]
   ```
2. `reparse(database.value)` finds `=`; takes `inner_prefix = 2` from the first content line; recurses → `{host: "localhost", port: "5432"}`.
3. `reparse(users.value)` takes `inner_prefix = 2`; recurses → two empty-key entries that `build_hierarchy` collects into a list → `["alice", "bob"]`.
4. Leaf values (`localhost`, `5432`, `alice`, `bob`) contain no `=` → fixed point.

**Complexity:** O(N) on flat input; **O(N·D) typical**, where D is nesting depth — a byte at depth D is traversed once per enclosing scope. **Worst case O(N²)** under pathological deep nesting (the OCaml source carries a `TODO: Quadratic behaviour` note because each line append costs O(N) in a list-concatenation accumulator). In practice D is small (~2–4), so behavior is near-linear.

**Good fit when** you want a very compact implementation, your language has strong parser-combinator support (Angstrom in OCaml, `nom` in Rust, `parsec` in Haskell), and inputs are modestly sized and shallow.

## Choosing a strategy

| Criterion              | Indent-stack (TS, Gleam)                         | Pacman (OCaml)                                      |
| ---------------------- | ------------------------------------------------ | --------------------------------------------------- |
| Time                   | O(N)                                             | O(N·D) typical; O(N²) worst                         |
| Memory                 | O(D) baseline state + O(N) flat entries          | O(N) (holds value slices recursively)               |
| Streaming input        | Natural (tokenize line-by-line)                  | Not streaming-friendly                              |
| Implementation size    | Medium (hundreds of lines)                       | Very compact (~91 lines with combinators)           |
| Self-recursive grammar | No (two phases)                                  | Yes (parser *is* its own sub-parser)                |
| Multi-line keys        | Feasible (Gleam does it with explicit buffering) | Natural fallout of `many (not_char '=')`            |
| Good fit for           | Large/streaming inputs, predictable worst case   | Combinator-heavy languages, compact implementations |

Pick **indent-stack** when streaming or worst-case guarantees matter, or when your language's ecosystem leans imperative or state-machine-friendly. Pick **pacman** when implementation size wins and you have good combinator support. Both satisfy the rules in [Rules every parser must implement](#rules-every-parser-must-implement); validate conformance against [`ccl-test-data`](https://github.com/tylerbutler/ccl-test-data).

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
