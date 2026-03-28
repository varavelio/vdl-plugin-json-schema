"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  generate: () => generate
});
module.exports = __toCommonJS(index_exports);

// node_modules/@varavel/vdl-plugin-sdk/dist/core/define-plugin.js
function definePlugin(handler) {
  return handler;
}
__name(definePlugin, "definePlugin");

// node_modules/@varavel/vdl-plugin-sdk/dist/utils/options/get-option-string.js
function getOptionString(options, key, defaultValue) {
  const value = options === null || options === void 0 ? void 0 : options[key];
  return value === void 0 ? defaultValue : value;
}
__name(getOptionString, "getOptionString");

// src/json-schema-constants.ts
var JSON_SCHEMA_DRAFT = "https://json-schema.org/draft/2020-12/schema";
var DEFAULT_OUTPUT_PATH = "schema.json";
var DEFAULT_DEPRECATED_MESSAGE = "This schema element is deprecated and should not be used in new code.";

// node_modules/@varavel/vdl-plugin-sdk/dist/utils/ir/get-annotation.js
function getAnnotation(annotations, name) {
  if (!annotations) return void 0;
  return annotations.find((anno) => anno.name === name);
}
__name(getAnnotation, "getAnnotation");

// node_modules/@varavel/vdl-plugin-sdk/dist/utils/ir/get-annotation-arg.js
function getAnnotationArg(annotations, name) {
  const anno = getAnnotation(annotations, name);
  return anno === null || anno === void 0 ? void 0 : anno.argument;
}
__name(getAnnotationArg, "getAnnotationArg");

// node_modules/@varavel/vdl-plugin-sdk/dist/utils/ir/unwrap-literal.js
function unwrapLiteral(value) {
  return unwrapLiteralValue(value);
}
__name(unwrapLiteral, "unwrapLiteral");
function unwrapLiteralValue(value) {
  switch (value.kind) {
    case "string":
      return value.stringValue;
    case "int":
      return value.intValue;
    case "float":
      return value.floatValue;
    case "bool":
      return value.boolValue;
    case "object": {
      var _value$objectEntries;
      const resolvedObject = {};
      const entries = (_value$objectEntries = value.objectEntries) !== null && _value$objectEntries !== void 0 ? _value$objectEntries : [];
      for (const entry of entries) resolvedObject[entry.key] = unwrapLiteralValue(entry.value);
      return resolvedObject;
    }
    case "array":
      var _value$arrayItems;
      return ((_value$arrayItems = value.arrayItems) !== null && _value$arrayItems !== void 0 ? _value$arrayItems : []).map((item) => unwrapLiteralValue(item));
    default:
      return null;
  }
}
__name(unwrapLiteralValue, "unwrapLiteralValue");

// src/json-schema-metadata.ts
function withSchemaMetadata(schema, description, annotations) {
  const deprecatedMessage = getDeprecatedMessage(annotations);
  const fullDescription = buildDescription(description, deprecatedMessage);
  const nextSchema = __spreadValues({}, schema);
  if (fullDescription !== void 0) {
    nextSchema.description = fullDescription;
  }
  if (deprecatedMessage !== void 0) {
    nextSchema.deprecated = true;
  }
  return nextSchema;
}
__name(withSchemaMetadata, "withSchemaMetadata");
function getDeprecatedMessage(annotations) {
  const deprecated = getAnnotation(annotations, "deprecated");
  if (deprecated === void 0) {
    return void 0;
  }
  const argument = getAnnotationArg(annotations, "deprecated");
  const unwrapped = argument !== void 0 ? unwrapLiteral(argument) : void 0;
  if (typeof unwrapped === "string" && unwrapped.trim().length > 0) {
    return unwrapped;
  }
  return DEFAULT_DEPRECATED_MESSAGE;
}
__name(getDeprecatedMessage, "getDeprecatedMessage");
function buildDescription(description, deprecatedMessage) {
  var _a;
  const lines = (_a = description == null ? void 0 : description.split("\n")) != null ? _a : [];
  if (deprecatedMessage === void 0) {
    return lines.length === 0 ? void 0 : lines.join("\n");
  }
  if (lines.length === 0) {
    return `Deprecated: ${deprecatedMessage}`;
  }
  return [...lines, "", `Deprecated: ${deprecatedMessage}`].join("\n");
}
__name(buildDescription, "buildDescription");

