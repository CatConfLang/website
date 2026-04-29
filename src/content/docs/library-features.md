---
title: Library Features
description: Optional convenience APIs for type-safe access, entry processing, and formatting in CCL implementations.
---

:::note[Core vs Library Features]
**Core CCL** requires `parse`, `build_model`, and `build_hierarchy`. Everything in this document is **optional library convenience** built on top of those. Implementations can adapt these features to their language idioms.
:::

## Type-Safe Value Access

CCL values are always strings. Type conversion is a library convenience, not part of Core CCL.

**Common Functions**:
- `get_string(config, path...)` - Extract string values
- `get_int(config, path...)` - Parse integers with validation
- `get_bool(config, path...)` - Parse booleans (true/false, yes/no, 1/0)
- `get_list(config, path...)` - Extract lists from empty-key entries or duplicate keys

**Example**:
```ccl
app =
  name = MyApp
  port = 8080
  debug = true
```

```pseudocode
name = get_string(config, "app", "name")     // "MyApp"
port = get_int(config, "app", "port")        // 8080
debug = get_bool(config, "app", "debug")     // true
```

## Entry Processing

Manipulate CCL entries for composition and filtering.

**Common Functions**:
- `filter(entries, predicate)` - Remove entries (e.g., comments)
- `compose(entries1, entries2)` - Concatenate entry lists before downstream hierarchy building

**Example**:
```ccl
/= Development config
database =
  host = localhost

/= Production overrides
database =
  host = prod.db.com
```

```pseudocode
dev_entries = parse(dev_config)
prod_entries = parse(prod_config)
combined = compose(dev_entries, prod_entries)
final_config = build_hierarchy(combined)
```

`compose` is intentionally an **entry-processing helper**, not an object merge API.
The expected flow is:

```pseudocode
entries_a = parse(text_a)
entries_b = parse(text_b)
merged_entries = compose(entries_a, entries_b)
final_config = build_hierarchy(merged_entries)
```

This keeps composition pure at the `Entry[]` layer and gives `[]` the expected
left/right identity for compose.

## Formatting Functions

CCL provides two distinct formatting functions that serve different purposes.

| Function | Purpose | Property |
|----------|---------|----------|
| `print` | Standard format | Structure-preserving: `print(parse(x)) == x` for standard inputs |
| `canonical_format` | Model-level format | Semantic-preserving: transforms `key = value` to nested form |

### The `print` Function

**Purpose**: Convert parsed entries back to CCL text format, preserving the original structure.

**Key Property**: For inputs in standard format:
```
print(parse(x)) == x
```

This is an **entry-level isomorphism** - the round-trip preserves the textual structure.

**Example**:
```ccl
name = Alice
config =
  port = 8080
  debug = true
```

After `parse` and `print`, the structure is preserved exactly.

### The `canonical_format` Function

**Purpose**: Render a `CCL` value as normalized CCL text — stable key ordering, consistent indentation, no redundant whitespace. Two semantically equal inputs produce identical output.

**Key Property**: For a canonical input, `canonical_format` is a fixed point:
```
canonical_format(canonical_format(x)) == canonical_format(x)
```

Unlike `print`, which preserves the original text structure, `canonical_format` normalizes key order and indentation. The OCaml reference implementation's `pretty` function is its equivalent.

**Note on the underlying model**: The [canonical CCL data model](/reference/functions#canonical-data-model) represents all values as keys in a recursive map — `name = Alice` becomes `{"name": {"Alice": {}}}` internally. `canonical_format` renders this model back to CCL text. This means two inputs that are semantically equal in the model produce identical `canonical_format` output, even if they looked different as source text.

### Standard Input Format

A CCL input is in **standard format** when:

1. Keys have exactly one space before and after `=`
2. Nested content uses 2-space indentation per level
3. Line endings are LF only (CR characters become part of value content)
4. No extra whitespace before keys or after values

**Standard format**:
```ccl
key = value
nested =
  child = value
```

**Non-standard** (extra spaces):
```ccl
key  =  value
  nested =
```

### Round-Trip Testing

Use `round_trip` to verify the isomorphism property:

```
parse(print(parse(x))) == parse(x)
```

This verifies that `print` followed by `parse` produces identical entries to the original parse.

### Implementation Guidance

For structure-preserving `print`, implementations need to track whether a value was originally a string or nested structure. Options:

1. **Leaf flag**: Mark nodes that were originally string values
2. **Original value storage**: Keep raw string alongside children
3. **Entry preservation**: Keep original entry list, build hierarchy on-demand

For new implementations, use a **tagged union** type:

```pseudocode
type Value =
  | String(string)
  | Object(map<string, Value>)
  | List(list<Value>)
```

This makes `print` straightforward to implement while still supporting `canonical_format` when needed.

## Experimental Features

Some implementations provide additional experimental features:

**Dotted Representation** (experimental):
- Allows accessing nested values using dot-separated paths in a single argument
- Example: `get_string(config, "database.host")` instead of `get_string(config, "database", "host")`
- **Not recommended** for new implementations - use variadic path arguments as the standard API
- May be useful for compatibility with existing configuration conventions

## Test Suite Coverage

The [CCL Test Suite](https://github.com/CatConfLang/ccl-test-data) provides tests for these features:

- **Type-Safe Access**: `get_string`, `get_int`, `get_bool`, `get_float`, `get_list` — covered by tests tagged `optional_typed_accessors`
- **Entry Processing**: `filter`, `compose`, and compose algebraic properties evaluated by normalizing `build_hierarchy(compose(...))`
- **Formatting**: `print` and `round_trip` tests verify isomorphism properties
- **Experimental Features**: `experimental_dotted_keys` tests for dotted representation

See [Test Suite Guide](/test-suite-guide) for complete function list and filtering examples.
