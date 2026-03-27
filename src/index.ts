import { definePlugin } from "@varavel/vdl-plugin-sdk";
import { generateFunc } from "./json-schema.js";

/**
 * Canonical VDL plugin entry point.
 *
 * The SDK calls this handler with validated plugin input and expects a
 * `PluginOutput` describing either generated files or user-facing errors.
 */
export const generate = definePlugin((input) => {
  return generateFunc(input);
});
