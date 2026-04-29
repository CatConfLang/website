---
title: Continuation Lines
description: Understanding how CCL determines which lines are part of a value vs new entries.
---

CCL uses indentation to determine whether a line continues the previous value or starts a new entry. This page explains the rules in detail, including the critical distinction between **top-level** and **nested** parsing contexts.

For the precise algorithm that assembles continuation lines into a value string, see [Parsing Algorithm: Parse Entries](/parsing-algorithm#parse-entries).

## The Basic Rule

When parsing CCL, each line's indentation is compared to a **baseline** value (called **N**):

| Line Indentation | Has `=` | Result |
|------------------|---------|--------|
| `> N` | either | **Continuation** — line is part of the current value |
| `≤ N` | yes | **New entry** — ends the current value and starts a new key–value pair |
| `≤ N` | no | **Multi-line key prefix** — ends the current value; the line is folded into the *next* entry's key |

A `≤ N` line always ends the current value. What happens to that line *next* depends on `=`: a line with `=` becomes a new entry, while a line without `=` becomes prefix to the next entry's key. This falls out of how the algorithm finds keys — **the key parser reads "everything up to the next `=`", not "the prefix of a single line"** — so it scans freely across newlines until it finds a delimiter. See [Example 5 — Multi-Line Keys](#example-5-multi-line-keys) below for a worked example, and [Features Reference — multiline_keys](/reference/features#multiline_keys) for the feature tag used by the test suite.

The key question is: **how is N determined?**

## Two Parsing Contexts

CCL has two parsing contexts with different rules for determining N:

### Top-Level Parsing

When parsing a CCL document from the beginning, how N is determined depends on the `toplevel_indent_strip` vs `toplevel_indent_preserve` behavior choice (see [Behavior Reference](/behavior-reference#continuation-baseline)).

:::caution[First Content Line Rule]
**The first non-empty content line always starts a new entry, regardless of its indentation.** Continuation detection (comparing indentation to N) only applies to lines *after* the first entry has been established. This rule applies in both top-level and nested parsing contexts.

Without this rule, a parser using `toplevel_indent_strip` (N=0) would incorrectly treat *every* indented line as a continuation — even the very first line, which has no preceding entry to continue.
:::

#### With `toplevel_indent_strip` (default)

**N is always 0.** Any line with leading whitespace becomes a continuation. This is the OCaml reference implementation's behavior.

```ccl
server =
  host = localhost
  port = 8080
```

**Parsing:**
1. Line 1: `server =` at indent 0 → first entry, key = "server"
2. Line 2: `  host = localhost` at indent 2 → 2 > 0 → **continuation**
3. Line 3: `  port = 8080` at indent 2 → 2 > 0 → **continuation**

**Result:** One entry: `{key: "server", value: "\n  host = localhost\n  port = 8080"}`

Note that line 1 starts an entry even though its indent (0) is not > N (0). The first content line rule ensures parsing always begins by creating an entry, not by checking for continuation.

#### Edge case: all lines indented with `toplevel_indent_strip`

```ccl
  name = Alice
  age = 30
```

With N=0, both lines have indent 2 which is > 0. Without the first content line rule, a parser might try to make line 1 a continuation of nothing. The correct behavior:

1. Line 1: `  name = Alice` → **first content line rule applies** → starts entry, key = "name"
2. Line 2: `  age = 30` at indent 2 → 2 > 0 → **continuation** of name's value

**Result:** One entry: `{key: "name", value: "Alice\n  age = 30"}`

#### With `toplevel_indent_preserve`

**N equals the first key's indentation.** Lines at the same indentation as the first key are separate entries.

```ccl
  server = localhost
  port = 8080
```

**Parsing:**
1. Line 1: `  server = localhost` at indent 2 → first entry, N = 2
2. Line 2: `  port = 8080` at indent 2 → 2 > 2 is **false** → **new entry**

**Result:** Two entries: `{key: "server", value: "localhost"}` and `{key: "port", value: "8080"}`

With `toplevel_indent_strip`, this same input would produce **one entry** because 2 > 0 makes line 2 a continuation.

### Nested Parsing (N = first line's indent)

When recursively parsing a multiline value (which starts with a newline), **N is determined from the first content line's indentation**.

The value from above is `"\n  host = localhost\n  port = 8080"`. When `build_hierarchy` parses this:

1. Text starts with `\n` → this is a nested context
2. Skip the newline, find first content line: `  host = localhost`
3. First line has indent 2 → **N = 2**
4. Line `  port = 8080` has indent 2 → 2 > 2 is **false** → new entry

**Result:** Two entries: `{key: "host", value: "localhost"}` and `{key: "port", value: "8080"}`

## Why Two Contexts?

The distinction between top-level and nested parsing exists because the OCaml reference uses `toplevel_indent_strip`:

- `kvs_p` - top-level, uses `prefix_len = 0`
- `nested_kvs_p` - nested, determines `prefix_len` from first content line

With `toplevel_indent_strip`, you need two different algorithms: one that forces N=0, and one that determines N dynamically.

**With `toplevel_indent_preserve`, the distinction disappears.** Both top-level and nested parsing use the same algorithm: determine N from the first non-empty line's indentation. This simplifies implementation—you only need one parsing function that works for all contexts.

## Detecting Context

How the baseline is determined depends on which behavior you're implementing:

### With `toplevel_indent_strip` (OCaml reference)

Context detection is required:

```pseudocode
function determine_baseline(text):
    if text is empty or text[0] != '\n':
        return 0  // Top-level: always N = 0

    // Nested context: find first non-empty line after the newline
    skip the leading newline
    for each line:
        if line is not empty:
            return count_leading_whitespace(line)
    return 0
```

### With `toplevel_indent_preserve` (simplified)

No context detection needed—use the same algorithm everywhere:

```pseudocode
function determine_baseline(text):
    // Same algorithm for top-level and nested
    for each line in text:
        if line is not empty:
            return count_leading_whitespace(line)
    return 0
```

This is simpler because you don't need to check whether the text starts with `\n`.

## Worked Examples

### Example 1: Simple Top-Level

```ccl
key = value
next = another
```

- Line 1: indent 0, N=0 → 0 > 0 is false → new entry
- Line 2: indent 0, N=0 → 0 > 0 is false → new entry

**Result:** 2 entries

### Example 2: Indented Top-Level Document

```ccl
  key = value
  next = another
```

Both lines have indent 2. The result depends on the baseline behavior:

**With `toplevel_indent_strip`:**
- Line 1: indent 2, N=0 → 2 > 0 is **true** → first entry starts
- Line 2: indent 2, N=0 → 2 > 0 is **true** → **continuation!**

**Result:** 1 entry with key="key", value="value\n  next = another"

**With `toplevel_indent_preserve`:**
- Line 1: indent 2 → first entry starts, N=2
- Line 2: indent 2, N=2 → 2 > 2 is **false** → **new entry**

**Result:** 2 entries: `{key: "value"}` and `{next: "another"}`

This difference matters when CCL documents are embedded within other files or indented for readability.

### Example 3: Nested Value Parsing

Given this nested value (from a parent entry):
```
"\n  host = localhost\n  port = 8080"
```

- Starts with `\n` → nested context
- First content line `  host = localhost` has indent 2 → N=2
- Line `  host = localhost`: indent 2, N=2 → 2 > 2 is false → new entry
- Line `  port = 8080`: indent 2, N=2 → 2 > 2 is false → new entry

**Result:** 2 entries

### Example 4: Deeper Nesting

```ccl
database =
  primary =
    host = localhost
    port = 5432
  replica =
    host = replica.local
```

Top-level parse produces:
```
{key: "database", value: "\n  primary =\n    host = localhost\n    port = 5432\n  replica =\n    host = replica.local"}
```

Nested parse of the value (N=2):
```
{key: "primary", value: "\n    host = localhost\n    port = 5432"}
{key: "replica", value: "\n    host = replica.local"}
```

Nested parse of primary's value (N=4):
```
{key: "host", value: "localhost"}
{key: "port", value: "5432"}
```

### Example 5: Multi-Line Keys

The Basic Rule's third row is easy to miss because the binary "continuation vs. new entry" framing hides it. Here's the case that exposes it:

```ccl
== Database Config =
connection settings
host = localhost
```

A reader might expect three entries: an empty-key heading, a `connection settings` annotation, and `host = localhost`. With `toplevel_indent_strip` (N=0), the actual result is **two**:

```
{key: "",                            value: "= Database Config ="}
{key: "connection settings\nhost",   value: "localhost"}
```

Tracing the algorithm:

1. `find_next_equals` from position 0 → finds the first `=` (at index 1, inside `==`). Key before it is empty → first entry has `key=""`.
2. Value collection reads `= Database Config =` then breaks on `connection settings` (indent 0, N=0, not `> 0`). First entry's value is `"= Database Config ="`.
3. New iteration. `find_next_equals` from the start of `connection settings` finds **no** `=` on that line, so it scans across the newline into `host = localhost` and matches the `=` after `host`. The key spans both lines: `"connection settings\nhost"`.
4. Value `"localhost"` is collected.

The unindented line is **not** a third entry — it is silently folded into the next entry's key. This is verifiable against the OCaml reference (`ccl-ocaml/bin/dump.ml`).

**Related case — indented no-`=` line at top level:**

```ccl
== Database Config =
  connection settings
host = localhost
```

Here `  connection settings` has indent 2, which is `> 0`, so it stays in the *previous* value — the first entry becomes `{key: "", value: "= Database Config =\n  connection settings"}`, and `{key: "host", value: "localhost"}` follows. This is the standard `> N` continuation row in the table.

For more on the multi-line key feature itself (including the test suite tag), see [Features Reference — multiline_keys](/reference/features#multiline_keys) and [Parsing Algorithm — Multi-Line Keys](/parsing-algorithm#multi-line-keys).

## Edge Cases

### Empty Lines in Values

Empty lines within a value block do **not** automatically end the value. The semantic rule is:

> **A value ends when a non-empty line with indentation ≤ N is encountered, or at end of input.** Empty lines between continuation lines are preserved in the value. Trailing empty lines (those not followed by another continuation line) are **not** included in the value.

```ccl
message =
  line one

  line three
```

The empty line between "line one" and "line three" is preserved in the value because `line three` has indentation > N, confirming the value continues. The result is: `"\n  line one\n\n  line three"`.

However, trailing empty lines are excluded:

```ccl
message =
  line one

next = entry
```

Here the empty line is followed by `next = entry` at indentation ≤ N, so the empty line is **not** part of `message`'s value. The result is: `"\n  line one"`.

**Implementation approaches:**

There are two common ways to implement this:

1. **Lookahead**: When an empty line is encountered during value collection, scan ahead past any consecutive empty lines. If a non-empty line with indentation > N exists, preserve the empty line(s) in the value; otherwise, end the value.

   ```pseudocode
   function has_more_continuations(text, pos, baseline):
       // Scan forward past empty lines
       while pos < text.length:
           line = get_line_at(text, pos)
           if line is not empty:
               return count_leading_whitespace(line) > baseline
           pos = next_line(pos)
       return false
   ```

2. **Greedy parsing** (as in the OCaml reference): Continue reading past empty lines unconditionally. When a non-empty line with indentation ≤ N is found, stop — the empty lines before it are implicitly excluded because parsing stopped before consuming them.

### Mixed Tabs and Spaces

CCL counts whitespace characters, not visual columns. Both spaces and tabs count as indentation whitespace, but a tab counts as exactly one character — not as a visual indent of 4 or 8:

```
\tkey = value      // indent = 1 (one tab character)
  other = value    // indent = 2 (two space characters)
```

These have different indentation counts even though they may look similar. For consistent behavior, use spaces only or tabs only — don't mix. See [Behavior Reference — Tab Handling](/behavior-reference#tab-handling) for the related choice about leading tabs on continuation lines.

### Whitespace-Only Lines

A line containing only spaces (no visible content) typically has its whitespace counted for indentation purposes but is treated as empty for continuation logic.

## Implementation Pattern

Here's pseudocode for a complete implementation. The main parsing loop is the same for both behaviors—only `determine_baseline` differs.

```pseudocode
function parse(text):
    baseline = determine_baseline(text)
    entries = []
    pos = 0

    while pos < text.length:
        // Find next '=' and extract key.
        // This naturally implements the first content line rule:
        // the parser always seeks '=' first, creating an entry before
        // any continuation detection occurs.
        eq_index = find_next_equals(text, pos)
        key = extract_and_trim_key(text, pos, eq_index)

        // Collect value lines
        value_lines = []
        value_start = eq_index + 1

        // Get first line of value
        first_line = get_line_after(text, value_start)
        value_lines.append(trim_start(first_line))

        // Collect continuation lines
        scan_pos = after first line
        while scan_pos < text.length:
            line = get_line_at(text, scan_pos)
            indent = count_leading_whitespace(line)

            if is_empty(line):
                // Check if more continuations follow
                if has_more_continuations(text, scan_pos, baseline):
                    value_lines.append("")
                    scan_pos = next_line(scan_pos)
                    continue
                else:
                    break

            if indent > baseline:
                value_lines.append(line)  // Continuation
                scan_pos = next_line(scan_pos)
            else:
                break  // New entry

        entries.append({key, join(value_lines, "\n")})
        pos = scan_pos

    return entries
```

### `toplevel_indent_strip` (OCaml reference)

```pseudocode
function determine_baseline(text):
    if text.length == 0 or text[0] != '\n':
        return 0  // Top-level: always 0

    // Nested: find first content line's indent
    pos = 1  // Skip leading newline
    while pos < text.length:
        line_end = find_newline(text, pos)
        line = text[pos:line_end]
        if not is_empty(line):
            return count_leading_whitespace(line)
        pos = line_end + 1

    return 0
```

### `toplevel_indent_preserve` (simplified)

```pseudocode
function determine_baseline(text):
    // Same algorithm for all contexts
    for each line in text:
        if not is_empty(line):
            return count_leading_whitespace(line)
    return 0
```

## Summary

| Behavior | Baseline Algorithm | Implementation Complexity |
|----------|-------------------|--------------------------|
| `toplevel_indent_strip` | N=0 for top-level, N=first line for nested | Requires context detection |
| `toplevel_indent_preserve` | N=first line for all contexts | Single algorithm, simpler |

With `toplevel_indent_preserve`, you only need one `parse` function. With `toplevel_indent_strip`, you need context detection to distinguish top-level from nested parsing.

See [Behavior Reference](/behavior-reference#continuation-baseline) for guidance on choosing between behaviors.
