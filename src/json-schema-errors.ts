import { fuzzySearch } from "@varavel/vdl-plugin-sdk/utils/strings";

/**
 * Builds the user-facing error message for an invalid `root` option.
 */
export function buildMissingRootError(
  definitionNames: readonly string[],
  root: string,
): string {
  const suggestions = fuzzySearch(definitionNames, root).matches;
  const suggestionSuffix =
    suggestions.length === 0
      ? ""
      : ` Did you mean ${formatSuggestions(suggestions)}?`;

  return `Root type "${root}" was not found in the generated schema definitions.${suggestionSuffix}`;
}

/**
 * Formats fuzzy-search suggestions into a short natural-language phrase.
 */
function formatSuggestions(suggestions: readonly string[]): string {
  if (suggestions.length === 1) {
    return `"${suggestions[0]}"`;
  }

  if (suggestions.length === 2) {
    return `"${suggestions[0]}" or "${suggestions[1]}"`;
  }

  const head = suggestions.slice(0, -1).map((suggestion) => {
    return `"${suggestion}"`;
  });
  const tail = `"${suggestions[suggestions.length - 1]}"`;

  return `${head.join(", ")}, or ${tail}`;
}
