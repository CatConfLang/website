---
title: Bare List Hierarchy Representation
description: Canonical representation for bare-list entries in build_hierarchy output.
---

## Normative rule

`build_hierarchy` represents sibling entries with the empty key (e.g. `= alice`, `= bob`) as a **list under the parent key**. The list element type depends on the value type of each bare entry.

### Case 1: bare list of strings

When each bare entry's value is a plain string (no further `=`), the result is a flat list of strings:

```ccl
users =
  = alice
  = bob
```

```json
{"users": ["alice", "bob"]}
```

### Case 2: bare list of objects

When each bare entry's value contains nested CCL, the values are recursively built and the result is a list of objects:

```ccl
items =
  =
    name = first
    weight = 1
  =
    name = second
    weight = 2
```

```json
{"items": [{"name": "first", "weight": "1"}, {"name": "second", "weight": "2"}]}
```

These shapes are what the [CCL test suite](https://github.com/CatConfLang/ccl-test-data) asserts against. Implementations that produce something materially different from `build_hierarchy` are not conformant with this function.

## Implementation guidance

An implementation has three valid options:

1. **Produce the list-under-parent-key form** from `build_hierarchy` and declare the function as supported.
2. **Produce a different internal form** (e.g. a nested map keyed on the empty string) and do **not** declare `build_hierarchy` as a supported function. All other functions — `parse`, `get_string`, `get_list`, etc. — remain usable.
3. **Expose `get_list`** regardless of internal representation. `get_list` has well-defined list semantics independent of how `build_hierarchy` represents bare lists.

## Why

CCL's "bare list" syntax permits two reasonable readings:

1. **List under the parent key** — bare entries collapse into a list value:
   ```json
   {"users": ["alice", "bob"]}
   ```
2. **Nested map with empty keys** — bare entries are keyed on the empty string and merged recursively:
   ```json
   {"users": {"": ["alice", "bob"]}}
   ```

The OCaml reference uses the empty-key map form internally. The test suite uses the list-under-parent-key form as its canonical `build_hierarchy` output because:

- It matches how users think about lists in every other configuration format.
- `get_list` consumers require list semantics anyway.
- Implementations can still round-trip and query documents that contain bare lists without implementing the list form — they just omit `build_hierarchy` from their declared capabilities.

## Related

- [Library Features](/library-features) — `get_list` semantics
- [Parsing Algorithm](/parsing-algorithm)
- Historical record: [ADR 001 in ccl-test-data](https://github.com/CatConfLang/ccl-test-data/blob/main/docs/adr/001-bare-list-hierarchy-representation.md)
