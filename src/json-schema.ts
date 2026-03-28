/**
 * Public JSON Schema generation API used by the plugin entrypoint and tests.
 *
 * The implementation is split across focused modules under `src/json-schema/`
 * to keep responsibilities isolated and maintainable.
 */
export { buildJsonSchemaDocument } from "./json-schema-document.js";
export { generateFunc } from "./json-schema-generate.js";
