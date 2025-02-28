// src/lib/randomPoint.ts
export function generateRandomPointInCircle(
    centerLat: number,
    centerLng: number,
    radius: number
  ): [number, number] {
    // Generate random angle and distance (using sqrt for uniform distribution)
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.sqrt(Math.random()) * radius;
    
    // Convert to lat/lng offset (approximate for small areas)
    const latOffset = distance * Math.sin(angle) / 111111; // 1 degree lat ≈ 111,111 meters
    const lngOffset = distance * Math.cos(angle) / (111111 * Math.cos(centerLat * Math.PI / 180));
    
    return [centerLat + latOffset, centerLng + lngOffset];
  }