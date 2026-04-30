# CLAUDE.md - ccl-website

Package-specific guidance for the CCL documentation site built with Astro and Starlight.

## Package Overview

Documentation site for CCL (Categorical Configuration Language) deployed to https://ccl.tylerbutler.com. Built with Astro framework and Starlight documentation theme.

**Deployment:** Netlify (SSR mode)
**Dev Server:** `pnpm dev`
**Build Output:** `dist/` (Netlify adapter)
**Merge workflow:** Squash-merge — every PR lands as one commit on `main`, so intermediate review-fix commits on a branch are fine and don't need to be rebased or amended away.

## Project Structure

```
src/
├── assets/            # Logo, favicon, images
├── content/
│   └── docs/          # Markdown documentation files
│       ├── index.mdx  # Homepage
│       ├── reference/ # Reference docs + decisions/
│       ├── getting-started.md
│       ├── syntax-reference.md
│       └── ...
├── content.config.ts  # Content collections config
├── data/              # Tag metadata (tags.ts, tag-index.json.ts)
├── pages/             # Additional Astro pages outside the docs collection
├── styles/
│   └── custom.css     # Global styles
└── env.d.ts           # TypeScript environment definitions

scripts/
└── verify-tag-anchors.mjs  # Post-build check that tag anchors resolve
```

## Astro + Starlight Patterns

### Configuration (astro.config.mjs)

```javascript
export default defineConfig({
  output: "server",              // SSR mode for Netlify
  adapter: netlify({ imageCDN: false }),
  site: "https://ccl.tylerbutler.com",
  // Keep zod bundled so Astro's v3 and user-installed v4 don't collide
  vite: { ssr: { noExternal: ["zod"] } },
  integrations: [
    starlight({
      head: [/* Tinylytics analytics script */],
      title: "CCL",
      logo: {/* light + dark logo, replacesTitle */},
      favicon: "./src/assets/ccl-favicon.png",
      social: [/* GitHub link */],
      sidebar: [/* ... */],       // Navigation structure
      plugins: [/* ... */],       // Starlight plugins
      expressiveCode: {/* ... */}, // Code syntax highlighting
    }),
  ],
  markdown: {
    remarkPlugins: [/* ... */],   // Markdown processing
  },
});
```

**Key Features:**
- SSR rendering via Netlify adapter
- Custom CCL syntax highlighting (ccl.tmLanguage.json)
- Starlight theme with customization (custom logo, favicon, GitHub social link)
- Tinylytics analytics injected via `head`
- `vite.ssr.noExternal: ["zod"]` workaround for the Astro v3 / user-installed v4 zod conflict
- Multiple remark plugins for markdown processing

### Content Collections

Content is organized as Astro content collections:

```typescript
// src/content.config.ts
import { defineCollection } from "astro:content";
import { docsSchema } from "@astrojs/starlight/schema";

export const collections = {
  docs: defineCollection({ schema: docsSchema() }),
};
```

**File Organization:**
- All docs in `src/content/docs/`
- Frontmatter validated by Starlight's schema
- Slug-based routing (e.g., `getting-started.md` → `/getting-started`)

### Sidebar Configuration

Sidebar structure defined in `astro.config.mjs`:

```javascript
sidebar: [
  {
    label: "For AI Assistants",
    items: [
      { slug: "ai-quickstart" },
      { slug: "ai-implementation-guide" },
      { slug: "ai-writing-guide" },
      { slug: "ai-prompts" },
    ],
  },
  {
    label: "Learning CCL",
    items: [
      { slug: "getting-started" },
      { slug: "writing-ccl" },
      { slug: "ccl-examples" },
      { slug: "ccl-faq" },
    ],
  },
  {
    label: "Implementation",
    items: [
      { slug: "implementing-ccl" },
      { slug: "parsing-algorithm" },
      { slug: "continuation-lines" },
      { slug: "library-features" },
      { slug: "test-suite-guide" },
      { slug: "behavior-reference" },
    ],
  },
  {
    label: "Reference",
    items: [
      { slug: "syntax-reference" },
      { slug: "dotted-keys-explained" },
      { slug: "reference/functions" },
      { slug: "reference/features" },
      { slug: "reference/variants" },
      { slug: "reference/canonical-semantics" },
      {
        label: "Decisions",
        items: [
          { slug: "reference/decisions/bare-list-hierarchy" },
          { slug: "reference/decisions/crlf-nested" },
        ],
      },
    ],
  },
],
```

**Important:** Add new docs to sidebar manually - not auto-generated.

## Custom Syntax Highlighting

CCL syntax highlighting via TextMate grammar:

```javascript
const cclGrammar = JSON.parse(
  fs.readFileSync("ccl.tmLanguage.json", "utf-8")
);

starlight({
  expressiveCode: {
    shiki: {
      langs: [cclGrammar],
      langAlias: {
        ccl: "CCL",
        pseudocode: "python",
      },
    },
  },
});
```

**Usage in Markdown:**
````markdown
```ccl
key = value
nested =
  child = value
```
````

## Starlight Plugins

Wired into the Starlight `plugins` array:

- `starlight-links-validator` - Validates internal links at build time
- `starlight-llms-txt` - Generates `llms.txt` for AI crawlers

Installed and available for use in MDX content (not registered as Starlight plugins):

- `starlight-heading-badges` - Badge components next to headings
- `starlight-package-managers` - Tabbed package-manager command blocks

## Typography and Styling

**Fonts:**
- Body: Metropolis (400, 600 weights)
- Code: Fira Code (custom via expressiveCode)

