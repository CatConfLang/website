---
title: Troubleshooting
description: Symptom-first diagnostics for the most common CCL surprises, both for authors and parser implementers.
---

This page is organised by **symptom**: find what you're seeing, then jump to the explanation. For step-by-step concept explanations, see [Writing CCL](/writing-ccl); for the formal rules, see the [Parsing Algorithm](/parsing-algorithm) and [Behavior Reference](/behavior-reference).

## Authoring Symptoms

### "My value has an extra line in it that I didn't intend"

You almost certainly indented a line under an entry that already has a value. Any line indented more than the previous entry becomes a continuation of that value, not a new entry:

```ccl
host = localhost
  port = 8080      /= becomes part of host's value
```

Here `host` has the value `"localhost\n  port = 8080"`. To make `port` a separate entry, dedent it to the same column as `host`. To nest both under a parent, use an empty value:

```ccl
server =
  host = localhost
  port = 8080
```

See [Continuation Lines](/continuation-lines) for the full rule.

### "My key got eaten — the parser thinks the next line is part of my key"

A line with **no `=`** is the start of a multi-line key. The parser keeps reading until it finds `=`, then everything before it is the key:

```ccl
just some text       /= no '=' on this line
key = value          /= the parser treats this whole pair of lines
                     /= as one entry with key "just some text\nkey" (or worse)
```

If you wrote a free-floating note and forgot it needs an `=`, prefix it with `/=` to make it a comment instead. See [Writing CCL — Forgetting the Equals Sign](/writing-ccl#common-mistakes).

### "My inline comment ended up in the value"

CCL has no inline comments. Everything after the first `=` is the value, including text that looks like a `/=` comment:

```ccl
port = 8080 /= the main port    /= value is "8080 /= the main port"
```

Put comments on their own line:

```ccl
/= The main port
port = 8080
```

### "Why is my key value `5432` and not the integer 5432?"

CCL has no types — every key and value is a string. Conversion to numbers, booleans, etc. happens in your application after parsing. See [FAQ — Are there types?](/ccl-faq#are-there-types) and the typed-access helpers in [Functions](/reference/functions#typed-access).

### "My `database.host = ...` didn't create a `database` section"

Dotted keys are literal strings, not paths. CCL only nests via indentation. If you actively want dot-as-path semantics, the only sanctioned route is the `expand_dotted` function, which is gated behind the `experimental_dotted_keys` feature tag and is not part of core CCL. See [Dotted Keys Explained](/dotted-keys-explained).

### "My leading/trailing whitespace disappeared"

Both keys and values are trimmed of surrounding whitespace. This is unconditional and not configurable. To embed leading or trailing whitespace inside a value, put the whitespace on a continuation line (where the leading indent is preserved as part of the value above the baseline indent).

## Cross-Implementation Symptoms

### "Implementation A and implementation B parse the same file differently"

Most cross-implementation differences come from **declared behaviors**. Each implementation chooses one option from each conflicting pair, and the test suite annotates which behavior set it expects. Check both implementations' declared behaviors before assuming a bug.

The pairs most likely to bite you:

| Conflict | Options |
|---|---|
| Continuation tabs | `continuation_tab_to_space` vs `continuation_tab_preserve` |
| Top-level indentation | `toplevel_indent_strip` vs `toplevel_indent_preserve` |
| Delimiter | `delimiter_first_equals` vs `delimiter_prefer_spaced` |
| CRLF handling | `crlf_preserve_literal` declared, or not |

See the [Behavior Reference](/behavior-reference) for the full list and the [Test Suite Guide](/test-suite-guide) for how tests select behaviors.

### "A tab in a continuation line gives me different output across parsers"

That's the `continuation_tab_to_space` / `continuation_tab_preserve` conflict above. There is no `tabs_as_whitespace` / `tabs_as_content` pair — that earlier framing has been removed. See [Continuation Lines — Mixed Tabs and Spaces](/continuation-lines#mixed-tabs-and-spaces).

### "An indented top-level document parses as a giant nested value in one parser but a flat document in another"

That's the `toplevel_indent_strip` (OCaml reference) vs `toplevel_indent_preserve` conflict. With strip, the parser detects the document is indented and treats the leftmost column as column zero. With preserve, every line truly starts at its absolute column, so the whole document looks like one continuation block. See [Continuation Lines — Two Parsing Contexts](/continuation-lines#two-parsing-contexts).

### "CRLF line endings produce mangled values"

By default CCL splits on `\n` only; a stray `\r` is preserved as part of the value above. An implementation that opts into `crlf_preserve_literal` must apply the handling **uniformly** to flat and nested documents — there is no flat-only CRLF mode. See [CRLF Handling in Nested Structures](/reference/decisions/crlf-nested).

## `build_hierarchy` Symptoms

### "I expected a list but got an object (or vice versa)"

`build_hierarchy` decides bare-list shape based on the value type of each entry:

- All bare entries are plain strings → flat list of strings: `{ "users": ["alice", "bob"] }`
- Bare entries contain nested CCL → list of objects: `{ "users": [{ "name": "alice" }, ...] }`

The normative rules and edge cases (mixing named entries with bare entries under the same parent, empty bare entries, etc.) are spelled out in [Bare List Hierarchy](/reference/decisions/bare-list-hierarchy).

### "My duplicate keys collapsed into one entry"

`build_hierarchy` merges sibling entries with the same key. The merge semantics depend on whether values are strings or sections — see [`build_hierarchy`](/reference/functions#build_hierarchy).

## Implementer Symptoms

### "My parser crashes on the first indented line of a document"

You're missing the **first content line rule**: the first non-empty content line in any parsing context always starts a new entry, regardless of its indentation. Continuation detection (`indent > N`) only applies from the second content line onward. See [Parsing Algorithm — Rules every parser must implement](/parsing-algorithm#rules-every-parser-must-implement) and [Continuation Lines — Top-Level Parsing](/continuation-lines#top-level-parsing).

### "My recursive parser never terminates"

The recursion is bounded by line consumption — each recursive call must operate on a strict suffix of the input, and the indentation baseline `N` must monotonically increase with depth. If your parser re-enters with the same input slice, you have a bug in either the slice computation or the baseline detection. See [Parsing Algorithm](/parsing-algorithm) for the fixed-point structure.

### "My implementation passes 80% of the test suite but fails on edge cases"

The remaining 20% is almost always one of: continuation-tab handling, top-level indent strategy, the first-content-line rule, or CRLF preservation. Run the test suite with the conflict groups isolated — the [Test Suite Guide](/test-suite-guide) describes how to select behavior subsets so you can see which group is failing.
