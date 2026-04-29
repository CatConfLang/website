# CCL Website

Documentation website for CCL (Categorical Configuration Language), built with Astro and Starlight. Deployed to <https://ccl.tylerbutler.com>.

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production (runs tag-anchor verification after the Astro build)
pnpm build

# Preview production build
pnpm preview

# Type-check the Astro project
pnpm check:astro

# Verify tag anchors only
pnpm check:tag-anchors

# Remove build artifacts
pnpm clean
```

## Content

Documentation content lives in `src/content/docs/` and is organized by the sidebar in `astro.config.mjs`:

- **Learning CCL** — getting started, writing CCL, examples, FAQ, troubleshooting
- **Implementation** — implementing CCL, parsing algorithm, continuation lines, library features, test suite guide, behavior reference
- **Reference** — syntax reference, dotted keys, functions, features, variants, canonical semantics, conformance levels, implementations, and design decisions
- **For AI Assistants** — AI quickstart, implementation guide, writing guide, prompts

## Tech Stack

- **Astro** — framework (SSR via `@astrojs/netlify`)
- **Starlight** — documentation theme, with `starlight-links-validator` and `starlight-llms-txt` plugins
- **TypeScript** — type safety
- **Netlify** — deployment platform
