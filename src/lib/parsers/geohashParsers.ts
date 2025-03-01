// src/lib/parsers/geohashParsers.ts
import { createParser } from "nuqs";
import {
  pointsToGeohashes,
  geohashesToPoints,
  geohashToPoint,
  pointToGeohash,
} from "@/lib/utils/geohash";
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

/**
 * Custom parsers for coordinate pairs - replaces separate lat/lng parameters
 * with a single geohash parameter
 */

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
