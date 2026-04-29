---
title: Implementations
description: Known CCL parser implementations, with language, parsing strategy, and conformance notes.
---

This page is a catalog of CCL parser implementations the project is aware of. It is not exhaustive — if you've published a CCL parser and want it listed, open an issue on [CatConfLang/website](https://github.com/CatConfLang/website).

For what "conformant" means and how implementations differ within the spec, see [Canonical Semantics](/reference/canonical-semantics) and [Variants](/reference/variants).

## Reference Implementation

### `chshersh/ccl` (OCaml)

- **Repository:** [`chshersh/ccl`](https://github.com/chshersh/ccl)
- **Language:** OCaml
- **Parsing strategy:** [Greedy recursive-descent ("pacman")](/parsing-algorithm/pacman), implemented with the [Angstrom](https://github.com/inhabitedtype/angstrom) combinator library (~91 lines for `lib/parser.ml`).
- **Status:** Canonical reference. Authored by the language inventor. Where the spec is ambiguous, this implementation's behavior is the answer the [test suite](https://github.com/CatConfLang/ccl-test-data) asserts. See [Canonical Semantics](/reference/canonical-semantics).
- **Variant target:** [`reference_compliant`](/reference/variants#reference_compliant).

## Community Implementations

### `tylerbutler/ccl-typescript` (TypeScript)

- **Repository:** [`tylerbutler/ccl-typescript`](https://github.com/tylerbutler/ccl-typescript)
- **Language:** TypeScript
- **Parsing strategy:** [Line-oriented indent-stack](/parsing-algorithm/indent-stack) (`packages/ccl-ts/src/ccl.ts`).
- **Status:** Community implementation maintained alongside this site.

### `tylerbutler/ccl_gleam` (Gleam)

- **Repository:** [`tylerbutler/ccl_gleam`](https://github.com/tylerbutler/ccl_gleam)
- **Language:** Gleam
- **Parsing strategy:** [Line-oriented indent-stack](/parsing-algorithm/indent-stack) (`src/ccl/parser.gleam`).
- **Status:** Community implementation. Useful as a worked example of indent-stack in a functional language.

### `tylerbutler/ccl-ocaml` (OCaml, fork)

- **Repository:** [`tylerbutler/ccl-ocaml`](https://github.com/tylerbutler/ccl-ocaml)
- **Language:** OCaml
- **Parsing strategy:** Same as upstream `chshersh/ccl` (pacman / Angstrom).
- **Status:** Fork of the canonical implementation. The upstream reference is `chshersh/ccl`; prefer it unless you need a specific change in this fork.

## Picking an Implementation

If you're choosing a library to consume:

- Match your language first.
- If multiple options exist in your language (e.g. OCaml), prefer the one whose declared variant matches what your test fixtures expect — most consumers should target [`reference_compliant`](/reference/variants#reference_compliant).
- Cross-check against the [test suite](https://github.com/CatConfLang/ccl-test-data) before relying on edge-case behavior, and consult the [Behavior Reference](/behavior-reference) for the conflict pairs (continuation tabs, top-level indent, delimiter, CRLF) that legitimately differ between conformant implementations.

If you're authoring a new implementation, start with [Implementing CCL](/implementing-ccl), pick a [parsing strategy](/parsing-algorithm), and validate against [`ccl-test-data`](https://github.com/CatConfLang/ccl-test-data). The [Test Suite Guide](/test-suite-guide) covers how to declare your behavior choices so the right fixtures apply.
