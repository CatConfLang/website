/**
 * Postbuild check: every tag in dist/tag-index.json must resolve to a real
 * id="<anchor>" in the target page's built HTML. Fails the build otherwise.
 *
 * Runs after `pnpm build` so Netlify deploys (and local builds) catch drift
 * between src/data/tags.ts and the actual rendered pages.
 */

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const DIST = "dist";
const indexPath = join(DIST, "tag-index.json");

if (!existsSync(indexPath)) {
	console.error(`verify-tag-anchors: ${indexPath} not found; run pnpm build first.`);
	process.exit(2);
}

const index = JSON.parse(await readFile(indexPath, "utf8"));

const problems = [];
for (const [tag, info] of Object.entries(index.tags)) {
	const page = info.page.replace(/^\/|\/$/g, "");
	const htmlPath = page === "" ? join(DIST, "index.html") : join(DIST, page, "index.html");
	if (!existsSync(htmlPath)) {
		problems.push({ tag, reason: `page not rendered: ${htmlPath}` });
		continue;
	}
	const html = await readFile(htmlPath, "utf8");
	if (!html.includes(`id="${info.anchor}"`)) {
		problems.push({ tag, reason: `anchor #${info.anchor} not in ${htmlPath}` });
	}
}

const checked = Object.keys(index.tags).length;
if (problems.length > 0) {
	console.error(`verify-tag-anchors: ${problems.length}/${checked} tags failed to resolve:`);
	for (const { tag, reason } of problems) {
		console.error(`  ${tag.padEnd(45)} -> ${reason}`);
	}
	console.error(
		"\nFix: either update src/data/tags.ts to point at the right anchor, or add the missing anchor on the target page.",
	);
	process.exit(1);
}

console.log(`verify-tag-anchors: all ${checked} tags resolve to real anchors.`);
