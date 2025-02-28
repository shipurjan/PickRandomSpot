// src/lib/utils/randomPoint.ts
import { Point, ShapeState } from "@/types";

// Helper to convert meters to lat/lng at a specific coordinate
export function metersToLatLng(
  meters: [number, number],
  baseLatLng: [number, number],
): [number, number] {
  const [metersY, metersX] = meters;
  const [baseLat, baseLng] = baseLatLng;

  // The number of meters per degree latitude is roughly constant at 111,111
  const latOffset = metersY / 111111;

  // The number of meters per degree longitude varies with latitude
  const lngOffset = metersX / (111111 * Math.cos((baseLat * Math.PI) / 180));

  return [baseLat + latOffset, baseLng + lngOffset];
}

// Generate a random point within an ellipse
export function generateRandomPointInEllipse(
  centerLat: number,
  centerLng: number,
  radiusX: number,
  radiusY: number,
  rotation: number,
): [number, number] {
  // Convert rotation to radians
  const rotationRad = (rotation * Math.PI) / 180;

  // Generate random angle and distance for a circle, then adjust for ellipse
  const angle = Math.random() * 2 * Math.PI;
  const r = Math.sqrt(Math.random());

  // Calculate position in ellipse (before rotation)
  const x = r * radiusX * Math.cos(angle);
  const y = r * radiusY * Math.sin(angle);

  // Apply rotation
  const rotatedX = x * Math.cos(rotationRad) - y * Math.sin(rotationRad);
  const rotatedY = x * Math.sin(rotationRad) + y * Math.cos(rotationRad);

  return metersToLatLng([rotatedY, rotatedX], [centerLat, centerLng]);
}

// Generate a random point within a rectangle
export function generateRandomPointInRectangle(
  centerLat: number,
  centerLng: number,
  width: number,
  height: number,
  rotation: number,
): [number, number] {
  // Convert rotation to radians
  const rotationRad = (rotation * Math.PI) / 180;

  // Generate random position in rectangle (before rotation)
  const x = (Math.random() - 0.5) * width;
  const y = (Math.random() - 0.5) * height;

  // Apply rotation
  const rotatedX = x * Math.cos(rotationRad) - y * Math.sin(rotationRad);
  const rotatedY = x * Math.sin(rotationRad) + y * Math.cos(rotationRad);

  return metersToLatLng([rotatedY, rotatedX], [centerLat, centerLng]);
}

// Check if a point is inside a polygon using ray casting algorithm
function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  if (polygon.length < 3) return false;

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const intersect =
      polygon[i].lng > point.lng !== polygon[j].lng > point.lng &&
      point.lat <
        ((polygon[j].lat - polygon[i].lat) * (point.lng - polygon[i].lng)) /
          (polygon[j].lng - polygon[i].lng) +
          polygon[i].lat;
    if (intersect) inside = !inside;
  }

  return inside;
}

// Get bounding box of polygon
function getPolygonBounds(polygon: Point[]): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} {
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  for (const point of polygon) {
    minLat = Math.min(minLat, point.lat);
    maxLat = Math.max(maxLat, point.lat);
    minLng = Math.min(minLng, point.lng);
    maxLng = Math.max(maxLng, point.lng);
  }

  return { minLat, maxLat, minLng, maxLng };
}

export function generateRandomPointInPolygon(
  polygon: Point[],
): [number, number] | null {
  if (polygon.length < 3) return null;

  // Get bounding box of polygon
  const bounds = getPolygonBounds(polygon);

  // Maximum attempts to find a point inside the polygon
  const maxAttempts = 1000; // Increase max attempts for complex polygons

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Generate random point within bounding box
    const randomLat =
      bounds.minLat + Math.random() * (bounds.maxLat - bounds.minLat);
    const randomLng =
      bounds.minLng + Math.random() * (bounds.maxLng - bounds.minLng);

    const point = { lat: randomLat, lng: randomLng };

    // Check if point is inside polygon
    if (isPointInPolygon(point, polygon)) {
      return [randomLat, randomLng];
    }
  }

  // If we couldn't find a point after max attempts, use a fallback method
  // Find the centroid of the polygon as a last resort
  const centroid = findPolygonCentroid(polygon);
  if (centroid) {
    return [centroid.lat, centroid.lng];
  }

  // If everything fails, return null
  return null;
}

// Helper function to find the centroid of a polygon
function findPolygonCentroid(polygon: Point[]): Point | null {
  if (polygon.length < 3) return null;

  let sumLat = 0;
  let sumLng = 0;

  for (const point of polygon) {
    sumLat += point.lat;
    sumLng += point.lng;
  }

  return {
    lat: sumLat / polygon.length,
    lng: sumLng / polygon.length,
  };
}

export function generateRandomPoint(
  shapeState: ShapeState,
): [number, number] | null {
  const { center, radiusX, radiusY, shapeType, rotation, points } = shapeState;

  if (shapeType === "polygon") {
    if (points.length < 3) return null;
    return generateRandomPointInPolygon(points);
  }

  if (!center) return null;

  switch (shapeType) {
    case "ellipse":
      return generateRandomPointInEllipse(
        center.lat,
        center.lng,
        radiusX,
        radiusY,
        rotation,
      );
    case "rectangle":
      return generateRandomPointInRectangle(
        center.lat,
        center.lng,
        radiusX * 2, // Convert radius to width
        radiusY * 2, // Convert radius to height
        rotation,
      );
    default:
      return null;
  }
}
