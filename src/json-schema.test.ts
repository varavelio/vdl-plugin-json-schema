import {
  annotation,
  arrayType,
  enumDef,
  enumMember,
  enumType,
  field,
  intLiteral,
  mapType,
  namedType,
  objectType,
  pluginInput,
  primitiveType,
  schema,
  stringLiteral,
  typeDef,
} from "@varavel/vdl-plugin-sdk/testing";
import { describe, expect, it } from "vitest";
import { buildJsonSchemaDocument, generateFunc } from "./json-schema.js";

describe("buildJsonSchemaDocument", () => {
  it("builds enums and object types with docs and refs", () => {
    const input = pluginInput({
      ir: schema({
        enums: [
          enumDef(
            "OrderStatus",
            "string",
            [
              enumMember("Pending", stringLiteral("pending")),
              enumMember("Shipped", stringLiteral("shipped")),
            ],
            { doc: "Lifecycle status." },
          ),
          enumDef("Priority", "int", [
            enumMember("Low", intLiteral(1)),
            enumMember("High", intLiteral(2)),
          ]),
        ],
        types: [
          typeDef(
            "Order",
            objectType([
              field("id", primitiveType("string")),
              field("priority", enumType("Priority", "int")),
              field("status", enumType("OrderStatus", "string"), {
                doc: "Current order status.",
              }),
            ]),
            { doc: "Order payload." },
          ),
        ],
      }),
    });

    expect(buildJsonSchemaDocument(input)).toEqual({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $defs: {
        Order: {
          description: "Order payload.",
          properties: {
            id: {
              type: "string",
            },
            priority: {
              $ref: "#/$defs/Priority",
            },
            status: {
              $ref: "#/$defs/OrderStatus",
              description: "Current order status.",
            },
          },
          required: ["id", "priority", "status"],
          type: "object",
        },
        OrderStatus: {
          description: "Lifecycle status.",
          enum: ["pending", "shipped"],
          type: "string",
        },
        Priority: {
          enum: [1, 2],
          type: "integer",
        },
      },
    });
  });

  it("supports aliases, maps, arrays, inline objects and datetime", () => {
    const input = pluginInput({
      ir: schema({
        types: [
          typeDef("CreatedAt", primitiveType("datetime")),
          typeDef("StringList", arrayType(primitiveType("string"))),
          typeDef("Matrix", arrayType(primitiveType("float"), 2)),
          typeDef("Labels", mapType(primitiveType("string"))),
          typeDef(
            "ComplexRoot",
            objectType([
              field("createdAt", namedType("CreatedAt")),
              field("labels", namedType("Labels"), { optional: true }),
              field("matrix", namedType("Matrix")),
              field(
                "steps",
                arrayType(
                  objectType([
                    field("id", primitiveType("string")),
                    field("values", mapType(arrayType(primitiveType("int")))),
                  ]),
                ),
              ),
              field("tags", namedType("StringList"), { optional: true }),
            ]),
          ),
        ],
      }),
    });

    expect(buildJsonSchemaDocument(input)).toEqual({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $defs: {
        ComplexRoot: {
          properties: {
            createdAt: {
              $ref: "#/$defs/CreatedAt",
            },
            labels: {
              $ref: "#/$defs/Labels",
            },
            matrix: {
              $ref: "#/$defs/Matrix",
            },
            steps: {
              items: {
                properties: {
                  id: {
                    type: "string",
                  },
                  values: {
                    additionalProperties: {
                      items: {
                        type: "integer",
                      },
                      type: "array",
                    },
                    type: "object",
                  },
                },
                required: ["id", "values"],
                type: "object",
              },
              type: "array",
            },
            tags: {
              $ref: "#/$defs/StringList",
            },
          },
          required: ["createdAt", "matrix", "steps"],
          type: "object",
        },
        CreatedAt: {
          format: "date-time",
          type: "string",
        },
        Labels: {
          additionalProperties: {
            type: "string",
          },
          type: "object",
        },
        Matrix: {
          items: {
            items: {
              type: "number",
            },
            type: "array",
          },
          type: "array",
        },
        StringList: {
          items: {
            type: "string",
          },
          type: "array",
        },
      },
    });
  });

  it("sorts definitions, properties and required fields deterministically", () => {
    const input = pluginInput({
      ir: schema({
        enums: [
          enumDef("Zoo", "string", [enumMember("A", stringLiteral("a"))]),
          enumDef("Alpha", "string", [enumMember("A", stringLiteral("a"))]),
        ],
        types: [
          typeDef(
            "Zeta",
            objectType([
              field("bravo", primitiveType("string")),
              field("alpha", primitiveType("string")),
              field("charlie", primitiveType("string"), { optional: true }),
            ]),
          ),
          typeDef("Beta", primitiveType("bool")),
        ],
      }),
    });

    expect(buildJsonSchemaDocument(input)).toEqual({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $defs: {
        Alpha: {
          enum: ["a"],
          type: "string",
        },
        Beta: {
          type: "boolean",
        },
        Zeta: {
          properties: {
            alpha: {
              type: "string",
            },
            bravo: {
              type: "string",
            },
            charlie: {
              type: "string",
            },
          },
          required: ["alpha", "bravo"],
          type: "object",
        },
        Zoo: {
          enum: ["a"],
          type: "string",
        },
      },
    });
  });

  it("adds id and root when options are provided", () => {
    const input = pluginInput({
      options: {
        id: "https://example.com/config.schema.json",
        root: "Config",
      },
      ir: schema({
        types: [
          typeDef(
            "Config",
            objectType([field("name", primitiveType("string"))]),
          ),
        ],
      }),
    });

    expect(buildJsonSchemaDocument(input)).toEqual({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $id: "https://example.com/config.schema.json",
      $ref: "#/$defs/Config",
      $defs: {
        Config: {
          properties: {
            name: {
              type: "string",
            },
          },
          required: ["name"],
          type: "object",
        },
      },
    });
  });

  it("returns a friendly fuzzy error when the root definition does not exist", () => {
    const input = pluginInput({
      options: { root: "Confg" },
      ir: schema({
        types: [
          typeDef(
            "Config",
            objectType([field("version", primitiveType("string"))]),
          ),
          typeDef(
            "Settings",
            objectType([field("theme", primitiveType("string"))]),
          ),
        ],
      }),
    });

    expect(buildJsonSchemaDocument(input)).toEqual({
      error:
        'Root type "Confg" was not found in the generated schema definitions. Did you mean "Config"?',
    });
  });

  it("returns an error without suggestions when there is no close root match", () => {
    const input = pluginInput({
      options: { root: "TotallyDifferent" },
      ir: schema({
        types: [
          typeDef(
            "Config",
            objectType([field("version", primitiveType("string"))]),
          ),
        ],
      }),
    });

    expect(buildJsonSchemaDocument(input)).toEqual({
      error:
        'Root type "TotallyDifferent" was not found in the generated schema definitions.',
    });
  });

  it("handles an empty schema", () => {
    expect(buildJsonSchemaDocument(pluginInput())).toEqual({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $defs: {},
    });
  });

  it("adds deprecated metadata and deprecation notes in descriptions", () => {
    const input = pluginInput({
      ir: schema({
        enums: [
          enumDef(
            "LegacyStatus",
            "string",
            [enumMember("Old", stringLiteral("old"))],
            {
              doc: "Legacy status enum.",
              annotations: [
                annotation("deprecated", stringLiteral("Use Status instead.")),
              ],
            },
          ),
        ],
        types: [
          typeDef(
            "LegacyUser",
            objectType([
              field("name", primitiveType("string"), {
                annotations: [annotation("deprecated")],
              }),
              field("status", enumType("LegacyStatus", "string")),
            ]),
            {
              doc: "Legacy user payload.",
              annotations: [annotation("deprecated")],
            },
          ),
        ],
      }),
    });

    expect(buildJsonSchemaDocument(input)).toEqual({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $defs: {
        LegacyStatus: {
          type: "string",
          enum: ["old"],
          description: "Legacy status enum.\n\nDeprecated: Use Status instead.",
          deprecated: true,
        },
        LegacyUser: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description:
                "Deprecated: This schema element is deprecated and should not be used in new code.",
              deprecated: true,
            },
            status: {
              $ref: "#/$defs/LegacyStatus",
            },
          },
          required: ["name", "status"],
          description:
            "Legacy user payload.\n\nDeprecated: This schema element is deprecated and should not be used in new code.",
          deprecated: true,
        },
      },
    });
  });
});

