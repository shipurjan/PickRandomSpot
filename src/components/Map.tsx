// src/components/Map.tsx
"use client";
import { useEffect, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Circle,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapProps } from "@/types";

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

// Component to sync map with URL state
function MapController({
  mapState,
  updateMapState,
  updateCircleState,
}: Pick<MapProps, "mapState" | "updateMapState" | "updateCircleState">) {
  const map = useMap();

  // Set initial map view
  useEffect(() => {
    map.setView([mapState.lat, mapState.lng], mapState.zoom);
  }, [map, mapState.lat, mapState.lng, mapState.zoom]);

  // Use callback to ensure stable reference
  const handleMoveEnd = useCallback(() => {
    const center = map.getCenter();
    updateMapState({
      lat: center.lat,
      lng: center.lng,
      zoom: map.getZoom(),
    });
  }, [map, updateMapState]);

  const handleMapClick: L.LeafletMouseEventHandlerFn = useCallback(
    (e) => {
      updateCircleState({
        circleLat: e.latlng.lat,
        circleLng: e.latlng.lng,
      });
    },
    [updateCircleState],
  );

  // Update state on map events
  useMapEvents({
    moveend: handleMoveEnd,
    click: handleMapClick,
  });

  return null;
}

export default function MapComponent({
  mapState,
  updateMapState,
  circleState,
  updateCircleState,
  randomPointState,
}: MapProps) {
  const { lat, lng, zoom } = mapState;
  const { circleLat, circleLng, radius } = circleState;
  const { randomLat, randomLng } = randomPointState;

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={zoom}
      style={{ height: "100%", width: "100%" }}
    >
      <LeafletIconFix />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      <MapController
        mapState={mapState}
        updateMapState={updateMapState}
        updateCircleState={updateCircleState}
      />

      {/* Selected area circle */}
      {circleLat !== null && circleLng !== null && radius !== null && (
        <Circle
          center={[circleLat, circleLng]}
          radius={radius}
          pathOptions={{ color: "blue", fillColor: "#30f", fillOpacity: 0.2 }}
        />
      )}

      {/* Random point marker */}
      {randomLat !== null && randomLng !== null && (
        <Marker position={[randomLat, randomLng]} />
      )}
    </MapContainer>
  );
}
