/**
 * Converts a string to PascalCase.
 * Handles camelCase, snake_case, and kebab-case inputs.
 * Returns PascalCase strings unchanged (fast path).
 */
export function toPascalCase(str: string): string {
  if (!str) return str;
  // Already PascalCase - fast path
  if (str[0] === str[0].toUpperCase() && !str.includes('_') && !str.includes('-')) {
    return str;
  }
  return str
    .replace(/[-_]+(.)/g, (_, char) => char.toUpperCase())
    .replace(/^(.)/, (_, char) => char.toUpperCase());
}

/**
 * Recursively normalizes all object keys to PascalCase.
 * Arrays are traversed, primitives are returned as-is.
 */
export function normalizeKeys<T>(obj: any): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => normalizeKeys(item)) as unknown as T;
  }
  const result: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    result[toPascalCase(key)] = normalizeKeys(obj[key]);
  }
  return result as unknown as T;
}
