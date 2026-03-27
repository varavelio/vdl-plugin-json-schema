import type {
  EnumDef,
  Field,
  IrSchema,
  PluginInput,
  PluginOutput,
  TypeRef,
} from "@varavel/vdl-plugin-sdk";
import { unwrapLiteral } from "@varavel/vdl-plugin-sdk/utils/ir";
import { getOptionString } from "@varavel/vdl-plugin-sdk/utils/options";
import { fuzzySearch } from "@varavel/vdl-plugin-sdk/utils/strings";

const JSON_SCHEMA_DRAFT = "https://json-schema.org/draft/2020-12/schema";
const OUTPUT_PATH = "schema.json";

type JsonSchema = Record<string, unknown>;
type JsonSchemaDefinitions = Record<string, JsonSchema>;
type JsonSchemaDocument = {
  $schema: string;
  $id?: string;
  $ref?: string;
  $defs: JsonSchemaDefinitions;
};

/**
 * Generates the final plugin output consumed by VDL.
 *
 * This is the narrow runtime surface used by `src/index.ts`. It converts the
 * in-memory JSON Schema document into the file contract expected by VDL and
 * maps validation failures to structured plugin errors.
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

/**
 * Builds the JSON Schema document before it is stringified.
 *
 * The function is intentionally pure so tests can assert the generated schema
 * structure directly without needing to inspect file output.
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

/**
 * Collects all top-level schema definitions from the VDL IR.
 *
 * Enums and types are emitted into `$defs` using deterministic key ordering so
 * generated output remains stable across runs.
 */
function buildDefinitions(ir: IrSchema): JsonSchemaDefinitions {
  const definitions: JsonSchemaDefinitions = {};

  for (const enumDef of ir.enums) {
    definitions[enumDef.name] = buildEnumSchema(enumDef);
  }

  for (const typeDef of ir.types) {
    definitions[typeDef.name] = withDescription(
      buildTypeRefSchema(typeDef.typeRef),
      typeDef.doc,
    );
  }

  return sortRecord(definitions);
}

/**
 * Converts a VDL enum definition into its JSON Schema representation.
 *
 * Enum member values are unwrapped from IR literals so the emitted `enum`
 * array contains plain JSON values.
 */
function buildEnumSchema(enumDef: EnumDef): JsonSchema {
  return withDescription(
    {
      type: enumDef.enumType === "int" ? "integer" : "string",
      enum: enumDef.members.map((member) => unwrapLiteral(member.value)),
    },
    enumDef.doc,
  );
}

/**
 * Converts a normalized VDL type reference into JSON Schema.
 *
 * The IR already encodes all supported shape variants, so the conversion only
 * needs to branch on `typeRef.kind` and emit the matching JSON Schema fragment.
 */
function buildTypeRefSchema(typeRef: TypeRef): JsonSchema {
  switch (typeRef.kind) {
    case "primitive":
      return buildPrimitiveSchema(typeRef.primitiveName ?? "string");
    case "type":
      return { $ref: createDefinitionRef(typeRef.typeName ?? "") };
    case "enum":
      return { $ref: createDefinitionRef(typeRef.enumName ?? "") };
    case "array": {
      let schema: JsonSchema = {
        type: "array",
        items: buildTypeRefSchema(
          typeRef.arrayType ?? { kind: "primitive", primitiveName: "string" },
        ),
      };

      for (
        let dimension = 1;
        dimension < (typeRef.arrayDims ?? 1);
        dimension += 1
      ) {
        schema = {
          type: "array",
          items: schema,
        };
      }

      return schema;
    }
    case "map":
      return {
        type: "object",
        additionalProperties: buildTypeRefSchema(
          typeRef.mapType ?? { kind: "primitive", primitiveName: "string" },
        ),
      };
    case "object":
      return buildObjectSchema(typeRef.objectFields ?? []);
  }
}

/**
 * Maps a VDL primitive type name to the matching JSON Schema primitive shape.
 */
function buildPrimitiveSchema(
  primitiveName: TypeRef["primitiveName"],
): JsonSchema {
  switch (primitiveName) {
    case "int":
      return { type: "integer" };
    case "float":
      return { type: "number" };
    case "bool":
      return { type: "boolean" };
    case "datetime":
      return { type: "string", format: "date-time" };
    default:
      return { type: "string" };
  }
}

/**
 * Converts an object field list into a JSON Schema object definition.
 *
 * Properties and required fields are both sorted to keep output deterministic
 * and easy to compare in tests and generated diffs.
 */
function buildObjectSchema(fields: Field[]): JsonSchema {
  const properties: JsonSchemaDefinitions = {};
  const required: string[] = [];

  for (const field of fields) {
    properties[field.name] = withDescription(
      buildTypeRefSchema(field.typeRef),
      field.doc,
    );

    if (!field.optional) {
      required.push(field.name);
    }
  }

  const schema: JsonSchema = {
    type: "object",
    properties: sortRecord(properties),
  };

  if (required.length > 0) {
    schema.required = sortStrings(required);
  }

  return schema;
}

/**
 * Attaches a description to a schema fragment when documentation is present.
 *
 * Returning the original object when no description exists keeps the emitted
 * output minimal and avoids unnecessary object copies.
 */
function withDescription(schema: JsonSchema, description?: string): JsonSchema {
  if (description === undefined || description === "") {
    return schema;
  }

  return {
    ...schema,
    description,
  };
}

/**
 * Builds the user-facing error message for an invalid `root` option.
 *
 * Suggestions are produced through the SDK fuzzy search helper so the wording
 * stays helpful without reimplementing approximate matching locally.
 */
function buildMissingRootError(
  definitionNames: readonly string[],
  root: string,
): string {
  const suggestions = fuzzySearch(definitionNames, root).matches;
  const suggestionSuffix =
    suggestions.length === 0
      ? ""
      : ` Did you mean ${formatSuggestions(suggestions)}?`;

  return `Root type "${root}" was not found in the generated schema definitions.${suggestionSuffix}`;
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

/**
 * Builds a local `$defs` reference for a named schema definition.
 */
function createDefinitionRef(name: string): string {
  return `#/$defs/${name}`;
}

/**
 * Returns a new object with keys sorted lexicographically.
 *
 * JSON objects are unordered by specification, but stable key order keeps the
 * generated file readable and makes golden-file comparisons predictable.
 */
function sortRecord<T>(record: Record<string, T>): Record<string, T> {
  const sortedRecord: Record<string, T> = {};

  for (const key of sortStrings(Object.keys(record))) {
    sortedRecord[key] = record[key] as T;
  }

  return sortedRecord;
}

/**
 * Returns a lexicographically sorted copy of the provided string list.
 */
function sortStrings(values: readonly string[]): string[] {
  return [...values].sort((left, right) => {
    return left.localeCompare(right);
  });
}