describe("generateFunc", () => {
  it("returns a generated schema file using the default output path", () => {
    const output = generateFunc(
      pluginInput({
        ir: schema({
          types: [
            typeDef("Health", objectType([field("ok", primitiveType("bool"))])),
          ],
        }),
      }),
    );

    expect(output.errors).toBeUndefined();
    expect(output.files).toHaveLength(1);
    expect(output.files?.[0]?.path).toBe("schema.json");
    expect(output.files?.[0]?.content).toBe(`{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$defs": {
    "Health": {
      "type": "object",
      "properties": {
        "ok": {
          "type": "boolean"
        }
      },
      "required": [
        "ok"
      ]
    }
  }
}
`);
  });

  it("uses a custom output file when outFile is provided", () => {
    const output = generateFunc(
      pluginInput({
        options: {
          outFile: "custom-schema.json",
        },
        ir: schema({
          types: [
            typeDef("Health", objectType([field("ok", primitiveType("bool"))])),
          ],
        }),
      }),
    );

    expect(output.errors).toBeUndefined();
    expect(output.files).toHaveLength(1);
    expect(output.files?.[0]?.path).toBe("custom-schema.json");
  });

  it("returns plugin errors instead of files when the root is invalid", () => {
    const output = generateFunc(
      pluginInput({
        options: { root: "Usr" },
        ir: schema({
          types: [
            typeDef("User", objectType([field("id", primitiveType("string"))])),
          ],
        }),
      }),
    );

    expect(output.files).toBeUndefined();
    expect(output.errors).toEqual([
      {
        message:
          'Root type "Usr" was not found in the generated schema definitions. Did you mean "User"?',
      },
    ]);
  });
});

