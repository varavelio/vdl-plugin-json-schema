<p align="center">
  <img
    src="https://raw.githubusercontent.com/varavelio/vdl/9cb8432f972f986ba91ffa1e4fe82220a8aa373f/assets/png/vdl.png"
    alt="VDL logo"
    width="130"
  />
</p>

<h1 align="center">VDL JSON Schema Plugin</h1>

<p align="center">
  Generate JSON Schema Draft 2020-12 from VDL <strong>types</strong> and <strong>enums</strong>.
</p>

<p align="center">
  <a href="https://varavel.com">
    <img src="https://cdn.jsdelivr.net/gh/varavelio/brand@1.0.0/dist/badges/project.svg" alt="A Varavel project"/>
  </a>
  <a href="https://varavel.com/vdl">
    <img src="https://cdn.jsdelivr.net/gh/varavelio/brand@1.0.0/dist/badges/vdl-plugin.svg" alt="VDL Plugin"/>
  </a>
</p>

This plugin converts your VDL schema into a standard `schema.json` file that can be consumed by validators, documentation tools, form builders, API gateways, and any platform that understands JSON Schema.

It is focused on data models only.

Use it when you want to:

- validate JSON payloads outside generated SDKs
- share a machine-readable contract with external systems
- drive forms, docs, or internal tooling from your schema
- publish a standard JSON Schema representation of your VDL model

## Quick Start

1. Add the plugin to your `vdl.config.vdl`:

```vdl
const config = {
  version 1
  plugins [
    {
      src "varavelio/vdl-plugin-json-schema@v0.1.0"
      schema "./schema.vdl"
      outDir "./gen"
    }
  ]
}
```

2. Run your normal VDL generation command:

```bash
vdl generate
```

3. Check the generated file in `./gen`:

- `schema.json`

By default, the plugin writes a single file named `schema.json` inside your `outDir`.

## Plugin Options

All options are optional.

| Option    | Type     | Default         | What it changes                                                                                                                                                                                              |
| --------- | -------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `outFile` | `string` | `"schema.json"` | Sets the filename written inside `outDir`. Use it when you want a custom output name such as `my-schema.json` or `product.schema.json`.                                                                      |
| `id`      | `string` | `""`            | Sets the top-level `$id` of the generated JSON Schema document. Use it when your schema should have a canonical URI.                                                                                         |
| `root`    | `string` | `""`            | Sets the top-level `$ref` to a named definition inside `$defs`. Use it when you want one main entry point such as `Config` or `Product`. If the name does not exist, generation fails with a friendly error. |

Example with all options:

```vdl
const config = {
  version 1
  plugins [
    {
      src "varavelio/vdl-plugin-json-schema@v0.1.0"
      schema "./schema.vdl"
      outDir "./gen"
      options {
        outFile "product.schema.json"
        id "https://example.com/schemas/product.schema.json"
        root "Product"
      }
    }
  ]
}
```

## What You Get

- A JSON Schema document using Draft 2020-12.
- All top-level VDL types and enums emitted inside `$defs`.
- Stable `$ref` links between named types, aliases, and enums.
- Object `required` fields generated only for non-optional VDL fields.
- Support for nested objects, arrays, multidimensional arrays, and maps.
- Documentation and deprecation metadata carried into the generated schema.

## Type Mapping

| VDL                 | JSON Schema output                              |
| ------------------- | ----------------------------------------------- |
| `string`            | `"type": "string"`                              |
| `int`               | `"type": "integer"`                             |
| `float`             | `"type": "number"`                              |
| `bool`              | `"type": "boolean"`                             |
| `datetime`          | `"type": "string", "format": "date-time"`       |
| `T[]`               | `"type": "array"` with `items`                  |
| `map[T]`            | `"type": "object"` with `additionalProperties`  |
| named type or alias | `$ref` to `#/$defs/...`                         |
| enum                | `"enum": [...]` with the correct primitive type |

## Root Behavior

- If `root` is not set, the document contains reusable definitions in `$defs` and no top-level `$ref`.
- If `root "Config"` is set, the document also includes `"$ref": "#/$defs/Config"`.
- `root` can point to any generated top-level definition.
- If the selected name does not exist, the plugin returns a clear error and, when possible, suggests a similar definition name.

## Example

Given this `schema.vdl`:

```vdl
""" Status of an order. """
enum OrderStatus {
  Pending = "pending"
  Shipped = "shipped"
}

type Product {
  id string
  status OrderStatus
  releasedAt datetime
  tags? string[]
}
```

And this plugin configuration:

```vdl
const config = {
  version 1
  plugins [
    {
      src "varavelio/vdl-plugin-json-schema@v0.1.0"
      schema "./schema.vdl"
      outDir "./gen"
      options {
        id "https://example.com/schemas/product.schema.json"
        root "Product"
      }
    }
  ]
}
```

Running `vdl generate` produces `./gen/product.schema.json` similar to:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://example.com/schemas/product.schema.json",
  "$ref": "#/$defs/Product",
  "$defs": {
    "OrderStatus": {
      "type": "string",
      "enum": ["pending", "shipped"],
      "description": "Status of an order."
    },
    "Product": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "releasedAt": {
          "type": "string",
          "format": "date-time"
        },
        "status": {
          "$ref": "#/$defs/OrderStatus"
        },
        "tags": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      },
      "required": ["id", "releasedAt", "status"]
    }
  }
}
```

## Documentation and Deprecation

- VDL doc blocks are emitted as JSON Schema `description`.
- `@deprecated` sets `"deprecated": true` on the generated schema fragment.
- `@deprecated("message")` also appends the deprecation reason to `description`.
- If `@deprecated` has no explicit message, the plugin adds a default deprecation note.

## License

This plugin is released under the MIT License. See [LICENSE](LICENSE).
