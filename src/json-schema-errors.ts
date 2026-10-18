import { fuzzySearch } from "@varavel/vdl-plugin-sdk/utils/strings";

/**
 * Builds the user-facing error for an unknown plugin option.
 */
export function buildUnknownOptionError(
  unknownNames: readonly string[],
  supportedNames: readonly string[],
): string {
  const quoted = unknownNames.map((name) => `"${name}"`).join(", ");
  const suggestions = fuzzySearch(
    supportedNames,
    unknownNames[0] ?? "",
  ).matches;
  const suggestionSuffix =
    suggestions.length === 0
      ? ""
      : ` Did you mean ${formatSuggestions(suggestions)}?`;

  return `Unknown option ${quoted}. Supported options are ${formatList(supportedNames)}.${suggestionSuffix}`;
}

/**
 * Builds the user-facing error for an invalid `outFile` option.
 */
export function buildInvalidOutFileError(
  outFile: string,
  reason: string,
): string {
  return `Invalid "outFile" "${outFile}": ${reason}, for example "schema.json".`;
}

/**
 * Builds the user-facing error for an invalid `id` option.
 */
export function buildInvalidIdError(id: string): string {
  return `Invalid "id" "${id}": the schema identifier must not contain whitespace. Use a valid URI such as "https://example.com/schemas/schema.json".`;
}

/**
 * Builds the user-facing error message for an invalid `root` option.
 */
export function buildMissingRootError(
  definitionNames: readonly string[],
  root: string,
): string {
  if (definitionNames.length === 0) {
    return `Root type "${root}" was not found: the schema contains no type or enum definitions. Add a type or enum to the schema or remove the "root" option.`;
  }

  const suggestions = fuzzySearch(definitionNames, root).matches;
  const suggestionSuffix =
    suggestions.length === 0
      ? ""
      : ` Did you mean ${formatSuggestions(suggestions)}?`;

  return `Root type "${root}" was not found in the generated schema definitions.${suggestionSuffix}`;
}

/**
 * Formats a name list such as `"id", "outFile", "root"`.
 */
function formatList(names: readonly string[]): string {
  return names.map((name) => `"${name}"`).join(", ");
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