**Custom Styles:**
- Global CSS: `src/styles/custom.css`
- Override Starlight variables for theming
- Custom font families for code blocks

## Markdown Extensions

**Remark Plugins:**
- `@fec/remark-a11y-emoji` - Accessible emoji rendering
- `@hashicorp/platform-remark-plugins/includeMarkdown` - Markdown transclusion

**Include Markdown from other files:**
```markdown
@include 'path/to/file.md'
```

## Development Commands

```bash
# Start dev server (hot reload)
pnpm dev

# Build for production — runs `astro build` then `scripts/verify-tag-anchors.mjs`
pnpm build

# Preview production build
pnpm preview

# Type-check the Astro project
pnpm check:astro

# Verify tag anchors only (subset of the build step)
pnpm check:tag-anchors

# Remove dist/, caches, and tsbuildinfo
pnpm clean

# Astro CLI commands
pnpm astro <command>
```

## Common Workflows

### Adding a New Documentation Page

1. Create `src/content/docs/new-page.md`
2. Add frontmatter:
   ```markdown
   ---
   title: Page Title
   description: Short description for SEO
   ---
   ```
3. Add to sidebar in `astro.config.mjs`:
   ```javascript
   { slug: "new-page" }
   ```
4. Preview locally with `pnpm dev`; validate the site, links, and anchors with `pnpm build`

### Adding or Renaming a CCL Function (or Feature/Behavior/Variant)

The reference pages (`/reference/functions/`, `/reference/features/`, `/behavior-reference/`, `/reference/variants/`) host anchors that the ccl-test-data test suite links to via tags (`function:*`, `feature:*`, `behavior:*`, `variant:*`). Two files must move together:

1. The anchor on the relevant reference page (the `id="..."` Starlight emits from a heading).
2. The matching entry in `src/data/tags.ts`, which the build serializes to `dist/tag-index.json`.

**Both directions must be kept in sync**, but only one direction is checked locally:

- `scripts/verify-tag-anchors.mjs` (runs in `pnpm build`) verifies every entry in `tags.ts` resolves to a real anchor — **catches stale tags**.
- It does **not** catch a new anchor added to the docs without a corresponding `tags.ts` entry. That failure surfaces only in ccl-test-data's `just validate-tags` CI, which fetches `tag-index.json`. Pair-PRs against ccl-test-data will fail until `tags.ts` is updated.

When changing the function/feature/behavior/variant taxonomy:
1. Update or add the heading anchor on the reference page.
2. Add/rename/remove the entry in `src/data/tags.ts` (keep the `// Functions (N)` count comment accurate).
3. Run `pnpm build` to confirm `verify-tag-anchors` passes.
4. Confirm the authoritative taxonomy in `ccl-test-data/config/config.go` matches.

### Using MDX Features

For React components or advanced content, use `.mdx` extension:

```mdx
---
title: Advanced Page
---

import MyComponent from '../../components/MyComponent.astro';

<MyComponent prop="value" />
```

### Custom Code Syntax

CCL code blocks use custom grammar:

````markdown
```ccl
/= CCL comment
key = value
dotted.key.path = literal dotted key
```
````

Fallback to Python for pseudocode:

````markdown
```pseudocode
function parse(input):
  return result
```
````

## Build Output

**Development (`pnpm dev`):**
- Hot module reload
- Runs on http://localhost:4321 (default)
- Fast refresh for content changes

**Production (`pnpm build`):**
- SSR build for Netlify
- Output to `dist/`
- Includes server functions for dynamic rendering
- `.astro/` cache directory (gitignored)
- Post-build step: `node scripts/verify-tag-anchors.mjs` fails the build if any tag anchor is unresolved

## Netlify Deployment

**Adapter Configuration:**
```javascript
adapter: netlify({
  imageCDN: false,  // Disable Netlify image optimization
}),
```

**Deployment:**
- Automatic via Netlify GitHub integration
- Build command: `pnpm build`
- Publish directory: `dist/`
- Site URL: https://ccl.tylerbutler.com

## Content Guidelines

**Frontmatter Requirements:**
```yaml
---
title: Page Title        # Required
description: Description # Required for SEO
lastUpdated: true       # Optional, shows last update date
---
```

**Internal Links:**
- Use relative paths: `[link text](./other-page)`
- Validated at build time by starlight-links-validator
- External links open in new tab (Starlight default)

**Code Blocks:**
- Use language identifiers: `ccl`, `typescript`, `bash`, etc.
- CCL blocks get custom syntax highlighting
- Include descriptive titles for complex examples

## Starlight Features

**Built-in Components:**
- `<Aside>` - Callout boxes (note, tip, caution, danger)
- `<Card>` - Visual card containers
- `<CardGrid>` - Grid layout for cards
- `<LinkCard>` - Link preview cards
- `<Tabs>` - Tab containers for alternative content

**Example:**
```markdown
<Aside type="tip">
This is a helpful tip!
</Aside>
```

## Package-Specific Constraints

- All docs must be in `src/content/docs/`
- Sidebar must be manually updated in `astro.config.mjs`
- CCL syntax requires `ccl.tmLanguage.json` to be present
- SSR mode requires Netlify adapter
- Build validates all internal links (fails on broken links)
- Build also verifies tag anchors via `scripts/verify-tag-anchors.mjs` (one-way: declared tags → real anchors; new anchors without `tags.ts` entries are NOT caught — see the "Adding or Renaming a CCL Function" workflow)
- Custom fonts must be imported in `astro.config.mjs`
