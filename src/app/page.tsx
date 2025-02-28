// src/app/page.tsx
"use client";
import dynamic from "next/dynamic";
import Sidebar from "@/components/Sidebar";
import NuqsProvider from "@/components/NuqsProvider";
import { parseAsFloat, useQueryStates } from "nuqs";
import { Suspense } from "react";
import { SidebarProps } from "@/types";

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
  const [mapState, setMapState] = useQueryStates({
    lat: parseAsFloat.withDefault(0),
    lng: parseAsFloat.withDefault(0),
    zoom: parseAsFloat.withDefault(2),
  });

  const [circleState, setCircleState] = useQueryStates({
    circleLat: parseAsFloat,
    circleLng: parseAsFloat,
    radius: parseAsFloat.withDefault(20000),
  });

  const [randomPointState, setRandomPointState] = useQueryStates({
    randomLat: parseAsFloat,
    randomLng: parseAsFloat,
  });

  // Update map state as an object instead of individual properties
  const updateMapState = (newState: Partial<typeof mapState>) => {
    setMapState(newState);
  };

  // Update circle state as an object
  const updateCircleState: SidebarProps["updateCircleState"] = (newState) => {
    setCircleState(newState);
  };

  return (
    <div className="flex h-screen">
      <Sidebar
        circleState={circleState}
        updateCircleState={updateCircleState}
        randomPointState={randomPointState}
        setRandomPointState={setRandomPointState}
      />
      <div className="flex-grow select-none">
        <MapWithNoSSR
          mapState={mapState}
          updateMapState={updateMapState}
          circleState={circleState}
          updateCircleState={updateCircleState}
          randomPointState={randomPointState}
        />
      </div>
    </div>
  );
}
