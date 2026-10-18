import type { PluginInput } from "@varavel/vdl-plugin-sdk";

import { JSON_SCHEMA_DRAFT } from "./json-schema-constants.js";
import { buildDefinitions } from "./json-schema-convert.js";
import { buildMissingRootError } from "./json-schema-errors.js";
import { resolvePluginOptions } from "./json-schema-options.js";
import { createDefinitionRef } from "./json-schema-refs.js";
import type { JsonSchemaDocument } from "./json-schema-types.js";

/**
 * Builds the JSON Schema document before it is stringified.
 *
 * The function is intentionally pure so tests can assert generated structure
 * directly without going through file I/O.
 */
export function buildJsonSchemaDocument(
  input: PluginInput,
): JsonSchemaDocument | { error: string } {
  const resolved = resolvePluginOptions(input.options);

  if ("error" in resolved) {
    return { error: resolved.error };
  }

  const { id, root } = resolved.options;
  const definitions = buildDefinitions(input.ir);

  if (root !== "" && definitions[root] === undefined) {
    return {
      error: buildMissingRootError(Object.keys(definitions), root),
    };
  }

  return {
    $schema: JSON_SCHEMA_DRAFT,
    ...(id !== "" ? { $id: id } : {}),
    ...(root !== "" ? { $ref: createDefinitionRef(root) } : {}),
    $defs: definitions,
  };
}
