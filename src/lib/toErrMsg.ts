/**
 * Safely convert any Cashfree SDK error value to a display string.
 *
 * cashfree.pay() can reject with {error: GeneralError} where GeneralError
 * extends Error but arrives as a plain object after JSON round-trip through the
 * iframe postMessage. resultErr.message can itself be a nested object.
 */
export function toErrMsg(val: unknown, fallback: string): string {
  // Guard against the literal string "[object Object]" that some APIs produce
  // when they accidentally call .toString() on an error object server-side.
  if (val === "[object Object]") return fallback;
  if (typeof val === "string") return val || fallback;
  if (val instanceof Error) return val.message || fallback;
  if (val && typeof val === "object") {
    const v = val as Record<string, unknown>;
    const nested = v.message ?? v.error;
    if (nested != null) return toErrMsg(nested, fallback);
    if (typeof v.code === "string") return v.code || fallback;
  }
  return fallback;
}

/**
 * Serialize any value to a JSON string for debug display, including Error
 * instances whose properties (message, name, stack) are non-enumerable and
 * are invisible to a plain JSON.stringify call (which returns "{}").
 */
function cloneForDebug(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value as object)) return "[Circular]";
  seen.add(value as object);

  if (Array.isArray(value)) {
    return value.map((item) => cloneForDebug(item, seen));
  }

  const output: Record<string, unknown> = {};
  const ownKeys = [
    ...Object.getOwnPropertyNames(value),
    ...Object.getOwnPropertySymbols(value),
  ];

  for (const key of ownKeys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor) continue;
    if ("value" in descriptor) {
      try {
        output[String(key)] = cloneForDebug(descriptor.value, seen);
      } catch {
        output[String(key)] = "[Unable to serialize]";
      }
    } else {
      output[String(key)] = "[Getter]";
    }
  }

  if (value instanceof Error) {
    output.name = value.name;
    output.message = value.message;
    output.stack = value.stack;
  }

  seen.delete(value as object);
  return output;
}

export function debugJSON(val: unknown): string {
  try {
    return (
      JSON.stringify(cloneForDebug(val), null, 2) ??
      String(val)
    );
  } catch {
    return String(val);
  }
}
