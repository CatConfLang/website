import type { APIRoute } from "astro";
import { tags } from "../data/tags";

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
	const origin = site?.toString().replace(/\/$/, "") ?? "";

	const entries = Object.fromEntries(
		Object.entries(tags).map(([tag, { type, anchor, page }]) => {
			const url = `${origin}${page}#${anchor}`;
			return [tag, { type, url, page, anchor }];
		}),
	);

	const payload = {
		version: 1,
		generated_at: new Date().toISOString(),
		site: origin,
		count: Object.keys(entries).length,
		tags: entries,
	};

	return new Response(JSON.stringify(payload, null, 2), {
		headers: { "Content-Type": "application/json" },
	});
};
