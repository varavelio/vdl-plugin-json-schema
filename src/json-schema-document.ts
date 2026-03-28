import type { PluginInput } from "@varavel/vdl-plugin-sdk";
import { getOptionString } from "@varavel/vdl-plugin-sdk/utils/options";

import { JSON_SCHEMA_DRAFT } from "./json-schema-constants.js";
import { buildDefinitions } from "./json-schema-convert.js";
import { buildMissingRootError } from "./json-schema-errors.js";
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
  const id = getOptionString(input.options, "id", "");
  const root = getOptionString(input.options, "root", "");
  const definitions = buildDefinitions(input.ir);

  if (root !== "" && definitions[root] === undefined) {
    return {
      error: buildMissingRootError(Object.keys(definitions), root),
    };
  }

  const document: JsonSchemaDocument = {
    $schema: JSON_SCHEMA_DRAFT,
    $defs: definitions,
  };

  if (id !== "") {
    document.$id = id;
  }

  if (root !== "") {
    document.$ref = createDefinitionRef(root);
  }

  return document;
}
