import { SetStateAction } from "react";

export type SetterFunction<T> = (value: SetStateAction<T>) => void;

export interface MapProps {
  lat: number;
  lng: number;
  zoom: number;
  setLat: SetterFunction<number>;
  setLng: SetterFunction<number>;
  setZoom: SetterFunction<number>;
  circleLat: number | null;
  circleLng: number | null;
  radius: number | null;
  randomLat: number | null;
  randomLng: number | null;
  setCircleLat: SetterFunction<number | null>;
  setCircleLng: SetterFunction<number | null>;
}

export interface MapControllerProps {
  lat: number;
  lng: number;
  zoom: number;
  setLat: SetterFunction<number>;
  setLng: SetterFunction<number>;
  setZoom: SetterFunction<number>;
  setCircleLat: SetterFunction<number | null>;
  setCircleLng: SetterFunction<number | null>;
}

export interface SidebarProps {
  circleLat: number | null;
  circleLng: number | null;
  radius: number | null;
  setRadius: SetterFunction<number | null>;
  randomLat: number | null;
  randomLng: number | null;
  setRandomLat: SetterFunction<number | null>;
  setRandomLng: SetterFunction<number | null>;
  setCircleLat: SetterFunction<number | null>;
  setCircleLng: SetterFunction<number | null>;
}
