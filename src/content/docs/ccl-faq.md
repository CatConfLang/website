---
title: CCL FAQ
description: Frequently asked questions about CCL.
---

## Are there types?

No. Keys and values are strings. Your application converts them:

```ccl
port = 5432
enabled = true
```

The values in this case are `"5432"` and `"true"`.

## Can I use dots in keys?

Yes. `database.host` is a **literal string key** with dots:

```ccl
/= Key: "database.host"
database.host = localhost
```

For nested structure, use indentation instead.

## How do I nest?

Use indentation:

```ccl
database =
  host = localhost
  port = 5432
```

## How do lists work?

Empty keys create list items:

```ccl
servers =
  = web1.example.com
  = web2.example.com
```

## Are comments part of the data?

Yes. Comments are entries with `/` as the key:

```ccl
/= This is a comment
key = value
```

Filter them in your application.

## Common Confusions

These questions cover common surprises for authors and implementers.

### What does `build_hierarchy` return for a bare list?

For a section whose entries are all empty-key strings, you get a flat list under the parent key:

```ccl
users =
  = alice
  = bob
```

```json
{ "users": ["alice", "bob"] }
```

If the bare entries have nested CCL of their own, you get a list of objects instead. See [Bare List Hierarchy](/reference/decisions/bare-list-hierarchy) for the normative rule and edge cases.

### Are dotted keys like `database.host` nested?

No. `database.host` is a **literal string key** containing a dot — not a path. CCL only nests via indentation.

If you want dot-as-path semantics, use the opt-in `expand_dotted` function. It is gated behind the `experimental_dotted_keys` feature tag and is **not** part of core CCL. Implementations are not required to provide it. See [Dotted Keys Explained](/dotted-keys-explained) and [`expand_dotted`](/reference/functions#expand_dotted).

### How are tabs handled in continuation lines?

There is no `tabs_as_whitespace` / `tabs_as_content` choice — that pair has been removed. The real, registered conflict is between two behaviors that govern what happens to a tab character on a continuation line:

- `continuation_tab_to_space` — the tab is normalized to a single space when measuring indentation and emitting the value.
- `continuation_tab_preserve` — the tab is kept verbatim in the value.

Implementations declare exactly one. See [Continuation Lines](/continuation-lines) and the [Behavior Reference](/behavior-reference).

### What happens to CRLF in nested values?

By default CCL treats only `\n` as a line terminator, so a stray `\r` is preserved as part of the value. Implementations that opt into the `crlf_preserve_literal` behavior must apply that handling **uniformly** — flat documents and nested sections behave the same way. There is no "flat-only" CRLF mode. See [CRLF Handling in Nested Structures](/reference/decisions/crlf-nested).

### Why does the "first content line" rule exist?

When the parser starts (top-level or inside a recursive call), it has no preceding entry to attach a continuation to. The first non-empty content line therefore **always starts a new entry**, regardless of its indentation; continuation detection only applies from the second line onward.

Without this rule, a parser using `toplevel_indent_strip` (baseline indent N = 0) would treat the first indented line as "a continuation of nothing" and either drop it or crash. See [Parsing Algorithm](/parsing-algorithm) and [Continuation Lines — Top-Level Parsing](/continuation-lines#top-level-parsing) for worked examples.
