// src/components/Sidebar.tsx
"use client";
import { useEffect, useState, ChangeEvent, useCallback, useRef } from "react";
import { generateRandomPoint } from "@/lib/utils/randomPoint";
import { SidebarProps, ShapeType } from "@/types";
import { theme } from "@/lib/theme";
import Image from "next/image";
import TestMode from "./TestMode";

export default function Sidebar({
  shapeState,
  updateShapeState,
  addTestPoints,
  clearTestPoints,
  randomPointState,
  setRandomPointState,
  isDrawingPolygon,
  setIsDrawingPolygon,
}: SidebarProps) {
  const { center, radiusX, radiusY, shapeType, rotation, points } = shapeState;
  const { randomLat, randomLng } = randomPointState;

  // Store input values in local state
  const [radiusXInput, setRadiusXInput] = useState((radiusX / 1000).toString());
  const [radiusYInput, setRadiusYInput] = useState((radiusY / 1000).toString());
  const [rotationInput, setRotationInput] = useState(rotation.toString());

  // Ref to track if we're in the middle of changing the values
  const isChangingValues = useRef(false);
  // Debounce timer ref
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update inputs when values change from outside
  useEffect(() => {
    if (!isChangingValues.current) {
      setRadiusXInput((radiusX / 1000).toString());
      setRadiusYInput((radiusY / 1000).toString());
      setRotationInput(rotation.toString());
    }
  }, [radiusX, radiusY, rotation]);

  // Handle shape type change
  const handleShapeTypeChange = useCallback(
    (newType: ShapeType) => {
      // If switching from polygon to another shape, clear polygon points
      if (shapeType === "polygon" && newType !== "polygon") {
        updateShapeState({ points: [], shapeType: newType });
      }
      // If switching to polygon, prepare for drawing
      else if (newType === "polygon") {
        updateShapeState({ shapeType: newType });
        setIsDrawingPolygon(true);
      }
      // Otherwise just update the shape type
      else {
        updateShapeState({ shapeType: newType });
      }
    },
    [shapeType, updateShapeState, setIsDrawingPolygon],
  );

  // Handle value changes with debouncing
  const handleValueChange = useCallback(
    (
      e: ChangeEvent<HTMLInputElement>,
      valueType: "radiusX" | "radiusY" | "rotation",
    ) => {
      const value = e.target.value;

      // Update local input state
      if (valueType === "radiusX") {
        setRadiusXInput(value);
      } else if (valueType === "radiusY") {
        setRadiusYInput(value);
      } else if (valueType === "rotation") {
        setRotationInput(value);
      }

      // Mark that we're in the middle of changing
      isChangingValues.current = true;

      // Clear any existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set a debounce timer to update the actual state
      debounceTimerRef.current = setTimeout(() => {
        if (valueType === "radiusX" || valueType === "radiusY") {
          const newRadius = parseFloat(value) * 1000; // Convert km to meters
          if (!isNaN(newRadius)) {
            updateShapeState({ [valueType]: newRadius });
          }
        } else if (valueType === "rotation") {
          const newRotation = parseFloat(value);
          if (!isNaN(newRotation)) {
            updateShapeState({ rotation: newRotation });
          }
        }
        // Mark that we're done changing
        isChangingValues.current = false;
      }, 1); // Small delay to debounce rapid changes
    },
    [updateShapeState],
  );

  // Generate a random point
  const generateRandomSpot = useCallback(() => {
    const result = generateRandomPoint(shapeState);
    if (result) {
      const [newLat, newLng] = result;
      setRandomPointState({ randomLat: newLat, randomLng: newLng });
    } else {
      // Add error message when point generation fails
      console.error(
        "Failed to generate a random point. Please try again or modify your shape.",
      );
    }
  }, [shapeState, setRandomPointState]);

  // Clear selection
  const clearSelection = useCallback(() => {
    updateShapeState({
      center: null,
      points: [],
    });
    setRandomPointState({
      randomLat: null,
      randomLng: null,
    });
    setIsDrawingPolygon(false);
  }, [updateShapeState, setRandomPointState, setIsDrawingPolygon]);

  // Convert a point from decimal degrees to DMS (degrees, minutes, seconds)
  const toDMS = (coord: number, isLat: boolean) => {
    const absolute = Math.abs(coord);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = ((minutesNotTruncated - minutes) * 60).toFixed(2);

    const direction = isLat ? (coord >= 0 ? "N" : "S") : coord >= 0 ? "E" : "W";

    return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
  };

  return (
    <div className="w-80 bg-black shadow-md p-4 overflow-auto h-screen text-white">
      <div className="flex flex-col items-center justify-center select-none">
        <Image
          src="/logo.svg"
          alt="PickRandomSpot logo"
          width="64"
          height="64"
        />
        <h1 className="text-2xl font-bold mb-2">PickRandomSpot</h1>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Instructions</h2>
        <ol className="list-decimal pl-5 space-y-1 text-sm">
          <li>Select a shape type below</li>
          <li>
            {shapeType === "polygon"
              ? "Click on the map to place polygon points. Finish by clicking near the first point."
              : "Click anywhere on the map to select a center point"}
          </li>
          <li>
            {shapeType === "polygon"
              ? "The polygon will automatically close when you complete it"
              : "Adjust the size and shape using the controls below"}
          </li>
          <li>Click &quot;Generate Random Point&quot; when ready</li>
          <li>Share the URL to save your selection</li>
        </ol>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Shape Type</h2>
        <div className="grid grid-cols-3 gap-2">
          <button
            className={`px-2 py-1 rounded transition-colors ${
              shapeType === "ellipse"
                ? "bg-emerald-600 text-white"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
            style={
              shapeType === "ellipse"
                ? { backgroundColor: theme.shapes.ellipse.color }
                : {}
            }
            onClick={() => handleShapeTypeChange("ellipse")}
          >
            Ellipse
          </button>
          <button
            className={`px-2 py-1 rounded transition-colors ${
              shapeType === "rectangle"
                ? "bg-amber-600 text-white"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
            style={
              shapeType === "rectangle"
                ? { backgroundColor: theme.shapes.rectangle.color }
                : {}
            }
            onClick={() => handleShapeTypeChange("rectangle")}
          >
            Rectangle
          </button>
          <button
            className={`px-2 py-1 rounded transition-colors ${
              shapeType === "polygon"
                ? "bg-purple-600 text-white"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
            style={
              shapeType === "polygon"
                ? { backgroundColor: theme.shapes.polygon.color }
                : {}
            }
            onClick={() => handleShapeTypeChange("polygon")}
          >
            Polygon
          </button>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Shape Settings</h2>
        {shapeType === "polygon" ? (
          <div className="text-sm">
            {isDrawingPolygon ? (
              <div>
                <p className="mb-2">
                  Click on the map to add points. {points.length} points added
                  so far.
                </p>
                {points.length > 2 && (
                  <p className="mb-2">
                    {/* Remove reference to clicking near first point */}
                    Click &quot;Complete Drawing&quot; when you&apos;re finished
                    adding points.
                  </p>
                )}
                <button
                  className="px-2 py-1 rounded bg-green-600 hover:bg-green-700 text-white mt-2 mr-2"
                  onClick={() => {
                    // Complete the polygon instead of canceling
                    setIsDrawingPolygon(false);
                  }}
                  disabled={points.length < 3}
                >
                  Complete Drawing
                </button>
                <button
                  className="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white mt-2"
                  onClick={() => {
                    updateShapeState({ points: [] });
                    setIsDrawingPolygon(false);
                  }}
                >
                  Cancel Drawing
                </button>
              </div>
            ) : points.length > 2 ? (
              <div>
                <p className="mb-2">Polygon with {points.length} points</p>
                <button
                  className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white mt-2"
                  onClick={() => {
                    // Keep existing points when redrawing
                    setIsDrawingPolygon(true);
                  }}
                >
                  Redraw Polygon
                </button>
              </div>
            ) : (
              <p className="text-gray-400">
                Click on the map to start drawing a polygon.
              </p>
            )}
          </div>
        ) : center ? (
          <div>
            <div className="text-sm mb-4">
              <p>
                <span className="font-medium">Center:</span>{" "}
                {center.lat.toFixed(6)}, {center.lng.toFixed(6)}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                {toDMS(center.lat, true)}, {toDMS(center.lng, false)}
              </p>
            </div>

            {/* Width/Radius X */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                {shapeType === "rectangle" ? "Width" : "Radius X"} (km):{" "}
                {radiusXInput}
              </label>
              <input
                type="range"
                min="0.1"
                max="100"
                step="0.1"
                value={radiusXInput}
                onChange={(e) => handleValueChange(e, "radiusX")}
                className="w-full"
              />
            </div>

            {/* Height/Radius Y (only for ellipse and rectangle) */}
            {(shapeType === "ellipse" || shapeType === "rectangle") && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  {shapeType === "rectangle" ? "Height" : "Radius Y"} (km):{" "}
                  {radiusYInput}
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="100"
                  step="0.1"
                  value={radiusYInput}
                  onChange={(e) => handleValueChange(e, "radiusY")}
                  className="w-full"
                />
              </div>
            )}

            {/* Rotation (only for ellipse and rectangle) */}
            {(shapeType === "ellipse" || shapeType === "rectangle") && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Rotation (°): {rotationInput}
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="1"
                  value={rotationInput}
                  onChange={(e) => handleValueChange(e, "rotation")}
                  className="w-full"
                />
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            No center point selected. Click on the map.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: theme.colors.primary }}
          onClick={generateRandomSpot}
          disabled={
            (shapeState.shapeType === "polygon" &&
              (!points || points.length < 3)) ||
            (shapeState.shapeType !== "polygon" && !center)
          }
        >
          Generate Random Point
        </button>

        <button
          className="border border-gray-500 hover:bg-gray-700 px-4 py-2 rounded w-full transition-colors"
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
            <p className="text-gray-400 text-xs mt-1">
              {toDMS(randomLat, true)}, {toDMS(randomLng, false)}
            </p>
          </div>
        </div>
      )}

      {process.env.NODE_ENV === "development" &&
        addTestPoints &&
        clearTestPoints && (
          <TestMode
            shapeState={shapeState}
            addTestPoints={addTestPoints}
            clearTestPoints={clearTestPoints}
          />
        )}
    </div>
  );
}
