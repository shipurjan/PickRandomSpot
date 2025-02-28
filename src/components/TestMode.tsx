// src/components/TestMode.tsx
"use client";
import { useState } from "react";
import { generateRandomPoint } from "@/lib/utils/randomPoint";
import { ShapeState } from "@/types";

interface TestModeProps {
  shapeState: ShapeState;
  addTestPoints: (points: [number, number][]) => void;
  clearTestPoints: () => void;
}

export default function TestMode({
  shapeState,
  addTestPoints,
  clearTestPoints,
}: TestModeProps) {
  const [numPoints, setNumPoints] = useState(100);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateTestPoints = () => {
    // Validate shape is defined
    if (
      (shapeState.shapeType !== "polygon" && !shapeState.center) ||
      (shapeState.shapeType === "polygon" && shapeState.points.length < 3)
    ) {
      alert("Please define a valid shape first");
      return;
    }

    setIsGenerating(true);
    clearTestPoints();

    // Generate points in batches to avoid UI freezing
    const points: [number, number][] = [];
    let generatedCount = 0;

    const generateBatch = () => {
      const batchSize = 50;
      const newBatch: [number, number][] = [];

      for (let i = 0; i < batchSize && generatedCount < numPoints; i++) {
        const point = generateRandomPoint(shapeState);
        if (point) {
          newBatch.push(point);
          generatedCount++;
        }
      }

      if (newBatch.length > 0) {
        points.push(...newBatch);
        addTestPoints(newBatch);
      }

      if (generatedCount < numPoints) {
        // Continue generating in next tick
        setTimeout(generateBatch, 0);
      } else {
        setIsGenerating(false);
      }
    };

    generateBatch();
  };

  return (
    <div className="mt-6 p-3 bg-gray-800 rounded-md">
      <div className="flex items-center justify-between">
        <h3 className="text-md font-bold text-yellow-400">TEST MODE</h3>
        <div className="text-xs bg-yellow-600 text-black px-2 py-0.5 rounded">
          DEV
        </div>
      </div>

      <div className="mt-2">
        <label className="block text-sm mb-1">Number of test points:</label>
        <div className="flex space-x-2">
          <input
            type="number"
            min="10"
            max="5000"
            value={numPoints}
            onChange={(e) =>
              setNumPoints(Math.max(10, parseInt(e.target.value) || 10))
            }
            className="bg-gray-700 text-white px-2 py-1 rounded w-24"
          />
          <button
            onClick={generateTestPoints}
            disabled={isGenerating}
            className={`px-2 py-1 rounded text-sm flex-grow ${
              isGenerating ? "bg-gray-600" : "bg-yellow-600 hover:bg-yellow-500"
            }`}
          >
            {isGenerating ? "Generating..." : "Generate Test Points"}
          </button>
        </div>
      </div>

      <div className="flex space-x-2 mt-2">
        <button
          onClick={clearTestPoints}
          className="px-2 py-1 rounded text-sm bg-red-700 hover:bg-red-600 w-full"
        >
          Clear Test Points
        </button>
      </div>

      <p className="text-xs text-gray-400 mt-2">
        This mode generates multiple random points to visually verify uniform
        distribution.
      </p>
    </div>
  );
}
