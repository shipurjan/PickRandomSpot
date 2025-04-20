// src/components/Map.tsx - Updated polygon rendering with holes
import { useEffect, useCallback, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Circle,
  Marker,
  useMap,
  useMapEvents,
  Polygon,
  Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapProps, Point } from "@/types";

// Fix Leaflet icons in Next.js
function LeafletIconFix() {
  useEffect(() => {
    // @ts-expect-error Property '_getIconUrl' exists on the prototype.
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
      shadowUrl:
        "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    });
  }, []);

  return null;
}

// Create a rotated ellipse using points
function createEllipsePoints(
  center: L.LatLng,
  radiusX: number,
  radiusY: number,
  rotation: number,
  numPoints = 60,
): L.LatLng[] {
  const points: L.LatLng[] = [];
  const rotationRad = (rotation * Math.PI) / 180;

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;

    // Calculate point on ellipse before rotation
    const x = radiusX * Math.cos(angle);
    const y = radiusY * Math.sin(angle);

    // Apply rotation
    const rotatedX = x * Math.cos(rotationRad) - y * Math.sin(rotationRad);
    const rotatedY = x * Math.sin(rotationRad) + y * Math.cos(rotationRad);

    // Convert to lat/lng offset
    const lat = center.lat + rotatedY / 111111;
    const lng =
      center.lng + rotatedX / (111111 * Math.cos((center.lat * Math.PI) / 180));

    points.push(new L.LatLng(lat, lng));
  }

  return points;
}

// Create a rotated rectangle using points
function createRectanglePoints(
  center: L.LatLng,
  width: number,
  height: number,
  rotation: number,
): L.LatLng[] {
  const points: L.LatLng[] = [];
  const rotationRad = (rotation * Math.PI) / 180;

  // Create the four corners of a rectangle
  const corners = [
    [-width / 2, -height / 2], // bottom left
    [width / 2, -height / 2], // bottom right
    [width / 2, height / 2], // top right
    [-width / 2, height / 2], // top left
  ];

  // Apply rotation and convert to lat/lng for each corner
  for (const [x, y] of corners) {
    // Apply rotation
    const rotatedX = x * Math.cos(rotationRad) - y * Math.sin(rotationRad);
    const rotatedY = x * Math.sin(rotationRad) + y * Math.cos(rotationRad);

    // Convert to lat/lng offset
    const lat = center.lat + rotatedY / 111111;
    const lng =
      center.lng + rotatedX / (111111 * Math.cos((center.lat * Math.PI) / 180));

    points.push(new L.LatLng(lat, lng));
  }

  return points;
}

// Component to sync map with URL state
function MapController({
  mapState,
  updateMapState,
  updateShapeState,
  shapeState,
  isDrawingPolygon,
}: Pick<
  MapProps,
  | "mapState"
  | "updateMapState"
  | "updateShapeState"
  | "shapeState"
  | "isDrawingPolygon"
>) {
  const map = useMap();
  const hasInitialized = useRef(false);
  const isUserInteraction = useRef(false);
  const isZooming = useRef(false);

  // Store center in ref for stable access
  const centerRef = useRef<Point | null>(shapeState.center);

  // Update center ref when it changes
  useEffect(() => {
    centerRef.current = shapeState.center;
  }, [shapeState.center]);

  // Set initial map view only on first render
  useEffect(() => {
    if (!hasInitialized.current) {
      map.setView([mapState.lat, mapState.lng], mapState.zoom);
      hasInitialized.current = true;
    }
  }, [map, mapState.lat, mapState.lng, mapState.zoom]);

  // Use callback to ensure stable reference
  const handleMoveEnd = useCallback(() => {
    // Only update URL params if this was a user interaction
    if (isUserInteraction.current) {
      const center = map.getCenter();
      updateMapState({
        lat: center.lat,
        lng: center.lng,
        zoom: map.getZoom(),
      });
      isUserInteraction.current = false;
    }

    // Reset zoom state after move completes
    isZooming.current = false;
  }, [map, updateMapState]);

  const handleMapClick: L.LeafletMouseEventHandlerFn = useCallback(
    (e) => {
      // Only handle click if not during a zoom operation
      if (isZooming.current) return;

      // Handle polygon drawing
      if (shapeState.shapeType === "polygon" && isDrawingPolygon) {
        const newPoint = { lat: e.latlng.lat, lng: e.latlng.lng };
        const points = [...shapeState.points];

        // Otherwise add the new point
        updateShapeState({ points: [...points, newPoint] });
      }
      // For other shapes, set the center point
      else if (shapeState.shapeType !== "polygon") {
        updateShapeState({
          center: { lat: e.latlng.lat, lng: e.latlng.lng },
        });
      }
    },
    [
      updateShapeState,
      isDrawingPolygon,
      shapeState.shapeType,
      shapeState.points,
    ],
  );

  // Update state on map events
  useMapEvents({
    movestart: () => {
      isUserInteraction.current = true;
    },
    moveend: handleMoveEnd,
    click: handleMapClick,
    zoomstart: () => {
      isZooming.current = true;
    },
  });

  return null;
}

