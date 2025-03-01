// src/lib/parsers/coordinateParsers.ts
import { createParser } from "nuqs";

/**
 * Create a parser for coordinate values with fixed precision
 * This helps reduce URL length by limiting decimal places
 */
export function parseAsFixedPrecisionFloat(precision: number = 6) {
  return createParser({
    parse(value: string | null) {
      if (value === null) return null;
      const num = parseFloat(value);
      return isNaN(num) ? null : num;
    },
    serialize(value: number | null) {
      if (value === null) return "";
      // Round to specified precision to keep URLs shorter
      return value.toFixed(precision);
    },
  });
}

// Common parsers with reasonable defaults
export const parseAsLatitude = parseAsFixedPrecisionFloat(6);
export const parseAsLongitude = parseAsFixedPrecisionFloat(6);
