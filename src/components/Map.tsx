// src/components/Map.tsx
"use client";
import { useEffect, useCallback, useRef, useState } from "react";
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
  circleState,
}: Pick<
  MapProps,
  "mapState" | "updateMapState" | "updateCircleState" | "circleState"
>) {
  const map = useMap();
  const hasInitialized = useRef(false);
  const isUserInteraction = useRef(false);
  const isZooming = useRef(false);
  const circlePositionRef = useRef({
    lat: circleState.circleLat,
    lng: circleState.circleLng,
  });

  // Store circle position in ref for stable access
  useEffect(() => {
    if (circleState.circleLat !== null && circleState.circleLng !== null) {
      circlePositionRef.current = {
        lat: circleState.circleLat,
        lng: circleState.circleLng,
      };
    }
  }, [circleState.circleLat, circleState.circleLng]);

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
      // Only update circle position if not during a zoom operation
      if (!isZooming.current) {
        updateCircleState({
          circleLat: e.latlng.lat,
          circleLng: e.latlng.lng,
        });
      }
    },
    [updateCircleState],
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
  circleState,
  updateCircleState,
  randomPointState,
}: MapProps) {
  const { lat, lng, zoom } = mapState;
  const { circleLat, circleLng, radius } = circleState;
  const { randomLat, randomLng } = randomPointState;

  // Local state for circle to prevent flickering during rapid changes
  const [localCircle, setLocalCircle] = useState({
    lat: circleLat,
    lng: circleLng,
    radius: radius,
  });

  // Sync local circle state with URL params, but only when values stabilize
  useEffect(() => {
    // Use a timeout to debounce updates to local circle
    const timer = setTimeout(() => {
      setLocalCircle({
        lat: circleLat,
        lng: circleLng,
        radius: radius,
      });
    }, 50); // Short debounce time for better responsiveness

    return () => clearTimeout(timer);
  }, [circleLat, circleLng, radius]);

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={zoom}
      style={{ height: "100%", width: "100%" }}
      zoomAnimation={true}
      fadeAnimation={true}
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
        circleState={circleState}
      />

      {/* Selected area circle - using local state to prevent flickering */}
      {localCircle.lat !== null &&
        localCircle.lng !== null &&
        localCircle.radius !== null && (
          <Circle
            center={[localCircle.lat, localCircle.lng]}
            radius={localCircle.radius}
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
