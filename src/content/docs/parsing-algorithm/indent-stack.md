---
title: Indent-Stack Parser
description: Line-oriented strategy for parsing CCL — tokenize into flat entries tracking a baseline indent, then recursively re-parse values containing =. Predictable O(N), streaming-friendly.
---

Used by the [TypeScript](https://github.com/tylerbutler/ccl-typescript) (`packages/ccl-ts/src/ccl.ts`) and [Gleam](https://github.com/tylerbutler/ccl_gleam) (`src/ccl/parser.gleam`) implementations. Similar in spirit to how Python, YAML, and Pug parse indentation.

## Idea

Walk the input line by line, tracking a baseline indent. For each line, if `indent > baseline` it is a continuation of the current entry's value; otherwise it starts a new entry. Emit a flat list of `Entry {key, value: string}`. Build the tree in a second pass that recursively re-parses any value containing `=` until the fixed point.

## Pseudocode

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

## Worked trace

On the input from [Complete Example](/parsing-algorithm#complete-example) (top-level `baseline = 0`, followed by a recursive call with `baseline = 2` for each non-empty nested value):

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

## Complexity

**O(N)**. Each byte is visited once during tokenization and once more during recursive value re-parse, so total work is O(N). Tokenization is streaming-friendly. Natural fit for imperative languages (TypeScript) and for functional recursive state machines (Gleam).

## Notes

**Good fit when** you want predictable performance on large inputs, a clean separation of tokenization from tree-building, or straightforward integration with typed AST libraries.

See also: [Pacman Parser](/parsing-algorithm/pacman) for the alternative strategy, and [Rules every parser must implement](/parsing-algorithm#rules-every-parser-must-implement) for the strategy-agnostic contract both parsers satisfy.
