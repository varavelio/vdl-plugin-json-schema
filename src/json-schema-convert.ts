import type {
  EnumDef,
  Field,
  IrSchema,
  TypeRef,
} from "@varavel/vdl-plugin-sdk";
import { unwrapLiteral } from "@varavel/vdl-plugin-sdk/utils/ir";

import { withSchemaMetadata } from "./json-schema-metadata.js";
import { createDefinitionRef } from "./json-schema-refs.js";
import { sortRecord, sortStrings } from "./json-schema-sort.js";
import type { JsonSchema, JsonSchemaDefinitions } from "./json-schema-types.js";

/**
 * Collects all top-level schema definitions from the VDL IR.
 *
 * Enums and types are emitted into `$defs` using deterministic key ordering so
 * generated output remains stable across runs.
 */
export function buildDefinitions(ir: IrSchema): JsonSchemaDefinitions {
  const definitions: JsonSchemaDefinitions = {};

  for (const enumDef of ir.enums) {
    definitions[enumDef.name] = buildEnumSchema(enumDef);
  }

  for (const typeDef of ir.types) {
    definitions[typeDef.name] = withSchemaMetadata(
      buildTypeRefSchema(typeDef.typeRef),
      typeDef.doc,
      typeDef.annotations,
    );
  }

  return sortRecord(definitions);
}

/**
 * Converts a VDL enum definition into its JSON Schema representation.
 */
function buildEnumSchema(enumDef: EnumDef): JsonSchema {
  return withSchemaMetadata(
    {
      type: enumDef.enumType === "int" ? "integer" : "string",
      enum: enumDef.members.map((member) => unwrapLiteral(member.value)),
    },
    enumDef.doc,
    enumDef.annotations,
  );
}

/**
 * Converts a normalized VDL type reference into JSON Schema.
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
 * Maps a VDL primitive type name to the matching JSON Schema fragment.
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
 */
function buildObjectSchema(fields: Field[]): JsonSchema {
  const properties: JsonSchemaDefinitions = {};
  const required: string[] = [];

  for (const field of fields) {
    properties[field.name] = withSchemaMetadata(
      buildTypeRefSchema(field.typeRef),
      field.doc,
      field.annotations,
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
