---
title: Pacman Parser
description: Greedy recursive-descent strategy for parsing CCL — chomp bytes until an = or a dedent, then hand the mouthful to another parser. Compact implementation, natural fit for combinator libraries.
---

Used by the [OCaml reference implementation](https://github.com/chshersh/ccl/blob/main/lib/parser.ml) (~91 lines with [Angstrom](https://github.com/inhabitedtype/angstrom) combinators).

## The metaphor

Pacman chomps across the input in a straight line, mouth open, swallowing every byte in its path until it hits a wall. There are only two kinds of wall:

- An `=` ends the current **key**. Pacman was eating a key; now it turns around and starts eating a value.
- A line whose indent drops back to (or below) the parent's `prefix_len` ends the current **value**. Pacman has hit the edge of the maze — this scope is done.

When Pacman finishes a mouthful of value, it doesn't try to understand it on the spot. It swallows the whole slice whole, then hands it to another Pacman and says *"you chew on this."* That inner Pacman starts from byte zero of the slice and does the exact same thing — chomp until `=`, chomp until dedent, hand off. If there's no `=` anywhere in the mouthful, there's nothing to chew: the value is a plain string and recursion stops.

The parser for nested content **is** the top-level parser applied to a sub-slice — the recursion literally *is* the structure, mirroring the OCaml type `type t = Fix of t Map.Make(String).t` shown in [Why This Is Core CCL](/parsing-algorithm#why-this-is-core-ccl).

In combinator terms: `=` is matched by `many (not_char '=')` (eat anything that isn't `=`), and the value terminator is "first line whose indent ≤ `prefix_len`." The indent of the first inner content line becomes the new `prefix_len` for the next Pacman down.

## Pseudocode

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

The pseudocode is deliberately compact; three behaviors hide inside `consume_until('=')`, the `key.strip()` step, and the raw return of `consume_until_dedent`. The next three sections pin them down.

## Picking the `=` delimiter

When a line contains several `=`, which one does `consume_until('=')` pick? That depends on the [delimiter mode](/behavior-reference#delimiter-mode).

**`delimiter_first_equals`** — always the first `=` on the line. Simple, no carve-outs.

**`delimiter_prefer_spaced`** — prefer the first `=` bounded on the left by a space or start-of-input and on the right by a space, newline, or end-of-input. Fall back to the first `=` if no spaced `=` exists. **Carve-out:** if the line *starts* with `=`, take the first `=` (position 0) regardless of what's spaced later on the line. Without this carve-out, section-style headings like `== Section Header =` would split at the trailing spaced `=` and break the fixtures.

Examples:

- `a = b = c` → `delimiter_first_equals`: key `"a"`, value `"b = c"`. `delimiter_prefer_spaced`: key `"a = b"`, value `"c"` (the second ` = ` is spaced and wins).
- `== Section Header =` → key `""`, value `"= Section Header ="` under either mode. Under `delimiter_first_equals` this is just "first `=` wins"; under `delimiter_prefer_spaced` the start-of-line carve-out is doing the work — without it, the spaced `=` at position 18 would win.
- `= = spaced equals` → key `""`, value `"= spaced equals"` under either mode. Both rules happen to agree (first `=` is at position 0, which is also the first spaced position).

## Multi-line key normalization

`many (not_char '=')` will happily eat newlines, so a key that spans lines comes back with the newlines and per-line indentation embedded. The `key.strip()` in the pseudocode is **not** enough; the fixtures expect a per-part normalization:

> Split the consumed key on `\n`, strip each part, drop empty parts, join the remaining parts with a single space.

Examples:

- `"my\n key\n= val"` → key `"my key"`, value `"val"`
- `"a\n b\n c\n= val"` → key `"a b c"`, value `"val"`

A literal `key.strip()` would yield `"my\n key"` or `"a\n b\n c"`, which neither round-trips nor matches the fixtures.

## Value trimming

`consume_until_dedent(prefix_len)` returns the raw slice between `=` and the dedent. The fixtures expect a specific trimming policy on top:

1. **Strip leading whitespace (spaces and tabs) on the first line only** — the chunk between `=` and the first newline.
2. **Strip trailing whitespace** from the value as a whole.
3. **Preserve interior whitespace**, including the indentation of every continuation line.

The interior-preservation rule is load-bearing. A naive whole-value `strip()` corrupts multi-line values two ways: it eats the leading `\n` of an indented sub-block (rule 3, last example below), and it shifts the first continuation line's indent (rule 3, third example).

Examples:

- `"items =   spaced   \n..."` → value `"spaced"` (rules 1 + 2)
- `"key = \tvalue\twith\ttabs"` → value `"value\twith\ttabs"` (rule 1 strips the leading tab; interior tabs preserved per [`tabs_as_content`](/behavior-reference#tab-handling))
- `"key1 = value1\n  indented continuation"` → value `"value1\n  indented continuation"` (rule 1 strips the single leading space; rule 3 keeps the `"  "` before the continuation)
- `"  key  =  value  \n  nested  = \n    sub  =  val  "` → value `"value  \n  nested  = \n    sub  =  val"` (only the trailing whitespace on the *last* line is stripped; trailing whitespace before *interior* newlines stays)
- `"database =\n  enabled = true\n..."` → value starts with `"\n"` (rule 1 has nothing to strip on an empty first line, and that newline is what tells `reparse` to look at the next line for `inner_prefix`)

## Worked trace

On the input from [Complete Example](/parsing-algorithm#complete-example):

1. Top-level `parse(_, prefix_len=0)` chomps across both entries, stopping each value at the dedent back to column 0:
   ```
   [
     ("database", "\n  host = localhost\n  port = 5432"),
     ("users",    "\n  = alice\n  = bob"),
   ]
   ```
2. `reparse(database.value)` sees `=` inside; takes `inner_prefix = 2` from the first content line; hands the slice to a fresh Pacman → `{host: "localhost", port: "5432"}`.
3. `reparse(users.value)` takes `inner_prefix = 2`; recurses → two empty-key entries that `build_hierarchy` collects into a list under `users` → `{"users": ["alice", "bob"]}`.
4. Leaf values (`localhost`, `5432`, `alice`, `bob`) contain no `=` → nothing left to chew → fixed point.

## Complexity

O(N) on flat input; **O(N·D) typical**, where D is nesting depth — a byte at depth D gets chewed once per enclosing scope. **Worst case O(N²)** under pathological deep nesting (the OCaml source carries a `TODO: Quadratic behaviour` note because each line append costs O(N) in a list-concatenation accumulator). In practice D is small (~2–4), so behavior is near-linear.

## Notes

**Multi-line keys** fall out for free: `many (not_char '=')` doesn't care about newlines, so a key that spans lines is just a longer mouthful before Pacman hits `=`. The mouthful itself is not the final key — see [Multi-line key normalization](#multi-line-key-normalization) for the per-part strip-and-join rule the fixtures require.

**Good fit when** you want a very compact implementation, your language has strong parser-combinator support (Angstrom in OCaml, `nom` in Rust, `parsec` in Haskell), and inputs are modestly sized and shallow.

See also: [Indent-Stack Parser](/parsing-algorithm/indent-stack) for the alternative strategy, and [Rules every parser must implement](/parsing-algorithm#rules-every-parser-must-implement) for the strategy-agnostic contract both parsers satisfy.
