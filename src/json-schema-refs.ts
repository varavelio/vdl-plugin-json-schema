/**
 * Builds a local `$defs` reference for a named schema definition.
 */
export function createDefinitionRef(name: string): string {
  return `#/$defs/${name}`;
}
