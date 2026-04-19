---
title: Features Reference
description: Universal language features every conformant CCL implementation handles identically.
---

A **feature** is a CCL language capability that every conformant implementation must handle identically. Features describe what the language *is* — no reasonable implementation can legitimately reject one.

Compare with [behaviors](/behavior-reference/), which encode real implementation *choices* (mutually exclusive pairs), and [variants](/reference/variants/), which are spec-compliance profiles.

Each heading below is the canonical anchor for the corresponding `feature:*` tag in the [test suite](https://github.com/catconflang/ccl-test-data).

## comments

**Tag:** `feature:comments`

Lines beginning with `/=` are comments. Comments are parsed as entries with the special key `/`; [`filter`](/reference/functions#filter) strips them from processing.

```ccl
/= this is a comment
key = value
```

See [Getting Started — Comments](/getting-started#3-comments).

## empty_keys

**Tag:** `feature:empty_keys`

Entries of the form `= value` have an empty key. During [`build_hierarchy`](/reference/functions#build_hierarchy), sibling empty-key entries form an array (the canonical "bare list" shape).

```ccl
items =
  = first
  = second
```

See [Bare List Hierarchy Representation](/reference/decisions/bare-list-hierarchy/).

## multiline_continuation

**Tag:** `feature:multiline_continuation`

Indented lines continue the value of the preceding entry. The baseline N that separates "new entry" from "continuation" depends on context; see [Continuation Lines](/continuation-lines) for the full algorithm.

```ccl
description =
  This value
  spans multiple lines.
```

## multiline_keys

**Tag:** `feature:multiline_keys`

Keys may span multiple lines. Less common than multiline values but permitted by the grammar.

## unicode

**Tag:** `feature:unicode`

Keys and values may contain arbitrary UTF-8. Implementations must not mangle or reject non-ASCII content.

```ccl
greeting = こんにちは
emoji = 🎉
```

## whitespace

**Tag:** `feature:whitespace`

Internal whitespace in values is preserved. Key whitespace is trimmed; value whitespace is trimmed only at the boundary immediately after `=` and before the line terminator.

## tab_in_value_preserved

**Tag:** `feature:tab_in_value_preserved`

Tabs appearing **inside** a value (between non-whitespace content) are preserved verbatim. Boundary tabs immediately after `=` are trimmed — this is the universal default and is intentionally untagged. Separate from the [Tab Handling](/behavior-reference#tab-handling) behavior, which governs *leading* tabs on continuation lines.

## toplevel_indent_strip

**Tag:** `feature:toplevel_indent_strip`

Top-level keys have any leading whitespace stripped (OCaml `String.trim`) before the baseline-N rule is applied. This is what lets `parse` use **N = 0** at the top level without top-level keys accidentally registering as continuations.

This feature is paired with the [`toplevel_indent_strip` vs `toplevel_indent_preserve`](/behavior-reference#continuation-baseline) behavior group — the feature tag marks tests that exercise the stripping rule under the reference-compliant behavior choice.

## experimental_dotted_keys

**Tag:** `feature:experimental_dotted_keys`

Dotted keys (`database.host = localhost`) are treated as **literal strings by default** in CCL. The `experimental_dotted_keys` feature covers opt-in behavior via [`expand_dotted`](/reference/functions#expand_dotted) that rewrites them into nested structures.

See [Dotted Keys Explained](/dotted-keys-explained) for the literal-vs-hierarchical distinction.

## See Also

- [Functions Reference](/reference/functions/)
- [Behavior Reference](/behavior-reference/)
- [Variants Reference](/reference/variants/)
