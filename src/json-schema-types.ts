/**
 * Generic JSON Schema fragment represented as a plain object.
 */
export type JsonSchema = Record<string, unknown>;

/**
 * `$defs` map in the generated root schema document.
 */
export type JsonSchemaDefinitions = Record<string, JsonSchema>;

/**
 * Root JSON Schema document emitted by this plugin.
 */
export type JsonSchemaDocument = {
  $schema: string;
  $id?: string;
  $ref?: string;
  $defs: JsonSchemaDefinitions;
};
