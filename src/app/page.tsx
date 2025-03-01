// src/app/page.tsx
"use client";
import dynamic from "next/dynamic";
import Sidebar from "@/components/Sidebar";
import NuqsProvider from "@/components/NuqsProvider";
import { parseAsFloat, useQueryStates } from "nuqs";
import { parseAsGeohashPoints } from "@/lib/parsers/geohashParsers";
import { Suspense, useState } from "react";
import { ShapeState, ShapeType } from "@/types";
import {
  parseAsLatitude,
  parseAsLongitude,
} from "@/lib/parsers/coordinateParsers";

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

  // State for map view
  const [mapState, setMapState] = useQueryStates({
    lat: parseAsLatitude.withDefault(0),
    lng: parseAsLongitude.withDefault(0),
    zoom: parseAsFloat.withDefault(2),
  });

  // State for shape
  const [shapeState, setShapeState] = useQueryStates({
    centerLat: parseAsLatitude,
    centerLng: parseAsLongitude,
    radiusX: parseAsFloat.withDefault(20000), // Default 20km
    radiusY: parseAsFloat.withDefault(20000),
    rotation: parseAsFloat.withDefault(0),
    shapeType: {
      parse: parseShapeType,
      serialize: (v) => v,
      defaultValue: "ellipse",
    },
    // Use our geohash-based parser for points to make URLs shorter
    points: parseAsGeohashPoints.withDefault([]),
  });

  // State for random point
  const [randomPointState, setRandomPointState] = useQueryStates({
    randomLat: parseAsLatitude,
    randomLng: parseAsLongitude,
  });

  // Local state for polygon drawing mode
  const [isDrawingPolygon, setIsDrawingPolygon] = useState(false);

  // Convert URL state to component state
  const convertedShapeState: ShapeState = {
    center:
      shapeState.centerLat !== null && shapeState.centerLng !== null
        ? { lat: shapeState.centerLat, lng: shapeState.centerLng }
        : null,
    radiusX: shapeState.radiusX,
    radiusY: shapeState.radiusY,
    rotation: shapeState.rotation,
    shapeType: shapeState.shapeType,
    points: shapeState.points,
  };

  // Update shape state as an object
  const updateShapeState = (newState: Partial<ShapeState>) => {
    const updates: Partial<typeof shapeState> = {};

    // Handle center point updates
    if (newState.center !== undefined) {
      updates.centerLat = newState.center?.lat ?? null;
      updates.centerLng = newState.center?.lng ?? null;
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

  return (
    <div className="flex h-screen">
      <Sidebar
        shapeState={convertedShapeState}
        updateShapeState={updateShapeState}
        randomPointState={randomPointState}
        setRandomPointState={setRandomPointState}
        isDrawingPolygon={isDrawingPolygon}
        setIsDrawingPolygon={setIsDrawingPolygon}
        addTestPoints={addTestPoints}
        clearTestPoints={clearTestPoints}
      />
      <div className="flex-grow select-none">
        <MapWithNoSSR
          mapState={mapState}
          updateMapState={setMapState}
          shapeState={convertedShapeState}
          updateShapeState={updateShapeState}
          randomPointState={randomPointState}
          isDrawingPolygon={isDrawingPolygon}
          testPoints={testPoints}
        />
      </div>
    </div>
  );
}
