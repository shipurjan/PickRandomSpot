// src/lib/utils/geohash.ts
import { encodeBase32, decodeBase32 } from "geohashing";
import { Point } from "@/types";

/**
 * Round coordinate to specified decimal places
 */
function roundCoordinate(coord: number, decimalPlaces: number = 6): number {
  const factor = Math.pow(10, decimalPlaces);
  return Math.round(coord * factor) / factor;
}

/**
 * Encode a point to a geohash with given precision
 * @param point The point to encode
 * @param geohashLength The length of the resulting geohash (1-9)
 * @param decimalPlaces Number of decimal places to round coordinates to before encoding
 */
export function pointToGeohash(
  point: Point,
  geohashLength: number = 7,
  decimalPlaces: number = 6,
): string {
  // Round coordinates before encoding to ensure consistent results
  const roundedLat = roundCoordinate(point.lat, decimalPlaces);
  const roundedLng = roundCoordinate(point.lng, decimalPlaces);
  return encodeBase32(roundedLat, roundedLng, geohashLength);
}

/**
 * Decode a geohash to a point
 * @param hash The geohash to decode
 * @param decimalPlaces Number of decimal places to round coordinates to after decoding
 */
export function geohashToPoint(hash: string, decimalPlaces: number = 6): Point {
  const { lat, lng } = decodeBase32(hash);
  // Round coordinates after decoding to ensure consistent precision
  return {
    lat: roundCoordinate(lat, decimalPlaces),
    lng: roundCoordinate(lng, decimalPlaces),
  };
}

// Convert an array of points to an array of geohashes
export function pointsToGeohashes(
  points: Point[],
  precision: number = 7,
): string[] {
  return points.map((point) => pointToGeohash(point, precision));
}

// Convert an array of geohashes to an array of points
export function geohashesToPoints(hashes: string[]): Point[] {
  return hashes.map((hash) => geohashToPoint(hash));
}
