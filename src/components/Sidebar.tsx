// src/components/Sidebar.tsx
"use client";
import { useEffect, useState, ChangeEvent, useCallback, useRef } from "react";
import { generateRandomPointInCircle } from "@/lib/utils/randomPoint";
import { SidebarProps } from "@/types";

export default function Sidebar({
  circleState,
  updateCircleState,
  randomPointState,
  setRandomPointState,
}: SidebarProps) {
  const { circleLat, circleLng, radius } = circleState;
  const { randomLat, randomLng } = randomPointState;

  // Store radius input value in local state
  const [radiusInput, setRadiusInput] = useState(
    radius ? (radius / 1000).toString() : "5",
  );

  // Ref to track if we're in the middle of changing the radius
  const isChangingRadius = useRef(false);
  // Debounce timer ref
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update input when radius changes from outside
  useEffect(() => {
    if (radius !== null && !isChangingRadius.current) {
      setRadiusInput((radius / 1000).toString());
    }
  }, [radius]);

  // Handle radius slider change with debouncing
  const handleRadiusChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setRadiusInput(value);

      // Mark that we're in the middle of changing
      isChangingRadius.current = true;

      // Clear any existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set a debounce timer to update the actual state
      debounceTimerRef.current = setTimeout(() => {
        const newRadius = parseFloat(value) * 1000; // Convert km to meters
        if (!isNaN(newRadius)) {
          updateCircleState({ radius: newRadius });
        }
        // Mark that we're done changing
        isChangingRadius.current = false;
      }, 100); // Small delay to debounce rapid changes
    },
    [updateCircleState],
  );

  // Generate a random point
  const generateRandomPoint = useCallback(() => {
    if (circleLat !== null && circleLng !== null && radius !== null) {
      const [newLat, newLng] = generateRandomPointInCircle(
        circleLat,
        circleLng,
        radius,
      );
      setRandomPointState({ randomLat: newLat, randomLng: newLng });
    }
  }, [circleLat, circleLng, radius, setRandomPointState]);

  // Clear selection
  const clearSelection = useCallback(() => {
    updateCircleState({
      circleLat: null,
      circleLng: null,
    });
    setRandomPointState({
      randomLat: null,
      randomLng: null,
    });
  }, [updateCircleState, setRandomPointState]);

  return (
    <div className="w-80 bg-black shadow-md p-4 overflow-auto h-screen">
      <h1 className="text-2xl font-bold mb-6">PickRandomSpot</h1>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Instructions</h2>
        <ol className="list-decimal pl-5 space-y-1 text-sm">
          <li>Click anywhere on the map to select a center point</li>
          <li>Adjust the radius of the circle using the slider</li>
          <li>
            Click &quot;Generate Random Point&quot; to create a random point
          </li>
          <li>Share the URL to save your selection</li>
        </ol>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Circle Settings</h2>
        {circleLat !== null && circleLng !== null ? (
          <div>
            <div className="text-sm mb-4">
              <p>
                <span className="font-medium">Center:</span>{" "}
                {circleLat.toFixed(6)}, {circleLng.toFixed(6)}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Radius (km): {radiusInput}
              </label>
              <input
                type="range"
                min="0.1"
                max="100"
                step="0.1"
                value={radiusInput}
                onChange={handleRadiusChange}
                className="w-full"
              />
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            No center point selected. Click on the map.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded w-full transition-colors disabled:opacity-50"
          onClick={generateRandomPoint}
          disabled={circleLat === null || circleLng === null}
        >
          Generate Random Point
        </button>

        <button
          className="border border-gray-300 hover:bg-gray-100 px-4 py-2 rounded w-full transition-colors"
          onClick={clearSelection}
        >
          Clear Selection
        </button>
      </div>

      {randomLat !== null && randomLng !== null && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Random Point</h2>
          <div className="text-sm">
            <p>
              <span className="font-medium">Latitude:</span>{" "}
              {randomLat.toFixed(6)}
            </p>
            <p>
              <span className="font-medium">Longitude:</span>{" "}
              {randomLng.toFixed(6)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
