// src/lib/parsers/geohashParsers.ts
import { createParser } from "nuqs";
import { pointsToGeohashes, geohashesToPoints } from "@/lib/utils/geohash";
import { Point } from "@/types";

/**
 * Custom parser for storing polygon points as an array of geohashes instead of
 * full JSON objects, resulting in much shorter URLs.
 */
export const parseAsGeohashPoints = createParser({
  parse(value: string | null) {
    if (!value) return [];
    try {
      // Try to parse as geohash array first
      const geohashes = JSON.parse(value) as string[];
      if (typeof geohashes[0] === "string") {
        return geohashesToPoints(geohashes);
      }

      // If not a string array, it might be the old point object format
      return JSON.parse(value) as Point[];
    } catch {
      console.error("Error parsing points value:", value);
      return [];
    }
  },
  serialize(points: Point[] | null) {
    if (!points || points.length === 0) return "";
    // Convert points to geohashes for more compact representation
    const geohashes = pointsToGeohashes(points);
    return JSON.stringify(geohashes);
  },
});

/**
 * Parser for a single point as a geohash
 */
export const parseAsGeohashPoint = createParser({
  parse(value: string | null) {
    if (!value) return null;
    try {
      return geohashesToPoints([value])[0];
    } catch {
      console.error("Error parsing geohash point:", value);
      return null;
    }
  },
  serialize(point: Point | null) {
    if (!point) return "";
    return pointsToGeohashes([point])[0];
  },
});
