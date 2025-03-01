// src/lib/utils/geohash.ts
import { encodeBase32, decodeBase32 } from "geohashing";
import { Point } from "@/types";

const LATLNG_DECIMAL_PLACES = 6;
const GEOHASH_PRECISION = 8;

/**
 * Round coordinate to specified decimal places
 */
function roundCoordinate(coord: number): number {
  const factor = Math.pow(10, LATLNG_DECIMAL_PLACES);
  return Math.round(coord * factor) / factor;
}

/**
 * Encode a point to a geohash with given precision
 * @param point The point to encode
 */
export function pointToGeohash(point: Point): string {
  // Round coordinates before encoding to ensure consistent results
  const roundedLat = roundCoordinate(point.lat);
  const roundedLng = roundCoordinate(point.lng);
  return encodeBase32(roundedLat, roundedLng, GEOHASH_PRECISION);
}

/**
 * Decode a geohash to a point
 * @param hash The geohash to decode
 * @param decimalPlaces Number of decimal places to round coordinates to after decoding
 */
export function geohashToPoint(hash: string): Point {
  const { lat, lng } = decodeBase32(hash);
  // Round coordinates after decoding to ensure consistent precision
  return {
    lat: roundCoordinate(lat),
    lng: roundCoordinate(lng),
  };
}

// Convert an array of points to an array of geohashes
export function pointsToGeohashes(points: Point[]): string[] {
  return points.map((point) => pointToGeohash(point));
}

// Convert an array of geohashes to an array of points
export function geohashesToPoints(hashes: string[]): Point[] {
  return hashes.map((hash) => geohashToPoint(hash));
}
