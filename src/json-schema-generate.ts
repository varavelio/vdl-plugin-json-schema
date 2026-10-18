import type { PluginInput, PluginOutput } from "@varavel/vdl-plugin-sdk";

import { buildJsonSchemaDocument } from "./json-schema-document.js";
import { resolvePluginOptions } from "./json-schema-options.js";

/**
 * Generates the final plugin output consumed by VDL.
 */
export function generateFunc(input: PluginInput): PluginOutput {
  const resolved = resolvePluginOptions(input.options);

  if ("error" in resolved) {
    return {
      errors: [{ message: resolved.error }],
    };
  }

  const document = buildJsonSchemaDocument(input);

  if ("error" in document) {
    return {
      errors: [{ message: document.error }],
    };
  }

  return {
    files: [
      {
        path: resolved.options.outFile,
        content: `${JSON.stringify(document, null, 2)}\n`,
      },
    ],
  };
}