// src/json-schema-refs.ts
function createDefinitionRef(name) {
  return `#/$defs/${name}`;
}
__name(createDefinitionRef, "createDefinitionRef");

// src/json-schema-sort.ts
function sortStrings(values) {
  return [...values].sort((left, right) => {
    return left.localeCompare(right);
  });
}
__name(sortStrings, "sortStrings");
function sortRecord(record) {
  const sortedRecord = {};
  for (const key of sortStrings(Object.keys(record))) {
    sortedRecord[key] = record[key];
  }
  return sortedRecord;
}
__name(sortRecord, "sortRecord");

// src/json-schema-convert.ts
function buildDefinitions(ir) {
  const definitions = {};
  for (const enumDef of ir.enums) {
    definitions[enumDef.name] = buildEnumSchema(enumDef);
  }
  for (const typeDef of ir.types) {
    definitions[typeDef.name] = withSchemaMetadata(
      buildTypeRefSchema(typeDef.typeRef),
      typeDef.doc,
      typeDef.annotations
    );
  }
  return sortRecord(definitions);
}
__name(buildDefinitions, "buildDefinitions");
function buildEnumSchema(enumDef) {
  return withSchemaMetadata(
    {
      type: enumDef.enumType === "int" ? "integer" : "string",
      enum: enumDef.members.map((member) => unwrapLiteral(member.value))
    },
    enumDef.doc,
    enumDef.annotations
  );
}
__name(buildEnumSchema, "buildEnumSchema");
function buildTypeRefSchema(typeRef) {
  var _a, _b, _c, _d, _e, _f, _g;
  switch (typeRef.kind) {
    case "primitive":
      return buildPrimitiveSchema((_a = typeRef.primitiveName) != null ? _a : "string");
    case "type":
      return { $ref: createDefinitionRef((_b = typeRef.typeName) != null ? _b : "") };
    case "enum":
      return { $ref: createDefinitionRef((_c = typeRef.enumName) != null ? _c : "") };
    case "array": {
      let schema = {
        type: "array",
        items: buildTypeRefSchema(
          (_d = typeRef.arrayType) != null ? _d : { kind: "primitive", primitiveName: "string" }
        )
      };
      for (let dimension = 1; dimension < ((_e = typeRef.arrayDims) != null ? _e : 1); dimension += 1) {
        schema = {
          type: "array",
          items: schema
        };
      }
      return schema;
    }
    case "map":
      return {
        type: "object",
        additionalProperties: buildTypeRefSchema(
          (_f = typeRef.mapType) != null ? _f : { kind: "primitive", primitiveName: "string" }
        )
      };
    case "object":
      return buildObjectSchema((_g = typeRef.objectFields) != null ? _g : []);
  }
}
__name(buildTypeRefSchema, "buildTypeRefSchema");
function buildPrimitiveSchema(primitiveName) {
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
__name(buildPrimitiveSchema, "buildPrimitiveSchema");
function buildObjectSchema(fields) {
  const properties = {};
  const required = [];
  for (const field of fields) {
    properties[field.name] = withSchemaMetadata(
      buildTypeRefSchema(field.typeRef),
      field.doc,
      field.annotations
    );
    if (!field.optional) {
      required.push(field.name);
    }
  }
  const schema = {
    type: "object",
    properties: sortRecord(properties)
  };
  if (required.length > 0) {
    schema.required = sortStrings(required);
  }
  return schema;
}
__name(buildObjectSchema, "buildObjectSchema");

// node_modules/@varavel/vdl-plugin-sdk/dist/utils/strings/fuzzy-search.js
var MAX_FUZZY_RESULTS = 3;
var MatchKind = /* @__PURE__ */ (function(MatchKind2) {
  MatchKind2[MatchKind2["Exact"] = 0] = "Exact";
  MatchKind2[MatchKind2["Prefix"] = 1] = "Prefix";
  MatchKind2[MatchKind2["Suffix"] = 2] = "Suffix";
  MatchKind2[MatchKind2["Contains"] = 3] = "Contains";
  MatchKind2[MatchKind2["Edit"] = 4] = "Edit";
  return MatchKind2;
})(MatchKind || {});
var COMBINING_MARK_SEQUENCE_RE = createCombiningMarkSequenceRegex();
var HAS_FULL_UNICODE_NORMALIZE = supportsUnicodeNormalize();
var BASIC_DIACRITIC_REPLACEMENTS = [
  [/[àáâãäåāăąǎȁȃȧạảấầẩẫậắằẳẵặ]/g.source, "a"],
  [/[çćĉċč]/g.source, "c"],
  [/[èéêëēĕėęěȅȇẹẻẽếềểễệ]/g.source, "e"],
  [/[ìíîïĩīĭįǐȉȋịỉ]/g.source, "i"],
  [/[ñńņň]/g.source, "n"],
  [/[òóôõöōŏőǒȍȏơọỏốồổỗộớờởỡợ]/g.source, "o"],
  [/[ùúûüũūŭůűųǔȕȗưụủứừửữự]/g.source, "u"],
  [/[ýÿŷỳỵỷỹ]/g.source, "y"]
];
function fuzzySearch(data, query) {
  if (data.length === 0) return {
    matches: [],
    exactMatchFound: false
  };
  const exactMatchFound = data.includes(query);
  const normalizedQuery = normalizeFuzzyString(query);
  if (normalizedQuery.length === 0) return {
    matches: collectEmptyMatches(data),
    exactMatchFound
  };
  const queryCodePoints = toCodePoints(normalizedQuery);
  const queryLength = queryCodePoints.length;
  const maxDistance = getAdaptiveDistance(queryLength);
  const normalizedWordCache = /* @__PURE__ */ new Map();
  const topMatches = [];
  for (let index = 0; index < data.length; index += 1) {
    const word = data[index];
    if (word === void 0) continue;
    const candidate = evaluateMatch(word, index, normalizedQuery, queryCodePoints, queryLength, maxDistance, normalizedWordCache);
    if (candidate !== null) insertMatch(topMatches, candidate);
  }
  return {
    matches: topMatches.map((candidate) => candidate.word),
    exactMatchFound
  };
}
__name(fuzzySearch, "fuzzySearch");
function createCombiningMarkSequenceRegex() {
  try {
    const candidate = /* @__PURE__ */ new RegExp("\\p{M}+", "gu");
    if (candidate.test("\u0301")) {
      candidate.lastIndex = 0;
      return candidate;
    }
  } catch (_unused) {
  }
  return /[\u0300-\u036f]+/g;
}
__name(createCombiningMarkSequenceRegex, "createCombiningMarkSequenceRegex");
function supportsUnicodeNormalize() {
  try {
    return "\xE9".normalize("NFD") !== "\xE9";
  } catch (_unused2) {
    return false;
  }
}
__name(supportsUnicodeNormalize, "supportsUnicodeNormalize");
function normalizeFuzzyString(value) {
  const normalizedCase = value.trim().toLowerCase();
  if (normalizedCase.length === 0) return normalizedCase;
  if (!HAS_FULL_UNICODE_NORMALIZE) return replaceBasicDiacritics(normalizedCase.replace(COMBINING_MARK_SEQUENCE_RE, ""));
  return normalizedCase.normalize("NFD").replace(COMBINING_MARK_SEQUENCE_RE, "").normalize("NFC");
}
__name(normalizeFuzzyString, "normalizeFuzzyString");
function replaceBasicDiacritics(value) {
  let normalized = value;
  for (const [source, replacement] of BASIC_DIACRITIC_REPLACEMENTS) normalized = normalized.replace(new RegExp(source, "g"), replacement);
  return normalized;
}
__name(replaceBasicDiacritics, "replaceBasicDiacritics");
function collectEmptyMatches(data) {
  const matches = [];
  for (const word of data) {
    if (normalizeFuzzyString(word).length === 0) matches.push(word);
    if (matches.length === MAX_FUZZY_RESULTS) break;
  }
  return matches;
}
__name(collectEmptyMatches, "collectEmptyMatches");
function evaluateMatch(word, index, normalizedQuery, queryCodePoints, queryLength, maxDistance, normalizedWordCache) {
  const { normalized, codePoints, length } = getNormalizedWordData(word, normalizedWordCache);
  const lengthDifference = Math.abs(queryLength - length);
  if (normalized === normalizedQuery) return {
    word,
    kind: MatchKind.Exact,
    distance: 0,
    lengthDifference: 0,
    index
  };
  if (normalized.startsWith(normalizedQuery)) return {
    word,
    kind: MatchKind.Prefix,
    distance: 0,
    lengthDifference,
    index
  };
  if (normalized.endsWith(normalizedQuery)) return {
    word,
    kind: MatchKind.Suffix,
    distance: 0,
    lengthDifference,
    index
  };
  if (normalized.includes(normalizedQuery)) return {
    word,
    kind: MatchKind.Contains,
    distance: 0,
    lengthDifference,
    index
  };
  if (lengthDifference > maxDistance) return null;
  const distance = boundedDamerauLevenshtein(queryCodePoints, codePoints, maxDistance);
  if (distance > maxDistance) return null;
  return {
    word,
    kind: MatchKind.Edit,
    distance,
    lengthDifference,
    index
  };
}
__name(evaluateMatch, "evaluateMatch");
function getNormalizedWordData(word, normalizedWordCache) {
  const cached = normalizedWordCache.get(word);
  if (cached !== void 0) return cached;
  const normalized = normalizeFuzzyString(word);
  const codePoints = toCodePoints(normalized);
  const created = {
    normalized,
    codePoints,
    length: codePoints.length
  };
  normalizedWordCache.set(word, created);
  return created;
}
__name(getNormalizedWordData, "getNormalizedWordData");
function toCodePoints(value) {
  return Array.from(value);
}
__name(toCodePoints, "toCodePoints");
function getAdaptiveDistance(queryLength) {
  if (queryLength <= 4) return 1;
  if (queryLength <= 8) return 2;
  return 3;
}
__name(getAdaptiveDistance, "getAdaptiveDistance");
function compareMatches(left, right) {
  return left.kind - right.kind || left.distance - right.distance || left.lengthDifference - right.lengthDifference || left.index - right.index;
}
__name(compareMatches, "compareMatches");
function insertMatch(matches, candidate) {
  let insertIndex = 0;
  while (insertIndex < matches.length && compareMatches(matches[insertIndex], candidate) <= 0) insertIndex += 1;
  if (insertIndex >= MAX_FUZZY_RESULTS) return;
  matches.splice(insertIndex, 0, candidate);
  if (matches.length > MAX_FUZZY_RESULTS) matches.pop();
}
__name(insertMatch, "insertMatch");
function boundedDamerauLevenshtein(left, right, maxDistance) {
  var _previousRow$rightLen;
  const leftLength = left.length;
  const rightLength = right.length;
  if (leftLength === 0) return rightLength;
  if (rightLength === 0) return leftLength;
  if (Math.abs(leftLength - rightLength) > maxDistance) return maxDistance + 1;
  let previousPreviousRow = new Array(rightLength + 1).fill(maxDistance + 1);
  let previousRow = new Array(rightLength + 1);
  let currentRow = new Array(rightLength + 1).fill(maxDistance + 1);
  for (let column = 0; column <= rightLength; column += 1) previousRow[column] = column;
  for (let row = 1; row <= leftLength; row += 1) {
    const columnStart = Math.max(1, row - maxDistance);
    const columnEnd = Math.min(rightLength, row + maxDistance);
    currentRow.fill(maxDistance + 1);
    currentRow[0] = row;
    let bestInRow = currentRow[0];
    for (let column = columnStart; column <= columnEnd; column += 1) {
      var _previousRow$column, _currentRow, _previousRow;
      const substitutionCost = left[row - 1] === right[column - 1] ? 0 : 1;
      let distance = Math.min(((_previousRow$column = previousRow[column]) !== null && _previousRow$column !== void 0 ? _previousRow$column : maxDistance + 1) + 1, ((_currentRow = currentRow[column - 1]) !== null && _currentRow !== void 0 ? _currentRow : maxDistance + 1) + 1, ((_previousRow = previousRow[column - 1]) !== null && _previousRow !== void 0 ? _previousRow : maxDistance + 1) + substitutionCost);
      if (row > 1 && column > 1 && left[row - 1] === right[column - 2] && left[row - 2] === right[column - 1]) {
        var _previousPreviousRow;
        distance = Math.min(distance, ((_previousPreviousRow = previousPreviousRow[column - 2]) !== null && _previousPreviousRow !== void 0 ? _previousPreviousRow : maxDistance + 1) + substitutionCost);
      }
      currentRow[column] = distance;
      if (distance < bestInRow) bestInRow = distance;
    }
    if (bestInRow > maxDistance) return maxDistance + 1;
    const completedRow = currentRow;
    currentRow = previousPreviousRow;
    previousPreviousRow = previousRow;
    previousRow = completedRow;
  }
  return (_previousRow$rightLen = previousRow[rightLength]) !== null && _previousRow$rightLen !== void 0 ? _previousRow$rightLen : maxDistance + 1;
}
__name(boundedDamerauLevenshtein, "boundedDamerauLevenshtein");

// src/json-schema-errors.ts
function buildMissingRootError(definitionNames, root) {
  const suggestions = fuzzySearch(definitionNames, root).matches;
  const suggestionSuffix = suggestions.length === 0 ? "" : ` Did you mean ${formatSuggestions(suggestions)}?`;
  return `Root type "${root}" was not found in the generated schema definitions.${suggestionSuffix}`;
}
__name(buildMissingRootError, "buildMissingRootError");
function formatSuggestions(suggestions) {
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
__name(formatSuggestions, "formatSuggestions");

// src/json-schema-document.ts
function buildJsonSchemaDocument(input) {
  const id = getOptionString(input.options, "id", "");
  const root = getOptionString(input.options, "root", "");
  const definitions = buildDefinitions(input.ir);
  if (root !== "" && definitions[root] === void 0) {
    return {
      error: buildMissingRootError(Object.keys(definitions), root)
    };
  }
  const document = {
    $schema: JSON_SCHEMA_DRAFT,
    $defs: definitions
  };
  if (id !== "") {
    document.$id = id;
  }
  if (root !== "") {
    document.$ref = createDefinitionRef(root);
  }
  return document;
}
__name(buildJsonSchemaDocument, "buildJsonSchemaDocument");

// src/json-schema-generate.ts
function generateFunc(input) {
  const document = buildJsonSchemaDocument(input);
  const outFile = getOptionString(
    input.options,
    "outFile",
    DEFAULT_OUTPUT_PATH
  );
  if ("error" in document) {
    return {
      errors: [{ message: document.error }]
    };
  }
  return {
    files: [
      {
        path: outFile === "" ? DEFAULT_OUTPUT_PATH : outFile,
        content: `${JSON.stringify(document, null, 2)}
`
      }
    ]
  };
}
__name(generateFunc, "generateFunc");

// src/index.ts
var generate = definePlugin((input) => {
  return generateFunc(input);
});
