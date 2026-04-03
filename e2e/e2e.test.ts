import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// This helper runs the `ajv` CLI to validate that a given JSON schema file is a valid
function assertValidJsonSchema(schemaPath: string): void {
  execFileSync(
    "npx",
    [
      "ajv",
      "compile",
      "-s",
      schemaPath,
      "--spec=draft2020",
      "-c",
      "ajv-formats",
    ],
    {
      stdio: "pipe",
    },
  );
}

// Each fixture directory represents a standalone VDL project configured to run
// this plugin exactly as a user would run it from the command line.
const fixturesDir = resolve(__dirname, "fixtures");

// Only include real fixture projects. This keeps the suite resilient to helper
// folders that may exist under `e2e/fixtures` in the future.
const fixtureNames = readdirSync(fixturesDir, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .filter((dirent) => {
    return existsSync(join(fixturesDir, dirent.name, "vdl.config.vdl"));
  })
  .map((dirent) => dirent.name)
  .sort((left, right) => left.localeCompare(right));

describe("VDL Plugin JSON Schema end-to-end", () => {
  it.each(fixtureNames)("matches fixture %s", (fixtureName) => {
    const fixturePath = join(fixturesDir, fixtureName);
    const outDir = join(fixturePath, "gen");
    const expectedDir = join(fixturePath, "expected");
    const expectedErrorPath = join(fixturePath, "expected-error.txt");

    // Start every fixture from a clean output directory so the assertions only
    // observe files produced by the current test run.
    rmSync(outDir, { recursive: true, force: true });

    // Error fixtures assert the exact user-facing message and also verify that
    // generation aborts before writing any output files.
    if (existsSync(expectedErrorPath)) {
      const expectedError = readFileSync(expectedErrorPath, "utf-8").trim();

      expect(() => {
        execFileSync("npx", ["vdl", "generate"], {
          cwd: fixturePath,
          stdio: "pipe",
        });
      }).toThrowError(expectedError);

      expect(existsSync(outDir)).toBe(false);
      return;
    }

    // Successful fixtures execute the real `vdl generate` command so the suite
    // validates the plugin through the same integration path used in practice.
    execFileSync("npx", ["vdl", "generate"], {
      cwd: fixturePath,
      stdio: "pipe",
    });

    // Compare filenames first so missing or unexpected outputs are caught with
    // a direct and easy-to-read assertion failure.
    const generatedFiles = readdirSync(outDir).sort((left, right) => {
      return left.localeCompare(right);
    });
    const expectedFiles = readdirSync(expectedDir).sort((left, right) => {
      return left.localeCompare(right);
    });

    expect(generatedFiles).toEqual(expectedFiles);

    // JSON outputs are compared structurally to avoid failures caused only by
    // formatting differences, while non-JSON fixtures keep exact text checks.
    for (const fileName of expectedFiles) {
      const generatedContent = readFileSync(join(outDir, fileName), "utf-8");
      const expectedContent = readFileSync(
        join(expectedDir, fileName),
        "utf-8",
      );

      if (fileName.endsWith(".json")) {
        assertValidJsonSchema(join(outDir, fileName));
        expect(JSON.parse(generatedContent)).toEqual(
          JSON.parse(expectedContent),
        );
        continue;
      }

      expect(generatedContent).toBe(expectedContent);
    }
  });
});
