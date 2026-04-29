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

`build_hierarchy` is a JSON-friendly **view** of [`build_model`](/reference/functions#build_model), the canonical CCL data model. In `build_model`, the recursive `Model` type is `Map<string, Model>` — string values become keys pointing to the empty model `{}`. The projection rule for `build_hierarchy` is:

- Keys whose inner model has multiple entries all pointing to `{}` → array of strings

For `= alice`, `= bob` under `users`, the `build_model` output is:

```json
{"users": {"": {"alice": {}, "bob": {}}}}
```

The `build_hierarchy` projection of the inner `{"alice": {}, "bob": {}}` node (multiple keys, all leaves) is `["alice", "bob"]` — producing the flat list-under-parent-key form. This is not a behavior choice; it follows directly from the projection rule.

The OCaml reference implementation (`fix : Parser.key_val list -> t`) is the reference implementation of `build_model`. It does not use an "empty-key map" representation — it uses a pure recursive fixed-point map where string values become keys. The OCaml model has no list type at all; `get_list` would be implemented by extracting the keys of an inner map whose values are all empty.

The test suite uses the list-under-parent-key form as the canonical `build_hierarchy` output because:

- It is the correct projection of `build_model` leaf nodes.
- It matches how users expect lists in every other configuration format.
- `get_list` consumers require list semantics anyway.
- Implementations can still round-trip and query documents that contain bare lists without implementing the list form — they just omit `build_hierarchy` from their declared capabilities.

## Related

- [Library Features](/library-features) — `get_list` semantics
- [Parsing Algorithm](/parsing-algorithm)
- Historical record: [ADR 001 in ccl-test-data](https://github.com/CatConfLang/ccl-test-data/blob/main/docs/adr/001-bare-list-hierarchy-representation.md)
