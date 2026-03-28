import type { PluginInput, PluginOutput } from "@varavel/vdl-plugin-sdk";
import { getOptionString } from "@varavel/vdl-plugin-sdk/utils/options";

import { DEFAULT_OUTPUT_PATH } from "./json-schema-constants.js";
import { buildJsonSchemaDocument } from "./json-schema-document.js";

/**
 * Generates the final plugin output consumed by VDL.
 */
export function generateFunc(input: PluginInput): PluginOutput {
  const document = buildJsonSchemaDocument(input);
  const outFile = getOptionString(
    input.options,
    "outFile",
    DEFAULT_OUTPUT_PATH,
  );

  if ("error" in document) {
    return {
      errors: [{ message: document.error }],
    };
  }

  return {
    files: [
      {
        path: outFile === "" ? DEFAULT_OUTPUT_PATH : outFile,
        content: `${JSON.stringify(document, null, 2)}\n`,
      },
    ],
  };
}
