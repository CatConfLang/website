---
title: Canonical Semantics
description: The OCaml reference implementation is canonical where the CCL spec allows ambiguity.
---

## Normative rule

**The [OCaml reference implementation](https://github.com/chshersh/ccl) is canonical for CCL semantics.** Where the written spec is ambiguous — most commonly around tab/indent handling, bare-list representation, and continuation-line edge cases — the OCaml implementation's behavior is the answer. The [CCL test suite](https://github.com/CatConfLang/ccl-test-data) tracks OCaml's semantics; non-OCaml alternatives are dropped from the fixtures unless a concrete consumer needs them.

## Why

CCL is a tiny language with a deceptive amount of surface. Short specs leave room for honest disagreement on corner cases: what happens to leading tabs on continuation lines, how bare-list entries should appear in `build_hierarchy` output, whether top-level leading whitespace should be stripped. If every implementation authored its own reading of the spec, the language would fragment.

Picking one reference implementation as the tiebreaker makes those choices **testable** rather than opinion-level. Implementations that match OCaml pass the test suite. Implementations that want to diverge can — they just opt out of specific function tags (see [Bare List Hierarchy Representation](/reference/decisions/bare-list-hierarchy/) for an example) or declare a different [behavior choice](/behavior-reference/) where the taxonomy allows one.

## What this means in practice

- Tests expect the OCaml output shape. If your implementation produces something materially different and the taxonomy doesn't cover it as a behavior, you have a bug (not a "philosophical difference").
- The [`variant:reference_compliant`](/reference/variants#reference_compliant) profile is the OCaml-aligned configuration. New implementations should target it unless they have a specific reason to diverge.
- Where behavior genuinely varies between reasonable implementations, the test suite encodes the variation as a [behavior pair](/behavior-reference/) (e.g. `indent_spaces` vs `indent_tabs`), not as fragmentation.

## When an ambiguity surfaces

If you hit a spec-ambiguous case not covered by an existing behavior tag or decision page:

1. Check OCaml's behavior.
2. If it's a one-off subtlety, file against the test-data repo — the decision becomes canonical as a new [decision page](/reference/decisions/bare-list-hierarchy/) here.
3. If it's a real variation point, propose a new behavior pair (with mutually-exclusive options) against the taxonomy in `ccl-test-data/config/config.go`.

## Related

- [Decisions](/reference/decisions/bare-list-hierarchy/) — canonical rulings on specific ambiguities
- [Behavior Reference](/behavior-reference/) — implementation choices
- [Variants Reference](/reference/variants/) — spec-compliance profiles
