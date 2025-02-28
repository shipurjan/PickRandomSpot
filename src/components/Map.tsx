// src/components/Map.tsx
'use client'
import { useEffect } from 'react'
import { MapContainer, TileLayer, Circle, Marker, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix Leaflet icons in Next.js
function LeafletIconFix() {
  useEffect(() => {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });
  }, []);
  
  return null;
}

// Component to sync map with URL state
function MapController({ 
  lat, lng, zoom, setLat, setLng, setZoom, setCircleLat, setCircleLng 
}) {
  const map = useMap();
  
  // Set initial map view
  useEffect(() => {
    map.setView([lat, lng], zoom);
  }, [map, lat, lng, zoom]);
  
  // Update state on map events
  useMapEvents({
    moveend: () => {
      const center = map.getCenter();
      setLat(center.lat);
      setLng(center.lng);
      setZoom(map.getZoom());
    },
    click: (e) => {
      setCircleLat(e.latlng.lat);
      setCircleLng(e.latlng.lng);
    },
  });
  
  return null;
}

export default function MapComponent({
  lat, lng, zoom, setLat, setLng, setZoom,
  circleLat, circleLng, radius, randomLat, randomLng, setCircleLat, setCircleLng
}) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
    >
      <LeafletIconFix />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      <MapController
        lat={lat} lng={lng} zoom={zoom}
        setLat={setLat} setLng={setLng} setZoom={setZoom}
        setCircleLat={setCircleLat} setCircleLng={setCircleLng}
      />
      
      {/* Selected area circle */}
      {circleLat !== null && circleLng !== null && radius !== null && (
        <Circle
          center={[circleLat, circleLng]}
          radius={radius}
          pathOptions={{ color: 'blue', fillColor: '#30f', fillOpacity: 0.2 }}
        />
      )}
      
      {/* Random point marker */}
      {randomLat !== null && randomLng !== null && (
        <Marker position={[randomLat, randomLng]} />
      )}
    </MapContainer>
  );
}