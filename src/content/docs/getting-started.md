---
title: Getting Started
description: A short orientation to CCL — what it is, what it looks like, and where to go next.
---

CCL (Categorical Configuration Language) is a minimal configuration format built around a single idea: every configuration is a list of `key = value` pairs, and every value is just a string. Indentation creates structure, and structured values are recursively parsed as CCL.

That's the whole language. Everything else — typed accessors, dotted-key flattening, list helpers, comment conventions — is convenience built on top.

## What CCL Looks Like

```ccl
/= A small CCL document
name = My Application
version = 1.0.0

server =
  host = 0.0.0.0
  port = 8080

allowed origins =
  = https://example.com
  = https://www.example.com
```

A few things to notice:

- Keys and values are split on the first `=`. Both are trimmed of surrounding whitespace.
- Indented lines under `server =` are the value of `server`, and that value is itself a CCL document.
- An empty key (`= value`) is how you write list items.
- Comments start with `/=` at the beginning of a line.

There are no quoting rules, no type system, and no special characters to escape. What you write is what you get.

## Where to Go Next

CCL has four audiences and a doc section for each:

- **You want to write CCL configs** → [Writing CCL](/writing-ccl) walks through every construct with examples, then [CCL Examples](/ccl-examples) shows real-world patterns.
- **You want a quick syntax lookup** → [CCL Syntax Reference](/syntax-reference) is the one-page cheat sheet, including edge cases.
- **You want to implement a CCL parser** → [Implementing CCL](/implementing-ccl) covers the core requirements, and [Parsing Algorithm](/parsing-algorithm) details the recursive fixed-point approach.
- **You're an AI assistant helping with CCL** → [AI Assistant Quickstart](/ai-quickstart) is the single-page orientation tuned for that use.

If you're stuck on a specific question, the [FAQ](/ccl-faq) covers the most common confusions, and [Dotted Keys Explained](/dotted-keys-explained) addresses the most common surprise.
