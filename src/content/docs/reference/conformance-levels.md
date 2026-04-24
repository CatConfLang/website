---
title: Conformance Levels
description: How CCL features, behaviors, and library functions stack into conformance tiers — from the mandatory core to optional and experimental layers.
---

CCL conformance is layered. An implementation can be fully conformant while exposing only a small core, and can opt into successive layers by declaring the relevant tags. This page maps the existing tag taxonomy onto four tiers so implementers can see at a glance what's required, what's a choice, what's optional, and what's experimental.

This page is a synthesis. The normative source for each tag is the page linked from its row.

## Tier 1 — Core (Required)

Everything in this tier **must** work the same in every conformant implementation. There is no opt-out.

| Concern | Tag(s) | Reference |
|---|---|---|
| Parsing — produces a CCL tree from a string | _function_ `parse` | [`parse`](/reference/functions#parse) |
| Building a hierarchical map from the parsed tree | _function_ `build_hierarchy` | [`build_hierarchy`](/reference/functions#build_hierarchy) |
| Comments | `feature:comments` | [Features — comments](/reference/features#comments) |
| Empty-key list entries | `feature:empty_keys` | [Features — empty_keys](/reference/features#empty_keys) |
| Multiline value continuation | `feature:multiline_continuation` | [Features — multiline_continuation](/reference/features#multiline_continuation) |
| Multiline keys | `feature:multiline_keys` | [Features — multiline_keys](/reference/features#multiline_keys) |
| UTF-8 in keys and values | `feature:unicode` | [Features — unicode](/reference/features#unicode) |
| Whitespace trimming on keys and values | `feature:whitespace` | [Features — whitespace](/reference/features#whitespace) |
| Tabs preserved literally inside values | `feature:tab_in_value_preserved` | [Features — tab_in_value_preserved](/reference/features#tab_in_value_preserved) |
| Top-level indentation handled (one of the two strategies; see Tier 2) | `feature:toplevel_indent_strip` _or_ behavior pair | [Features — toplevel_indent_strip](/reference/features#toplevel_indent_strip) |

In addition, every implementation must obey the canonical [Decisions](/reference/decisions/bare-list-hierarchy) (bare-list shape, CRLF nested handling). These are not optional features — they are normative resolutions of spec ambiguities.

**Test-suite filtering:** A core-only implementation declares the `feature:*` tags above and no behaviors beyond what's needed to disambiguate Tier 2 conflicts. Tests that require any tag the implementation hasn't declared are skipped.

## Tier 2 — Behavior Choices (Required to declare, free to choose)

Tier 2 is "you must pick one option from each conflict pair, and tests that assume the other option are skipped." There is no neutral position — every implementation has a choice baked in even if it didn't make one explicitly.

| Conflict | Options | Reference |
|---|---|---|
| Continuation tab handling | `continuation_tab_to_space` ↔ `continuation_tab_preserve` | [Behavior Reference — Tab Handling](/behavior-reference#tab-handling) |
| Top-level indentation strategy | `toplevel_indent_strip` ↔ `toplevel_indent_preserve` | [Behavior Reference — Continuation Baseline](/behavior-reference#continuation-baseline), [Continuation Lines](/continuation-lines#two-parsing-contexts) |
| Delimiter | `delimiter_first_equals` ↔ `delimiter_prefer_spaced` | [Behavior Reference — Delimiter Mode](/behavior-reference#delimiter-mode) |
| Line endings | `crlf_normalize_to_lf` ↔ `crlf_preserve_literal` | [Behavior Reference — Line Endings](/behavior-reference#line-endings), [CRLF Handling in Nested Structures](/reference/decisions/crlf-nested) |
| Indentation output style | `indent_spaces` ↔ `indent_tabs` | [Behavior Reference — Indentation Style](/behavior-reference#indentation-style) |
| Array order | `array_order_insertion` ↔ `array_order_lexicographic` | [Behavior Reference — Array Ordering](/behavior-reference#array-ordering) |
| Boolean parsing strictness | `boolean_strict` ↔ `boolean_lenient` | [Behavior Reference — Boolean Parsing](/behavior-reference#boolean-parsing) |
| List coercion | `list_coercion_enabled` ↔ `list_coercion_disabled` | [Behavior Reference — List Coercion](/behavior-reference#list-coercion) |

The canonical bundle is the [`reference_compliant`](/reference/variants#reference_compliant) variant, which selects the OCaml reference implementation's choice for each pair. New implementations should target it unless they have a specific reason to diverge.

For the complete list of conflict pairs and the meaning of each option, see the [Behavior Reference](/behavior-reference).

## Tier 3 — Optional Library Features

Tier 3 is genuinely optional. An implementation can omit everything here and still be conformant on Tier 1 + Tier 2. Tests for Tier 3 features are filtered out for implementations that don't declare them.

| Concern | Tag | Reference |
|---|---|---|
| Typed accessors (`get_string`, `get_int`, `get_bool`, `get_float`, `get_list`) | `feature:optional_typed_accessors` | [Features — optional_typed_accessors](/reference/features#optional_typed_accessors), [Functions — Typed Access](/reference/functions#typed-access) |
| Filtering (e.g. stripping comments) | _function_ `filter` | [`filter`](/reference/functions#filter) |
| Composition / merging of CCL documents | _function_ `compose` | [`compose`](/reference/functions#compose) |
| Pretty printing | _function_ `print` | [`print`](/reference/functions#print) |
| Canonical formatting | _function_ `canonical_format` | [`canonical_format`](/reference/functions#canonical_format) |
| Lossless round-trip | _function_ `round_trip` | [`round_trip`](/reference/functions#round_trip) |
| Path-aware loading from disk | _function_ `load` | [`load`](/reference/functions#load) |

Optional functions are documented in [Functions Reference](/reference/functions); the test suite exercises them only when an implementation declares the corresponding tag in its capabilities list.

## Tier 4 — Experimental

Tier 4 is **explicitly opt-in and may change**. No implementation needs to support these to be conformant at any other tier, and the test suite tags them so they can be excluded.

| Concern | Tag | Reference |
|---|---|---|
| Dotted-key expansion (`expand_dotted`) | `feature:experimental_dotted_keys` | [Features — experimental_dotted_keys](/reference/features#experimental_dotted_keys), [Dotted Keys Explained](/dotted-keys-explained), [`expand_dotted`](/reference/functions#expand_dotted) |

Experimental tags exist to let implementations and consumers prototype an idea without committing the rest of the ecosystem to it. If an experimental feature stabilises, it graduates to Tier 3 (or, if it changes how the language is parsed, to Tier 1 with a corresponding feature tag).

## Quick Decision Guide

- **"What's the minimum I need to ship?"** Tier 1 + a declared choice for each Tier 2 conflict. `reference_compliant` is the safe default.
- **"Can I skip typed accessors?"** Yes — they're Tier 3.
- **"Can I treat `database.host` as nested?"** Only via `expand_dotted` (Tier 4, experimental). Without that, dotted keys are literal strings — see [Dotted Keys Explained](/dotted-keys-explained).
- **"My output differs from another implementation."** Check Tier 2 first — that's where legitimate differences live. If both implementations declare the same option for every conflict pair and still disagree, one of them has a bug. See [Troubleshooting — Cross-Implementation Symptoms](/troubleshooting#cross-implementation-symptoms).

## See Also

- [Features Reference](/reference/features) — every `feature:*` tag, normative
- [Behavior Reference](/behavior-reference) — every behavior conflict pair, normative
- [Variants Reference](/reference/variants) — named bundles of behavior choices
- [Canonical Semantics](/reference/canonical-semantics) — how the OCaml reference resolves spec ambiguities
- [Implementations](/reference/implementations) — known parsers and their declared variants
