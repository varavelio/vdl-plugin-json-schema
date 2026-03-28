import type { Annotation } from "@varavel/vdl-plugin-sdk";
import {
  getAnnotation,
  getAnnotationArg,
  unwrapLiteral,
} from "@varavel/vdl-plugin-sdk/utils/ir";

import { DEFAULT_DEPRECATED_MESSAGE } from "./json-schema-constants.js";
import type { JsonSchema } from "./json-schema-types.js";

/**
 * Enriches a schema fragment with documentation and deprecation metadata.
 *
 * Documentation and deprecation notes are merged into the `description` field
 * to keep generated schemas useful in UIs that primarily surface descriptions.
 */
export function withSchemaMetadata(
  schema: JsonSchema,
  description?: string,
  annotations?: Annotation[],
): JsonSchema {
  const deprecatedMessage = getDeprecatedMessage(annotations);
  const fullDescription = buildDescription(description, deprecatedMessage);

  const nextSchema: JsonSchema = {
    ...schema,
  };

  if (fullDescription !== undefined) {
    nextSchema.description = fullDescription;
  }

  if (deprecatedMessage !== undefined) {
    nextSchema.deprecated = true;
  }

  return nextSchema;
}

/**
 * Extracts the effective deprecation message from an annotation list.
 */
function getDeprecatedMessage(
  annotations: Annotation[] | undefined,
): string | undefined {
  const deprecated = getAnnotation(annotations, "deprecated");

  if (deprecated === undefined) {
    return undefined;
  }

  const argument = getAnnotationArg(annotations, "deprecated");
  const unwrapped =
    argument !== undefined ? unwrapLiteral<unknown>(argument) : undefined;

  if (typeof unwrapped === "string" && unwrapped.trim().length > 0) {
    return unwrapped;
  }

  return DEFAULT_DEPRECATED_MESSAGE;
}

/**
 * Builds the final description payload from optional docs and deprecation.
 */
function buildDescription(
  description: string | undefined,
  deprecatedMessage: string | undefined,
): string | undefined {
  const lines = description?.split("\n") ?? [];

  if (deprecatedMessage === undefined) {
    return lines.length === 0 ? undefined : lines.join("\n");
  }

  if (lines.length === 0) {
    return `Deprecated: ${deprecatedMessage}`;
  }

  return [...lines, "", `Deprecated: ${deprecatedMessage}`].join("\n");
}
