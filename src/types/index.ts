// src/types/index.ts
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

export interface RandomPointState {
  randomLat: number | null;
  randomLng: number | null;
}

export interface MapProps {
  mapState: MapState;
  updateMapState: (newState: Partial<MapState>) => void;
  circleState: CircleState;
  updateCircleState: (newState: Partial<CircleState>) => void;
  randomPointState: RandomPointState;
}

export interface SidebarProps {
  circleState: CircleState;
  updateCircleState: (newState: Partial<CircleState>) => void;
  randomPointState: RandomPointState;
  setRandomPointState: (newState: Partial<RandomPointState>) => void;
}
