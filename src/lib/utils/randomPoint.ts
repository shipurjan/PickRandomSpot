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

// Check if a point is inside an ellipse
function isPointInEllipse(
  point: [number, number],
  center: [number, number],
  radiusX: number,
  radiusY: number,
  rotation: number,
): boolean {
  // Convert rotation to radians
  const rotationRad = (rotation * Math.PI) / 180;

  // Convert point to meters from center
  const [pointLat, pointLng] = point;
  const [centerLat, centerLng] = center;

  // Calculate meters differences
  const latDiffMeters = (pointLat - centerLat) * 111111;
  const lngDiffMeters =
    (pointLng - centerLng) * (111111 * Math.cos((centerLat * Math.PI) / 180));

  // Apply rotation to get position in ellipse coordinates
  const x =
    latDiffMeters * Math.sin(rotationRad) +
    lngDiffMeters * Math.cos(rotationRad);
  const y =
    latDiffMeters * Math.cos(rotationRad) -
    lngDiffMeters * Math.sin(rotationRad);

  // Check if point is in ellipse using the standard ellipse equation
  const normalizedX = x / radiusX;
  const normalizedY = y / radiusY;

  return normalizedX * normalizedX + normalizedY * normalizedY <= 1;
}

// Check if a point is inside a rectangle
function isPointInRectangle(
  point: [number, number],
  center: [number, number],
  width: number,
  height: number,
  rotation: number,
): boolean {
  // Convert rotation to radians
  const rotationRad = (rotation * Math.PI) / 180;

  // Convert point to meters from center
  const [pointLat, pointLng] = point;
  const [centerLat, centerLng] = center;

  // Calculate meters differences
  const latDiffMeters = (pointLat - centerLat) * 111111;
  const lngDiffMeters =
    (pointLng - centerLng) * (111111 * Math.cos((centerLat * Math.PI) / 180));

  // Apply rotation to get position in rectangle coordinates
  const x =
    latDiffMeters * Math.sin(rotationRad) +
    lngDiffMeters * Math.cos(rotationRad);
  const y =
    latDiffMeters * Math.cos(rotationRad) -
    lngDiffMeters * Math.sin(rotationRad);

  // Check if point is inside rectangle bounds
  return Math.abs(x) <= width / 2 && Math.abs(y) <= height / 2;
}

// Generate a random point in a donut-shaped ellipse
export function generateRandomPointInEllipse(
  centerLat: number,
  centerLng: number,
  outerRadiusX: number,
  outerRadiusY: number,
  innerRadiusX: number,
  innerRadiusY: number,
  rotation: number,
): [number, number] {
  // Ensure inner radius is not larger than outer radius
  const effectiveInnerRadiusX = Math.min(innerRadiusX, outerRadiusX);
  const effectiveInnerRadiusY = Math.min(innerRadiusY, outerRadiusY);

  // If no inner radius, use the standard ellipse method
  if (effectiveInnerRadiusX <= 0 && effectiveInnerRadiusY <= 0) {
    return generateRandomPointInSimpleEllipse(
      centerLat,
      centerLng,
      outerRadiusX,
      outerRadiusY,
      rotation,
    );
  }

  // Handle the case where inner dimensions match outer dimensions
  if (
    effectiveInnerRadiusX === outerRadiusX &&
    effectiveInnerRadiusY === outerRadiusY
  ) {
    // Generate a point on the ellipse boundary
    const angle = Math.random() * 2 * Math.PI;
    const rotationRad = (rotation * Math.PI) / 180;

    const x = outerRadiusX * Math.cos(angle);
    const y = outerRadiusY * Math.sin(angle);

    const rotatedX = x * Math.cos(rotationRad) - y * Math.sin(rotationRad);
    const rotatedY = x * Math.sin(rotationRad) + y * Math.cos(rotationRad);

    return metersToLatLng([rotatedY, rotatedX], [centerLat, centerLng]);
  }

  // Rejection sampling approach for donut shape
  const center: [number, number] = [centerLat, centerLng];
  const maxAttempts = 1000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Generate a point using the simple method (this gives uniform distribution in ellipse)
    const point = generateRandomPointInSimpleEllipse(
      centerLat,
      centerLng,
      outerRadiusX,
      outerRadiusY,
      rotation,
    );

    // Check if point is outside inner ellipse
    if (
      !isPointInEllipse(
        point,
        center,
        effectiveInnerRadiusX,
        effectiveInnerRadiusY,
        rotation,
      )
    ) {
      return point;
    }
  }

  // Fallback to a point on the outer ellipse boundary if we couldn't find a valid one
  const angle = Math.random() * 2 * Math.PI;
  const rotationRad = (rotation * Math.PI) / 180;

  const x = outerRadiusX * Math.cos(angle);
  const y = outerRadiusY * Math.sin(angle);

  const rotatedX = x * Math.cos(rotationRad) - y * Math.sin(rotationRad);
  const rotatedY = x * Math.sin(rotationRad) + y * Math.cos(rotationRad);

  return metersToLatLng([rotatedY, rotatedX], [centerLat, centerLng]);
}

