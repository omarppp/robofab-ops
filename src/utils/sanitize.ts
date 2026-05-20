export function sanitizeForFirestore(data: unknown): unknown {
  if (Array.isArray(data)) {
    return data
      .map(sanitizeForFirestore)
      .filter((v): v is NonNullable<typeof v> => v !== undefined);
  }
  if (data !== null && typeof data === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (value !== undefined) {
        result[key] = sanitizeForFirestore(value);
      }
    }
    return result;
  }
  return data;
}
