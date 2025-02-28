// src/types/index.ts
export type ShapeType = "ellipse" | "rectangle" | "polygon";

export interface Point {
  lat: number;
  lng: number;
}

export interface MapState {
  lat: number;
  lng: number;
  zoom: number;
}

export interface CircleState {
  circleLat: number | null;
  circleLng: number | null;
  radius: number | null;
}

export interface ShapeState {
  center: Point | null;
  // For ellipse: radiusX/radiusY in meters
  // For rectangle: width/height in meters
  radiusX: number;
  radiusY: number;
  // For polygon: array of points
  points: Point[];
  // Current active shape
  shapeType: ShapeType | null;
  // For ellipse & rectangle: rotation in degrees
  rotation: number;
}

export interface RandomPointState {
  randomLat: number | null;
  randomLng: number | null;
}

export interface MapProps {
  mapState: MapState;
  updateMapState: (newState: Partial<MapState>) => void;
  shapeState: ShapeState;
  updateShapeState: (newState: Partial<ShapeState>) => void;
  randomPointState: RandomPointState;
  isDrawingPolygon: boolean;
  testPoints?: [number, number][]; // Add this line
}

export interface SidebarProps {
  shapeState: ShapeState;
  updateShapeState: (newState: Partial<ShapeState>) => void;
  randomPointState: RandomPointState;
  setRandomPointState: (newState: Partial<RandomPointState>) => void;
  isDrawingPolygon: boolean;
  setIsDrawingPolygon: (isDrawing: boolean) => void;
  addTestPoints?: (points: [number, number][]) => void;
  clearTestPoints?: () => void;
}