// Generate a random point in a simple ellipse (no hole)
export function generateRandomPointInSimpleEllipse(
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

// Generate a random point in a donut-shaped rectangle
export function generateRandomPointInRectangle(
  centerLat: number,
  centerLng: number,
  outerWidth: number,
  outerHeight: number,
  innerWidth: number,
  innerHeight: number,
  rotation: number,
): [number, number] {
  // Ensure inner dimensions aren't larger than outer dimensions
  const effectiveInnerWidth = Math.min(innerWidth, outerWidth);
  const effectiveInnerHeight = Math.min(innerHeight, outerHeight);

  // If no inner dimensions, use simple rectangle method
  if (effectiveInnerWidth <= 0 && effectiveInnerHeight <= 0) {
    return generateRandomPointInSimpleRectangle(
      centerLat,
      centerLng,
      outerWidth,
      outerHeight,
      rotation,
    );
  }

  // Handle the case where inner dimensions match outer dimensions
  if (
    effectiveInnerWidth === outerWidth &&
    effectiveInnerHeight === outerHeight
  ) {
    // Generate a point on the rectangle edge
    const side = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
    const rotationRad = (rotation * Math.PI) / 180;

    let x, y;
    switch (side) {
      case 0: // top
        x = (Math.random() * 2 - 1) * (outerWidth / 2);
        y = outerHeight / 2;
        break;
      case 1: // right
        x = outerWidth / 2;
        y = (Math.random() * 2 - 1) * (outerHeight / 2);
        break;
      case 2: // bottom
        x = (Math.random() * 2 - 1) * (outerWidth / 2);
        y = -outerHeight / 2;
        break;
      default: // left
        x = -outerWidth / 2;
        y = (Math.random() * 2 - 1) * (outerHeight / 2);
    }

    // Apply rotation
    const rotatedX = x * Math.cos(rotationRad) - y * Math.sin(rotationRad);
    const rotatedY = x * Math.sin(rotationRad) + y * Math.cos(rotationRad);

    return metersToLatLng([rotatedY, rotatedX], [centerLat, centerLng]);
  }

  // Rejection sampling approach for donut shape
  const center: [number, number] = [centerLat, centerLng];
  const maxAttempts = 1000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Generate a point in the outer rectangle
    const point = generateRandomPointInSimpleRectangle(
      centerLat,
      centerLng,
      outerWidth,
      outerHeight,
      rotation,
    );

    // Check if point is outside the inner rectangle
    if (
      !isPointInRectangle(
        point,
        center,
        effectiveInnerWidth,
        effectiveInnerHeight,
        rotation,
      )
    ) {
      return point;
    }
  }

  // Fallback to a point on the outer rectangle edge if we couldn't find a valid one
  const side = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
  const rotationRad = (rotation * Math.PI) / 180;

  let x, y;

  switch (side) {
    case 0: // top
      x = (Math.random() * 2 - 1) * (outerWidth / 2);
      y = outerHeight / 2;
      break;
    case 1: // right
      x = outerWidth / 2;
      y = (Math.random() * 2 - 1) * (outerHeight / 2);
      break;
    case 2: // bottom
      x = (Math.random() * 2 - 1) * (outerWidth / 2);
      y = -outerHeight / 2;
      break;
    default: // left
      x = -outerWidth / 2;
      y = (Math.random() * 2 - 1) * (outerHeight / 2);
  }

  // Apply rotation
  const rotatedX = x * Math.cos(rotationRad) - y * Math.sin(rotationRad);
  const rotatedY = x * Math.sin(rotationRad) + y * Math.cos(rotationRad);

  return metersToLatLng([rotatedY, rotatedX], [centerLat, centerLng]);
}

// Generate a random point in a simple rectangle (no hole)
export function generateRandomPointInSimpleRectangle(
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
  const {
    center,
    radiusX,
    radiusY,
    innerRadiusX,
    innerRadiusY,
    shapeType,
    rotation,
    points,
  } = shapeState;

  // Ensure inner dimensions don't exceed outer dimensions
  const effectiveInnerRadiusX = Math.min(innerRadiusX, radiusX);
  const effectiveInnerRadiusY = Math.min(innerRadiusY, radiusY);

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
        effectiveInnerRadiusX,
        effectiveInnerRadiusY,
        rotation,
      );
    case "rectangle":
      return generateRandomPointInRectangle(
        center.lat,
        center.lng,
        radiusX * 2, // Convert radius to full width
        radiusY * 2, // Convert radius to full height
        effectiveInnerRadiusX * 2, // Convert inner radius to full width
        effectiveInnerRadiusY * 2, // Convert inner radius to full height
        rotation,
      );
    default:
      return null;
  }
}
