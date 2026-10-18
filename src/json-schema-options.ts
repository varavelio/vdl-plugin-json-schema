import { getOptionString } from "@varavel/vdl-plugin-sdk/utils/options";

import { DEFAULT_OUTPUT_PATH } from "./json-schema-constants.js";
import {
  buildInvalidIdError,
  buildInvalidOutFileError,
  buildUnknownOptionError,
} from "./json-schema-errors.js";

/**
 * Option names supported by this plugin.
 *
 * Unknown options are rejected with a friendly error so typos fail fast
 * instead of being silently ignored.
 */
export const SUPPORTED_OPTION_NAMES = ["id", "outFile", "root"] as const;

/**
 * Validated plugin options with whitespace trimmed and defaults applied.
 */
export type ResolvedPluginOptions = {
  id: string;
  root: string;
  outFile: string;
};

/**
 * Validates raw plugin options and returns trimmed values with defaults.
 *
 * Empty values fall back to their defaults so `outFile ""` keeps writing
 * the default file instead of producing an invalid path.
 */
export function resolvePluginOptions(
  options: Record<string, string> | undefined,
): { options: ResolvedPluginOptions } | { error: string } {
  const provided = options ?? {};
  const unknown = Object.keys(provided)
    .filter((name) => !SUPPORTED_OPTION_NAMES.includes(name as never))
    .sort((left, right) => left.localeCompare(right));

  if (unknown.length > 0) {
    return {
      error: buildUnknownOptionError(unknown, [...SUPPORTED_OPTION_NAMES]),
    };
  }

  const id = getOptionString(provided, "id", "").trim();
  const root = getOptionString(provided, "root", "").trim();
  const outFile = getOptionString(
    provided,
    "outFile",
    DEFAULT_OUTPUT_PATH,
  ).trim();

  const resolvedOutFile = outFile === "" ? DEFAULT_OUTPUT_PATH : outFile;
  const outFileError = validateOutFile(resolvedOutFile);

  if (outFileError !== undefined) {
    return { error: outFileError };
  }

  if (id !== "" && /\s/.test(id)) {
    return { error: buildInvalidIdError(id) };
  }

  return { options: { id, root, outFile: resolvedOutFile } };
}

/**
 * Checks that the output file stays inside `outDir` and ends with `.json`.
 */
function validateOutFile(outFile: string): string | undefined {
  if (!outFile.endsWith(".json")) {
    return buildInvalidOutFileError(
      outFile,
      'the output file must end with ".json"',
    );
  }

  if (isAbsolutePath(outFile) || outFile.split(/[\\/]/).includes("..")) {
    return buildInvalidOutFileError(
      outFile,
      'the output file must be a relative path inside "outDir" without ".." segments',
    );
  }

  return undefined;
}

/**
 * Detects absolute paths on POSIX and Windows without touching the filesystem.
 */
function isAbsolutePath(path: string): boolean {
  return (
    path.startsWith("/") ||
    path.startsWith("\\") ||
    /^[a-zA-Z]:[\\/]/.test(path)
  );
}
