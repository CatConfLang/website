/**
 * Source of truth for the CCL test-tag → documentation-URL mapping.
 *
 * Every tag used by the ccl-test-data test suite (`function:*`, `feature:*`,
 * `behavior:*`, `variant:*`) must resolve to a canonical URL on this site.
 * The build emits `dist/tag-index.json` from this data so the test-data CI
 * can verify both directions of the contract:
 *
 *   1. Every tag declared here must resolve to an anchor that actually exists
 *      on the target page (the Starlight links validator enforces this at
 *      build time via references we add from other docs).
 *   2. Every tag the test suite uses must appear here (the test-data repo's
 *      `just validate-tags` target enforces this by fetching tag-index.json).
 *
 * When the authoritative taxonomy in `ccl-test-data/config/config.go`
 * changes, update this file too.
 */

export type TagType = "function" | "feature" | "behavior" | "variant";

export interface TagEntry {
	type: TagType;
	/** Anchor on the target page, e.g. "parse" for #parse. */
	anchor: string;
	/** Path of the page that hosts the anchor. */
	page: string;
}

/**
 * Tag → {type, anchor, page}. Emit the full URL by joining with the site
 * origin at build time.
 */
export const tags: Record<string, TagEntry> = {
	// Functions (16) — mirror ccl-test-data/config.CCLFunction
	"function:parse": { type: "function", anchor: "parse", page: "/reference/functions/" },
	"function:parse_indented": {
		type: "function",
		anchor: "parse_indented",
		page: "/reference/functions/",
	},
	"function:build_hierarchy": {
		type: "function",
		anchor: "build_hierarchy",
		page: "/reference/functions/",
	},
	"function:build_model": {
		type: "function",
		anchor: "build_model",
		page: "/reference/functions/",
	},
	"function:load": { type: "function", anchor: "load", page: "/reference/functions/" },
	"function:filter": { type: "function", anchor: "filter", page: "/reference/functions/" },
	"function:compose": { type: "function", anchor: "compose", page: "/reference/functions/" },
	"function:expand_dotted": {
		type: "function",
		anchor: "expand_dotted",
		page: "/reference/functions/",
	},
	"function:get_string": {
		type: "function",
		anchor: "get_string",
		page: "/reference/functions/",
	},
	"function:get_int": { type: "function", anchor: "get_int", page: "/reference/functions/" },
	"function:get_bool": { type: "function", anchor: "get_bool", page: "/reference/functions/" },
	"function:get_float": {
		type: "function",
		anchor: "get_float",
		page: "/reference/functions/",
	},
	"function:get_list": { type: "function", anchor: "get_list", page: "/reference/functions/" },
	"function:print": { type: "function", anchor: "print", page: "/reference/functions/" },
	"function:canonical_format": {
		type: "function",
		anchor: "canonical_format",
		page: "/reference/functions/",
	},
	"function:round_trip": {
		type: "function",
		anchor: "round_trip",
		page: "/reference/functions/",
	},

	// Features (9) — mirror ccl-test-data/config.CCLFeature
	"feature:comments": { type: "feature", anchor: "comments", page: "/reference/features/" },
	"feature:empty_keys": {
		type: "feature",
		anchor: "empty_keys",
		page: "/reference/features/",
	},
	"feature:experimental_dotted_keys": {
		type: "feature",
		anchor: "experimental_dotted_keys",
		page: "/reference/features/",
	},
	"feature:multiline_continuation": {
		type: "feature",
		anchor: "multiline_continuation",
		page: "/reference/features/",
	},
	"feature:multiline_keys": {
		type: "feature",
		anchor: "multiline_keys",
		page: "/reference/features/",
	},
	"feature:unicode": { type: "feature", anchor: "unicode", page: "/reference/features/" },
	"feature:whitespace": {
		type: "feature",
		anchor: "whitespace",
		page: "/reference/features/",
	},
	"feature:tab_in_value_preserved": {
		type: "feature",
		anchor: "tab_in_value_preserved",
		page: "/reference/features/",
	},
	"feature:toplevel_indent_strip": {
		type: "feature",
		anchor: "toplevel_indent_strip",
		page: "/reference/features/",
	},
	"feature:optional_typed_accessors": {
		type: "feature",
		anchor: "optional_typed_accessors",
		page: "/reference/features/",
	},

	// Behaviors (16) — mirror ccl-test-data/config.CCLBehavior
	"behavior:crlf_normalize_to_lf": {
		type: "behavior",
		anchor: "crlf_normalize_to_lf",
		page: "/behavior-reference/",
	},
	"behavior:crlf_preserve_literal": {
		type: "behavior",
		anchor: "crlf_preserve_literal",
		page: "/behavior-reference/",
	},
	"behavior:indent_spaces": {
		type: "behavior",
		anchor: "indent_spaces",
		page: "/behavior-reference/",
	},
	"behavior:indent_tabs": {
		type: "behavior",
		anchor: "indent_tabs",
		page: "/behavior-reference/",
	},
	"behavior:continuation_tab_to_space": {
		type: "behavior",
		anchor: "continuation_tab_to_space",
		page: "/behavior-reference/",
	},
	"behavior:continuation_tab_preserve": {
		type: "behavior",
		anchor: "continuation_tab_preserve",
		page: "/behavior-reference/",
	},
	"behavior:boolean_strict": {
		type: "behavior",
		anchor: "boolean_strict",
		page: "/behavior-reference/",
	},
	"behavior:boolean_lenient": {
		type: "behavior",
		anchor: "boolean_lenient",
		page: "/behavior-reference/",
	},
	"behavior:list_coercion_enabled": {
		type: "behavior",
		anchor: "list_coercion_enabled",
		page: "/behavior-reference/",
	},
	"behavior:list_coercion_disabled": {
		type: "behavior",
		anchor: "list_coercion_disabled",
		page: "/behavior-reference/",
	},
	"behavior:toplevel_indent_strip": {
		type: "behavior",
		anchor: "toplevel_indent_strip",
		page: "/behavior-reference/",
	},
	"behavior:toplevel_indent_preserve": {
		type: "behavior",
		anchor: "toplevel_indent_preserve",
		page: "/behavior-reference/",
	},
	"behavior:delimiter_first_equals": {
		type: "behavior",
		anchor: "delimiter_first_equals",
		page: "/behavior-reference/",
	},
	"behavior:delimiter_prefer_spaced": {
		type: "behavior",
		anchor: "delimiter_prefer_spaced",
		page: "/behavior-reference/",
	},
	"behavior:array_order_insertion": {
		type: "behavior",
		anchor: "array_order_insertion",
		page: "/behavior-reference/",
	},
	"behavior:array_order_lexicographic": {
		type: "behavior",
		anchor: "array_order_lexicographic",
		page: "/behavior-reference/",
	},
	"behavior:multiline_values": {
		type: "behavior",
		anchor: "multiline-values",
		page: "/behavior-reference/",
	},
	"behavior:path_traversal": {
		type: "behavior",
		anchor: "path-traversal",
		page: "/behavior-reference/",
	},

	// Variants (1) — mirror ccl-test-data/config.CCLVariant
	"variant:reference_compliant": {
		type: "variant",
		anchor: "reference_compliant",
		page: "/reference/variants/",
	},
};
