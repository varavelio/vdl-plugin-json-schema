/**
 * Returns a lexicographically sorted copy of the provided string list.
 */
export function sortStrings(values: readonly string[]): string[] {
  return [...values].sort((left, right) => {
    return left.localeCompare(right);
  });
}

/**
 * Returns a new object with keys sorted lexicographically.
 *
 * JSON objects are unordered by specification, but stable key order keeps the
 * generated output easy to review and deterministic in fixture tests.
 */
export function sortRecord<T>(record: Record<string, T>): Record<string, T> {
  const sortedRecord: Record<string, T> = {};

  for (const key of sortStrings(Object.keys(record))) {
    sortedRecord[key] = record[key] as T;
  }

  return sortedRecord;
}
