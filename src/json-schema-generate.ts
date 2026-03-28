import type { PluginInput, PluginOutput } from "@varavel/vdl-plugin-sdk";

import { OUTPUT_PATH } from "./json-schema-constants.js";
import { buildJsonSchemaDocument } from "./json-schema-document.js";

/**
 * Generates the final plugin output consumed by VDL.
 */
export function generateFunc(input: PluginInput): PluginOutput {
  const document = buildJsonSchemaDocument(input);

  if ("error" in document) {
    return {
      errors: [{ message: document.error }],
    };
  }

  return {
    files: [
      {
        path: OUTPUT_PATH,
        content: `${JSON.stringify(document, null, 2)}\n`,
      },
    ],
  };
}
