// src/components/Sidebar.tsx
"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { generateRandomPoint } from "@/lib/utils/randomPoint";
import { SidebarProps, ShapeType } from "@/types";
import { theme } from "@/lib/theme";
import Image from "next/image";
import TestMode from "./TestMode";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

// Constants for logarithmic transformation
const MIN_LOG_RADIUS = Math.log10(0.1); // 0.1 km = 100m
const MAX_LOG_RADIUS = Math.log10(100); // 100 km
const LOG_RANGE = MAX_LOG_RADIUS - MIN_LOG_RADIUS;

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

  // Store logarithmic slider values
  const [radiusXSlider, setRadiusXSlider] = useState(
    linearToLogarithmicScale(parseFloat(radiusXInput)),
  );
  const [radiusYSlider, setRadiusYSlider] = useState(
    linearToLogarithmicScale(parseFloat(radiusYInput)),
  );

  // Ref to track if we're in the middle of changing the values
  const isChangingValues = useRef(false);
  // Debounce timer ref
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Convert a linear value (km) to logarithmic slider position (0-1)
  function linearToLogarithmicScale(linearValue: number): number {
    // Ensure the value is within range
    const clampedValue = Math.max(0.1, Math.min(100, linearValue));
    // Convert to log scale and normalize to 0-1 range
    return (Math.log10(clampedValue) - MIN_LOG_RADIUS) / LOG_RANGE;
  }

  // Convert logarithmic slider position (0-1) to linear value (km)
  function logarithmicToLinearScale(sliderValue: number): number {
    // Ensure the value is within 0-1 range
    const clampedValue = Math.max(0, Math.min(1, sliderValue));
    // Convert from normalized 0-1 to actual value
    const value = Math.pow(10, MIN_LOG_RADIUS + clampedValue * LOG_RANGE);
    const precision = getPrecision(value);
    return +value.toFixed(precision);

    function getPrecision(val: number) {
      if (val < 1) {
        return 2;
      } else if (val < 10) {
        return 1;
      } else {
        return 0;
      }
    }
  }

  // Update inputs when values change from outside
  useEffect(() => {
    if (!isChangingValues.current) {
      const radiusXKm = radiusX / 1000;
      const radiusYKm = radiusY / 1000;

      setRadiusXInput(radiusXKm.toString());
      setRadiusYInput(radiusYKm.toString());
      setRotationInput(rotation.toString());

      // Update slider positions
      setRadiusXSlider(linearToLogarithmicScale(radiusXKm));
      setRadiusYSlider(linearToLogarithmicScale(radiusYKm));
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

  // Handle direct input changes for radius values
  const handleRadiusInputChange = useCallback(
    (value: string, valueType: "radiusX" | "radiusY") => {
      // Update the input field
      if (valueType === "radiusX") {
        setRadiusXInput(value);
      } else {
        setRadiusYInput(value);
      }

      // Mark that we're in the middle of changing
      isChangingValues.current = true;

      // Clear any existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Parse the value and validate
      const parsedValue = parseFloat(value);
      if (!isNaN(parsedValue) && parsedValue > 0) {
        // Update the slider position (clamped to slider range)
        const sliderValue =
          parsedValue <= 100 ? linearToLogarithmicScale(parsedValue) : 1; // If beyond max, set slider to max

        if (valueType === "radiusX") {
          setRadiusXSlider(sliderValue);
        } else {
          setRadiusYSlider(sliderValue);
        }

        // Set a debounce timer to update the actual state
        debounceTimerRef.current = setTimeout(() => {
          // Convert to meters for the state
          const newRadius = parsedValue * 1000;
          updateShapeState({ [valueType]: newRadius });

          // Mark that we're done changing
          isChangingValues.current = false;
        }, 500); // Longer delay for manual input
      }
    },
    [updateShapeState],
  );

  // Handle direct input changes for rotation
  const handleRotationInputChange = useCallback(
    (value: string) => {
      // Update the input field
      setRotationInput(value);

      // Mark that we're in the middle of changing
      isChangingValues.current = true;

      // Clear any existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Parse the value
      const parsedValue = parseFloat(value);
      if (!isNaN(parsedValue)) {
        // Set a debounce timer to update the actual state
        debounceTimerRef.current = setTimeout(() => {
          updateShapeState({ rotation: parsedValue });
          // Mark that we're done changing
          isChangingValues.current = false;
        }, 500); // Longer delay for manual input
      }
    },
    [updateShapeState],
  );

  // Handle radius slider changes using logarithmic scale
  const handleRadiusSliderChange = useCallback(
    (values: number[], valueType: "radiusX" | "radiusY") => {
      const sliderValue = values[0];

      // Convert from slider position to actual kilometer value
      const kmValue = logarithmicToLinearScale(sliderValue);

      // Format display value with appropriate precision based on size
      let displayValue: string;
      if (kmValue < 1) {
        // Use more decimal places for small values
        displayValue = kmValue.toFixed(2);
      } else if (kmValue < 10) {
        displayValue = kmValue.toFixed(1);
      } else {
        displayValue = kmValue.toFixed(0);
      }

      // Update slider position state
      if (valueType === "radiusX") {
        setRadiusXSlider(sliderValue);
        setRadiusXInput(displayValue);
      } else {
        setRadiusYSlider(sliderValue);
        setRadiusYInput(displayValue);
      }

      // Mark that we're in the middle of changing
      isChangingValues.current = true;

      // Clear any existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set a debounce timer to update the actual state
      debounceTimerRef.current = setTimeout(() => {
        // Convert to meters for the state
        const newRadius = kmValue * 1000;
        updateShapeState({ [valueType]: newRadius });

        // Mark that we're done changing
        isChangingValues.current = false;
      }, 1); // Small delay to debounce rapid changes
    },
    [updateShapeState],
  );

  // Handle rotation slider change (keep original linear scale for rotation)
  const handleRotationSliderChange = useCallback(
    (values: number[]) => {
      const value = values[0].toString();
      setRotationInput(value);

      // Mark that we're in the middle of changing
      isChangingValues.current = true;

      // Clear any existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set a debounce timer to update the actual state
      debounceTimerRef.current = setTimeout(() => {
        const newRotation = parseFloat(value);
        if (!isNaN(newRotation)) {
          updateShapeState({ rotation: newRotation });
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
    <div className="w-80 bg-background shadow-md p-4 overflow-auto h-screen text-white">
      <div className="flex flex-col items-center justify-center select-none">
        <Image
          src="/PickRandomSpot/logo.svg"
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
          <Button
            className={shapeType === "ellipse" ? "text-white" : ""}
            variant={shapeType === "ellipse" ? "default" : "outline"}
            style={
              shapeType === "ellipse"
                ? { backgroundColor: theme.shapes.ellipse.color }
                : {}
            }
            onClick={() => handleShapeTypeChange("ellipse")}
          >
            Ellipse
          </Button>
          <Button
            className={shapeType === "rectangle" ? "text-white" : ""}
            variant={shapeType === "rectangle" ? "default" : "outline"}
            style={
              shapeType === "rectangle"
                ? { backgroundColor: theme.shapes.rectangle.color }
                : {}
            }
            onClick={() => handleShapeTypeChange("rectangle")}
          >
            Rectangle
          </Button>
          <Button
            className={shapeType === "polygon" ? "text-white" : ""}
            variant={shapeType === "polygon" ? "default" : "outline"}
            style={
              shapeType === "polygon"
                ? { backgroundColor: theme.shapes.polygon.color }
                : {}
            }
            onClick={() => handleShapeTypeChange("polygon")}
          >
            Polygon
          </Button>
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
                    Click &quot;Complete Drawing&quot; when you&apos;re finished
                    adding points.
                  </p>
                )}
                <Button
                  variant="default"
                  className="mr-2 mt-2"
                  onClick={() => {
                    // Complete the polygon instead of canceling
                    setIsDrawingPolygon(false);
                  }}
                  disabled={points.length < 3}
                >
                  Complete Drawing
                </Button>
                <Button
                  variant="destructive"
                  className="mt-2"
                  onClick={() => {
                    updateShapeState({ points: [] });
                    setIsDrawingPolygon(false);
                  }}
                >
                  Cancel Drawing
                </Button>
              </div>
            ) : points.length > 2 ? (
              <div>
                <p className="mb-2">Polygon with {points.length} points</p>
                <Button
                  variant="default"
                  className="mt-2"
                  onClick={() => {
                    // Keep existing points when redrawing
                    setIsDrawingPolygon(true);
                  }}
                >
                  Redraw Polygon
                </Button>
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

            {/* Width/Radius X - Using logarithmic scale with editable input */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <label className="select-none text-sm font-medium">
                  {shapeType === "rectangle" ? "Width" : "Radius X"} (km):
                </label>
                <input
                  type="number"
                  value={radiusXInput}
                  onChange={(e) =>
                    handleRadiusInputChange(e.target.value, "radiusX")
                  }
                  className="bg-gray-700 text-white px-2 py-0.5 rounded w-16 text-sm text-right"
                  min="0.1"
                  step="0.1"
                />
              </div>
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={[radiusXSlider]}
                onValueChange={(values) =>
                  handleRadiusSliderChange(values, "radiusX")
                }
              />
            </div>

            {/* Height/Radius Y (only for ellipse and rectangle) - Using logarithmic scale with editable input */}
            {(shapeType === "ellipse" || shapeType === "rectangle") && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <label className="select-none text-sm font-medium">
                    {shapeType === "rectangle" ? "Height" : "Radius Y"} (km):
                  </label>
                  <input
                    type="number"
                    value={radiusYInput}
                    onChange={(e) =>
                      handleRadiusInputChange(e.target.value, "radiusY")
                    }
                    className="bg-gray-700 text-white px-2 py-0.5 rounded w-16 text-sm text-right"
                    min="0.1"
                    step="0.1"
                  />
                </div>
                <Slider
                  min={0}
                  max={1}
                  step={0.01}
                  value={[radiusYSlider]}
                  onValueChange={(values) =>
                    handleRadiusSliderChange(values, "radiusY")
                  }
                />
              </div>
            )}

            {/* Rotation (only for ellipse and rectangle) - Keeping linear scale with editable input */}
            {(shapeType === "ellipse" || shapeType === "rectangle") && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <label className="select-none text-sm font-medium">
                    Rotation (°):
                  </label>
                  <input
                    type="number"
                    value={rotationInput}
                    onChange={(e) => handleRotationInputChange(e.target.value)}
                    className="bg-gray-700 text-white px-2 py-0.5 rounded w-16 text-sm text-right"
                    min="0"
                    max="360"
                    step="1"
                  />
                </div>
                <Slider
                  min={0}
                  max={360}
                  step={1}
                  value={[parseFloat(rotationInput) || 0]}
                  onValueChange={handleRotationSliderChange}
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
        <Button
          variant="default"
          className="w-full"
          onClick={generateRandomSpot}
          disabled={
            (shapeState.shapeType === "polygon" &&
              (!points || points.length < 3)) ||
            (shapeState.shapeType !== "polygon" && !center)
          }
        >
          Generate Random Point
        </Button>

        <Button variant="outline" className="w-full" onClick={clearSelection}>
          Clear Selection
        </Button>
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
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${randomLat}%2C${randomLng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 w-full inline-flex items-center justify-center border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground cursor-pointer select-none whitespace-nowrap rounded-md text-sm font-medium transition-[color,box-shadow] h-9 px-4 py-2"
            >
              Open in Google Maps
            </a>
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
