// src/app/page.tsx
"use client";
import dynamic from "next/dynamic";
import Sidebar from "@/components/Sidebar";
import NuqsProvider from "@/components/NuqsProvider";
import { parseAsFloat, useQueryState } from "nuqs";
import { Suspense } from "react";

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

function HomeContent() {
  // Map view state
  const [lat, setLat] = useQueryState("lat", parseAsFloat.withDefault(0));
  const [lng, setLng] = useQueryState("lng", parseAsFloat.withDefault(0));
  const [zoom, setZoom] = useQueryState("zoom", parseAsFloat.withDefault(2));

  // Circle selection state
  const [circleLat, setCircleLat] = useQueryState("circleLat", parseAsFloat);
  const [circleLng, setCircleLng] = useQueryState("circleLng", parseAsFloat);
  const [radius, setRadius] = useQueryState(
    "radius",
    parseAsFloat.withDefault(5000),
  );

  // Random point state
  const [randomLat, setRandomLat] = useQueryState("randomLat", parseAsFloat);
  const [randomLng, setRandomLng] = useQueryState("randomLng", parseAsFloat);

  return (
    <div className="flex h-screen">
      <Sidebar
        circleLat={circleLat}
        circleLng={circleLng}
        radius={radius}
        setRadius={setRadius}
        randomLat={randomLat}
        randomLng={randomLng}
        setRandomLat={setRandomLat}
        setRandomLng={setRandomLng}
        setCircleLat={setCircleLat}
        setCircleLng={setCircleLng}
      />
      <div className="flex-grow select-none">
        <MapWithNoSSR
          lat={lat}
          lng={lng}
          zoom={zoom}
          setLat={setLat}
          setLng={setLng}
          setZoom={setZoom}
          circleLat={circleLat}
          circleLng={circleLng}
          radius={radius}
          randomLat={randomLat}
          randomLng={randomLng}
          setCircleLat={setCircleLat}
          setCircleLng={setCircleLng}
        />
      </div>
    </div>
  );
}