export default function MapComponent({
  mapState,
  updateMapState,
  shapeState,
  updateShapeState,
  randomPointState,
  isDrawingPolygon,
  testPoints = [], // Add default empty array
}: MapProps) {
  const { lat, lng, zoom } = mapState;
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
  const { randomLat, randomLng } = randomPointState;

  // Ensure inner dimensions don't exceed outer dimensions
  const effectiveInnerRadiusX = Math.min(innerRadiusX, radiusX);
  const effectiveInnerRadiusY = Math.min(innerRadiusY, radiusY);

  return (
    <MapContainer
      attributionControl={false}
      center={[lat, lng]}
      doubleClickZoom={false}
      zoom={zoom}
      style={{ height: "100%", width: "100%" }}
      zoomAnimation={true}
      fadeAnimation={true}
    >
      <LeafletIconFix />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution={undefined}
      />

      <MapController
        mapState={mapState}
        updateMapState={updateMapState}
        updateShapeState={updateShapeState}
        shapeState={shapeState}
        isDrawingPolygon={isDrawingPolygon}
      />

      {/* Ellipse with hole */}
      {center && shapeType === "ellipse" && (
        <Polygon
          positions={[
            createEllipsePoints(
              new L.LatLng(center.lat, center.lng),
              radiusX,
              radiusY,
              rotation,
            ),
            // If inner radii > 0, add hole (with reversed order of points)
            ...(effectiveInnerRadiusX > 0 || effectiveInnerRadiusY > 0
              ? [
                  createEllipsePoints(
                    new L.LatLng(center.lat, center.lng),
                    effectiveInnerRadiusX,
                    effectiveInnerRadiusY,
                    rotation,
                  ).reverse(),
                ]
              : []),
          ]}
          pathOptions={{ color: "black", fillColor: "black", fillOpacity: 0.2 }}
        />
      )}

      {/* Rectangle with hole */}
      {center && shapeType === "rectangle" && (
        <Polygon
          positions={[
            createRectanglePoints(
              new L.LatLng(center.lat, center.lng),
              radiusX * 2,
              radiusY * 2,
              rotation,
            ),
            // If inner dimensions > 0, add hole (with reversed order of points)
            ...(effectiveInnerRadiusX > 0 || effectiveInnerRadiusY > 0
              ? [
                  createRectanglePoints(
                    new L.LatLng(center.lat, center.lng),
                    effectiveInnerRadiusX * 2,
                    effectiveInnerRadiusY * 2,
                    rotation,
                  ).reverse(),
                ]
              : []),
          ]}
          pathOptions={{ color: "black", fillColor: "black", fillOpacity: 0.2 }}
        />
      )}

      {/* Polygon */}
      {points.length >= 3 && (
        <Polygon
          positions={points.map((p) => [p.lat, p.lng])}
          pathOptions={{ color: "black", fillColor: "black", fillOpacity: 0.2 }}
        />
      )}

      {/* Current polygon line while drawing */}
      {isDrawingPolygon && points.length > 0 && (
        <Polyline
          positions={points.map((p) => [p.lat, p.lng])}
          pathOptions={{ color: "black", weight: 3 }}
        />
      )}

      {/* Points of polygon while drawing */}
      {isDrawingPolygon &&
        points.map((point, index) => (
          <Circle
            key={`point-${index}`}
            center={[point.lat, point.lng]}
            radius={5}
            pathOptions={{
              color: "black",
              fillColor: "black",
              fillOpacity: 0.2,
            }}
          />
        ))}

      {/* Test points */}
      {testPoints.map((point, index) => (
        <Circle
          key={`test-point-${index}`}
          center={[point[0], point[1]]}
          radius={3}
          pathOptions={{
            color: "red",
            fillColor: "red",
            fillOpacity: 1.0,
            weight: 3,
          }}
        />
      ))}

      {/* Random point marker */}
      {randomLat !== null && randomLng !== null && (
        <Marker position={[randomLat, randomLng]} />
      )}
    </MapContainer>
  );
}
