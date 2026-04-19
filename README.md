# CCL Website

Documentation website for CCL (Categorical Configuration Language), built with Astro and Starlight. Deployed to <https://ccl.tylerbutler.com>.

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Content

Documentation content is sourced from the `ccl-test-data/docs` directory and adapted for Starlight. The site includes:

- Getting started guide
- Format comparison with other configuration languages
- Implementation guide for language authors
- Test architecture documentation
- API reference
- Glossary and FAQ

## Tech Stack

- **Astro**: Static site generator
- **Starlight**: Documentation theme
- **TypeScript**: Type safety
- **Netlify**: Deployment platform

## History

This repository was split out of [ccl-typescript](https://github.com/CatConfLang/ccl-typescript) (previously at `packages/ccl-docs`) to live as a standalone project. Git history for the docs is preserved.