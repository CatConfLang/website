---
title: Bare List Hierarchy Representation
description: Canonical representation for bare-list entries in build_hierarchy output.
---

## Normative rule

`build_hierarchy` represents bare-list entries (entries with empty keys, e.g. `= first`, `= second`) as an **array of objects**:

```json
{"items": [{"name": "first"}, {"name": "second"}]}
```

This is the form the [CCL test suite](https://github.com/catconflang/ccl-test-data) asserts against. Implementations that produce something else for `build_hierarchy` are not conformant with this function.

## Implementation guidance

An implementation has three valid options:

1. **Produce the array form** from `build_hierarchy` and declare the function as supported.
2. **Produce a different internal form** (e.g. a nested map) and do **not** declare `build_hierarchy` as a supported function. All other functions — `parse`, `get_string`, `get_list`, etc. — remain usable.
3. **Expose `get_list`** regardless of internal representation. `get_list` has well-defined array semantics independent of how `build_hierarchy` represents bare lists.

## Why

CCL's "bare list" syntax permits two reasonable readings:

1. **Array of objects** — each bare entry is a distinct list item:
   ```json
   {"items": [{"name": "first"}, {"name": "second"}]}
   ```
2. **Nested map with empty keys** — bare entries are keyed on the empty string and merged recursively:
   ```json
   {"items": {"": {"name": {"first": {}, "second": {}}}}}
   ```

The OCaml reference uses the map form internally. The test suite uses the array form as its canonical `build_hierarchy` output because:

- It matches how users think about lists in every other configuration format.
- `get_list` consumers require array semantics anyway.
- Implementations can still round-trip and query documents that contain bare lists without implementing the array form — they just omit `build_hierarchy` from their declared capabilities.

## Related

- [Library Features](/library-features) — `get_list` semantics
- [Parsing Algorithm](/parsing-algorithm)
- Historical record: [ADR 001 in ccl-test-data](https://github.com/CatConfLang/ccl-test-data/blob/main/docs/adr/001-bare-list-hierarchy-representation.md)
