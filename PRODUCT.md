# Product

## Register

product

## Users

Two overlapping audiences, both technical:

- **Users of CCL** — developers writing and reading CCL configuration files who need to learn the syntax, understand behavior, and find quick answers.
- **Implementers of CCL** — engineers building CCL parsers/libraries in their own language who need exact, unambiguous semantics, canonical behavior, and a conformance/test reference.

Their context is a working session: they arrive with a specific question (how do I express X? what does the parser do with Y?) and want to get the answer and get back to building. The reading experience — hierarchy, findability, precise reference — is the priority surface.

## Product Purpose

Documentation and reference site for CCL (Categorical Configuration Language), a minimal configuration language where everything is readable `key = value` pairs and indentation creates hierarchy. The site teaches the language to newcomers, serves as the authoritative reference for its syntax and semantics, and gives implementers a precise, testable specification. Success looks like a reader finding the exact answer fast and trusting it is correct — for both casual users and people writing a conformant parser.

## Brand Personality

Simple, cool, fun. Voice is clear and confident without being stiff — it explains a deliberately minimal language, so the docs should feel just as approachable as the format itself. Plain language over jargon, concrete examples over abstraction, a light and human tone rather than a dry specification. Precise where precision matters (implementer reference), relaxed and welcoming everywhere else.

## Anti-references

- **Corporate / enterprise SaaS heaviness** — no dense marketing gloss, no heavy chrome, no "platform" bloat. CCL is small and friendly; the docs must feel that way.
- Sterile, academic spec-document dryness that makes a simple language feel intimidating.
- Anything that undercuts credibility with implementers by being vague where they need exactness.

## Design Principles

- **The docs feel like the language.** CCL is minimal, readable, and low-ceremony; the site should be too. Simplicity is a feature to demonstrate, not just describe.
- **Answer-first.** Optimize for a reader who arrived with a question. Strong hierarchy, scannable structure, examples up front.
- **Two audiences, one site.** Keep the friendly learning path and the exact implementer reference both first-class; never sacrifice precision for warmth or warmth for precision.
- **Show, don't tell.** Lead with real CCL examples and side-by-side comparisons rather than prose claims.
- **Light, not loud.** Personality comes through in restraint, warmth of voice, and small delightful touches — not visual noise.

## Accessibility & Inclusion

Target WCAG 2.1 AA. Body text and placeholders meet ≥4.5:1 contrast (large text ≥3:1) in both light and dark themes. Respect `prefers-reduced-motion` for any animation. Maintain keyboard navigability and visible focus states (Starlight defaults, preserved). Code examples — the core content — must stay legible with sufficient contrast in the CCL syntax highlighting across both themes.
