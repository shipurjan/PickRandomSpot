// src/lib/parsers/geohashParsers.ts
import { createParser } from "nuqs";
import {
  pointsToGeohashes,
  geohashesToPoints,
  geohashToPoint,
  pointToGeohash,
} from "@/lib/utils/geohash";
import { Point } from "@/types";

// Read the geohash precision from the utility
import { GEOHASH_PRECISION } from "@/lib/utils/geohash";

/**
 * Custom parser for storing polygon points as a concatenated string of geohashes
 * without any separators, resulting in much shorter URLs.
 */
export const parseAsGeohashPoints = createParser({
  parse(value: string | null) {
    if (!value) return [];

    try {
      // First check if it's using the new concatenated format
      if (value.length % GEOHASH_PRECISION === 0) {
        // New format: Split the string into chunks of GEOHASH_PRECISION
        const geohashes: string[] = [];
        for (let i = 0; i < value.length; i += GEOHASH_PRECISION) {
          geohashes.push(value.slice(i, i + GEOHASH_PRECISION));
        }
        return geohashesToPoints(geohashes);
      }

      // Try to parse as JSON array (backward compatibility)
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        // If it's an array of strings, it's the old geohash array format
        if (typeof parsed[0] === "string") {
          return geohashesToPoints(parsed);
        }
        // If it's an array of objects, it's the old point object format
        return parsed as Point[];
      }

      return [];
    } catch {
      return [];
    }
  },
  serialize(points: Point[] | null) {
    if (!points || points.length === 0) return "";

    // Convert points to geohashes
    const geohashes = pointsToGeohashes(points);

    // Simply concatenate all geohashes (each is GEOHASH_PRECISION characters long)
    return geohashes.join("");
  },
});

/**
 * Parser for a single point as a geohash
 */
export const parseAsGeohashPoint = createParser<Point | null>({
  parse(value: string | null) {
    if (!value) return null;
    try {
      return geohashToPoint(value);
    } catch {
      return null;
    }
  },
  serialize(point: Point | null) {
    if (!point) return "";
    return pointToGeohash(point);
  },
});

// For map center position
export const parseAsMapPosition = createParser<{ lat: number; lng: number }>({
  parse(value: string | null) {
    if (!value) return null;
    try {
      return geohashToPoint(value);
    } catch {
      return null;
    }
  },
  serialize(point) {
    if (!point) return "";
    return pointToGeohash(point);
  },
}).withDefault({ lat: 0, lng: 0 });

// For shape center position (nullable)
export const parseAsShapeCenter = createParser<Point | null>({
  parse(value: string | null) {
    if (!value) return null;
    try {
      return geohashToPoint(value);
    } catch {
      return null;
    }
  },
  serialize(point) {
    if (!point) return "";
    return pointToGeohash(point);
  },
});

// For random point position (nullable)
export const parseAsRandomPoint = parseAsShapeCenter;
