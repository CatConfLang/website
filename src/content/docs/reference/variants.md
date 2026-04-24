---
title: Variants Reference
description: Spec-compliance profiles that select bundles of behaviors and features.
---

A **variant** is a named profile that bundles behavior choices and expected feature support into a single spec-compliance posture. Implementations declare a variant to say "I aim to match this reading of the spec."

Variants exist so the test suite can filter on a single field rather than enumerating every (behavior, feature) tuple that defines a conformance level.

Each heading below is the canonical anchor for the corresponding `variant:*` tag in the [test suite](https://github.com/CatConfLang/ccl-test-data).

## reference_compliant

**Tag:** `variant:reference_compliant`

Matches the OCaml reference implementation's semantics. An implementation declaring `reference_compliant` commits to:

- `toplevel_indent_strip` for [continuation baseline](/behavior-reference#continuation-baseline) — `parse` uses N = 0 at top level, top-level keys are `String.trim`-ed.
- `continuation_tab_to_space` for [continuation tab handling](/behavior-reference#tab-handling) — leading `\t` on continuation lines normalizes 1:1 to a single space.
- `indent_spaces` for [indentation output](/behavior-reference#indentation-style) — formatting functions emit two spaces per level.
- Support for the [`tab_in_value_preserved`](/reference/features#tab_in_value_preserved) and [`toplevel_indent_strip`](/reference/features#toplevel_indent_strip) features.
- The [bare-list hierarchy shape](/reference/decisions/bare-list-hierarchy/) (array of objects) for `build_hierarchy` output.
- The [CRLF uniform-handling rule](/reference/decisions/crlf-nested/) when combined with `crlf_preserve_literal`.

New implementations should target this variant unless they have a specific reason to diverge.

## See Also

- [Functions Reference](/reference/functions/)
- [Features Reference](/reference/features/)
- [Behavior Reference](/behavior-reference/)