describe("document key order", () => {
  it("emits keys in the conventional $schema, $id, $ref, $defs order", () => {
    const document = buildJsonSchemaDocument(
      pluginInput({
        options: {
          id: "https://example.com/config.schema.json",
          root: "Config",
        },
        ir: schema({
          types: [
            typeDef(
              "Config",
              objectType([field("name", primitiveType("string"))]),
            ),
          ],
        }),
      }),
    );

    expect("error" in document).toBe(false);
    expect(Object.keys(document)).toEqual(["$schema", "$id", "$ref", "$defs"]);
  });

  it("emits only $schema and $defs when id and root are omitted", () => {
    const document = buildJsonSchemaDocument(pluginInput());

    expect(Object.keys(document)).toEqual(["$schema", "$defs"]);
  });
});

describe("plugin options validation", () => {
  it("rejects unknown options with a suggestion", () => {
    const document = buildJsonSchemaDocument(
      pluginInput({
        options: { rooot: "Config" },
        ir: schema({
          types: [
            typeDef(
              "Config",
              objectType([field("name", primitiveType("string"))]),
            ),
          ],
        }),
      }),
    );

    expect(document).toEqual({
      error:
        'Unknown option "rooot". Supported options are "id", "outFile", "root". Did you mean "root"?',
    });
  });

  it("rejects output files without a json extension", () => {
    const output = generateFunc(
      pluginInput({
        options: { outFile: "schema.txt" },
        ir: schema({
          types: [
            typeDef("Health", objectType([field("ok", primitiveType("bool"))])),
          ],
        }),
      }),
    );

    expect(output.files).toBeUndefined();
    expect(output.errors).toEqual([
      {
        message:
          'Invalid "outFile" "schema.txt": the output file must end with ".json", for example "schema.json".',
      },
    ]);
  });

  it("rejects output files escaping outDir", () => {
    const output = generateFunc(
      pluginInput({
        options: { outFile: "../evil.json" },
        ir: schema({
          types: [
            typeDef("Health", objectType([field("ok", primitiveType("bool"))])),
          ],
        }),
      }),
    );

    expect(output.files).toBeUndefined();
    expect(output.errors?.[0]?.message).toContain('Invalid "outFile"');
  });

  it("rejects identifiers containing whitespace", () => {
    const document = buildJsonSchemaDocument(
      pluginInput({
        options: { id: "not a uri" },
        ir: schema({
          types: [
            typeDef("Health", objectType([field("ok", primitiveType("bool"))])),
          ],
        }),
      }),
    );

    expect(document).toEqual({
      error:
        'Invalid "id" "not a uri": the schema identifier must not contain whitespace. Use a valid URI such as "https://example.com/schemas/schema.json".',
    });
  });

  it("trims surrounding whitespace from option values", () => {
    const document = buildJsonSchemaDocument(
      pluginInput({
        options: {
          id: "  https://example.com/schema.json  ",
          root: "  Config  ",
        },
        ir: schema({
          types: [
            typeDef(
              "Config",
              objectType([field("name", primitiveType("string"))]),
            ),
          ],
        }),
      }),
    );

    expect(document).toEqual({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $id: "https://example.com/schema.json",
      $ref: "#/$defs/Config",
      $defs: {
        Config: {
          type: "object",
          properties: {
            name: { type: "string" },
          },
          required: ["name"],
        },
      },
    });
  });

  it("falls back to the default file for blank outFile values", () => {
    const output = generateFunc(
      pluginInput({
        options: { outFile: "   " },
        ir: schema({
          types: [
            typeDef("Health", objectType([field("ok", primitiveType("bool"))])),
          ],
        }),
      }),
    );

    expect(output.errors).toBeUndefined();
    expect(output.files?.[0]?.path).toBe("schema.json");
  });

  it("explains missing root entries when the schema has no definitions", () => {
    const document = buildJsonSchemaDocument(
      pluginInput({ options: { root: "Config" } }),
    );

    expect(document).toEqual({
      error:
        'Root type "Config" was not found: the schema contains no type or enum definitions. Add a type or enum to the schema or remove the "root" option.',
    });
  });
});
