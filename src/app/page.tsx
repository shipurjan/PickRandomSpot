// src/app/page.tsx
"use client";
import dynamic from "next/dynamic";
import Sidebar from "@/components/Sidebar";
import NuqsProvider from "@/components/NuqsProvider";
import { parseAsFloat, useQueryStates } from "nuqs";
import {
  parseAsGeohashPoints,
  parseAsMapPosition,
  parseAsShapeCenter,
  parseAsRandomPoint,
} from "@/lib/parsers/geohashParsers";
import { Suspense, useState } from "react";
import { ShapeState, ShapeType } from "@/types";

// Dynamic import for Map to avoid SSR issues with Leaflet
const MapWithNoSSR = dynamic(() => import("@/components/Map"), {
  ssr: false,
});

export default function Home() {
  return (
    <Suspense>
      <NuqsProvider>
        <HomeContent />
      </NuqsProvider>
    </Suspense>
  );
}

const parseShapeType = (value: string | null): ShapeType => {
  if (value === "ellipse" || value === "rectangle" || value === "polygon") {
    return value;
  }
  return "ellipse"; // Default
};

function HomeContent() {
  const [testPoints, setTestPoints] = useState<[number, number][]>([]);

  const addTestPoints = (points: [number, number][]) => {
    setTestPoints((prev) => [...prev, ...points]);
  };

  const clearTestPoints = () => {
    setTestPoints([]);
  };

  // State for map view - now using a single 'map' parameter for position
  const [mapState, setMapState] = useQueryStates({
    map: parseAsMapPosition,
    zoom: parseAsFloat.withDefault(2),
  });

  // State for shape - now using a single 'center' parameter
  const [shapeState, setShapeState] = useQueryStates({
    center: parseAsShapeCenter,
    radiusX: parseAsFloat.withDefault(1000), // Default 1km (changed from 20000)
    radiusY: parseAsFloat.withDefault(1000), // Default 1km (changed from 20000)
    rotation: parseAsFloat.withDefault(0),
    shapeType: {
      parse: parseShapeType,
      serialize: (v) => v,
      defaultValue: "ellipse",
    },
    // Already using geohash-based parser for points
    points: parseAsGeohashPoints.withDefault([]),
  });

  // State for random point - using a single 'random' parameter
  const [randomPointState, setRandomPointState] = useQueryStates({
    random: parseAsRandomPoint,
  });

  // Local state for polygon drawing mode
  const [isDrawingPolygon, setIsDrawingPolygon] = useState(false);

  // Convert URL state to component state
  const convertedShapeState: ShapeState = {
    center: shapeState.center,
    radiusX: shapeState.radiusX,
    radiusY: shapeState.radiusY,
    rotation: shapeState.rotation,
    shapeType: shapeState.shapeType,
    points: shapeState.points,
  };

  // Convert from geohash map state to lat/lng format expected by components
  const mappedMapState = {
    lat: mapState.map.lat,
    lng: mapState.map.lng,
    zoom: mapState.zoom,
  };

  // Convert from geohash random point to lat/lng format
  const mappedRandomPointState = {
    randomLat: randomPointState.random?.lat ?? null,
    randomLng: randomPointState.random?.lng ?? null,
  };

  // Update shape state as an object
  const updateShapeState = (newState: Partial<ShapeState>) => {
    const updates: Partial<typeof shapeState> = {};

    // Handle center point updates
    if (newState.center !== undefined) {
      updates.center = newState.center;
    }

    // Handle other properties
    if (newState.radiusX !== undefined) updates.radiusX = newState.radiusX;
    if (newState.radiusY !== undefined) updates.radiusY = newState.radiusY;
    if (newState.rotation !== undefined) updates.rotation = newState.rotation;
    if (newState.shapeType !== undefined)
      updates.shapeType = newState.shapeType;
    if (newState.points !== undefined) updates.points = newState.points;

    setShapeState(updates);
  };

  // Update map state
  const updateMapState = (
    newState: Partial<{ lat: number; lng: number; zoom: number }>,
  ) => {
    const updates: Partial<typeof mapState> = {};

    // Handle map position updates
    if (newState.lat !== undefined || newState.lng !== undefined) {
      updates.map = {
        lat: newState.lat ?? mapState.map.lat,
        lng: newState.lng ?? mapState.map.lng,
      };
    }

    // Handle zoom
    if (newState.zoom !== undefined) updates.zoom = newState.zoom;

    setMapState(updates);
  };

  // Update random point state
  const updateRandomPointState = (
    newState: Partial<{ randomLat: number | null; randomLng: number | null }>,
  ) => {
    if (newState.randomLat !== undefined && newState.randomLng !== undefined) {
      if (newState.randomLat === null || newState.randomLng === null) {
        setRandomPointState({ random: null });
      } else {
        setRandomPointState({
          random: { lat: newState.randomLat, lng: newState.randomLng },
        });
      }
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar
        shapeState={convertedShapeState}
        updateShapeState={updateShapeState}
        randomPointState={mappedRandomPointState}
        setRandomPointState={updateRandomPointState}
        isDrawingPolygon={isDrawingPolygon}
        setIsDrawingPolygon={setIsDrawingPolygon}
        addTestPoints={addTestPoints}
        clearTestPoints={clearTestPoints}
      />
      <div className="flex-grow select-none">
        <MapWithNoSSR
          mapState={mappedMapState}
          updateMapState={updateMapState}
          shapeState={convertedShapeState}
          updateShapeState={updateShapeState}
          randomPointState={mappedRandomPointState}
          isDrawingPolygon={isDrawingPolygon}
          testPoints={testPoints}
        />
      </div>
    </div>
  );
}
