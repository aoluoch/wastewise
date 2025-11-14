export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Bounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export const mapHelpers = {
  // Calculate distance between two coordinates in kilometers
  calculateDistance: (coord1: Coordinates, coord2: Coordinates): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(coord2.lat - coord1.lat);
    const dLng = toRadians(coord2.lng - coord1.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(coord1.lat)) *
        Math.cos(toRadians(coord2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  // Convert degrees to radians
  toRadians: (degrees: number): number => {
    return degrees * (Math.PI / 180);
  },

  // Get center point of multiple coordinates
  getCenter: (coordinates: Coordinates[]): Coordinates => {
    if (coordinates.length === 0) {
      return { lat: 0, lng: 0 };
    }

    const sum = coordinates.reduce(
      (acc, coord) => ({
        lat: acc.lat + coord.lat,
        lng: acc.lng + coord.lng,
      }),
      { lat: 0, lng: 0 }
    );

    return {
      lat: sum.lat / coordinates.length,
      lng: sum.lng / coordinates.length,
    };
  },

  // Get bounds that contain all coordinates
  getBounds: (coordinates: Coordinates[]): Bounds => {
    if (coordinates.length === 0) {
      return { north: 0, south: 0, east: 0, west: 0 };
    }

    return coordinates.reduce(
      (bounds, coord) => ({
        north: Math.max(bounds.north, coord.lat),
        south: Math.min(bounds.south, coord.lat),
        east: Math.max(bounds.east, coord.lng),
        west: Math.min(bounds.west, coord.lng),
      }),
      {
        north: coordinates[0].lat,
        south: coordinates[0].lat,
        east: coordinates[0].lng,
        west: coordinates[0].lng,
      }
    );
  },

  // Check if coordinates are within bounds
  isWithinBounds: (coord: Coordinates, bounds: Bounds): boolean => {
    return (
      coord.lat >= bounds.south &&
      coord.lat <= bounds.north &&
      coord.lng >= bounds.west &&
      coord.lng <= bounds.east
    );
  },

  // Format coordinates for display
  formatCoordinates: (coord: Coordinates, precision: number = 4): string => {
    return `${coord.lat.toFixed(precision)}, ${coord.lng.toFixed(precision)}`;
  },

  // Generate random coordinates within a radius of a center point
  generateRandomCoordinates: (
    center: Coordinates,
    radiusKm: number
  ): Coordinates => {
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * radiusKm;

    const lat = center.lat + (distance / 111) * Math.cos(angle);
    const lng =
      center.lng +
      (distance / (111 * Math.cos(toRadians(center.lat)))) * Math.sin(angle);

    return { lat, lng };
  },

  // Convert coordinates to address (placeholder - would use geocoding service)
  reverseGeocode: async (coord: Coordinates): Promise<string> => {
    // This would typically use a geocoding service like Google Maps or Mapbox
    return `${coord.lat.toFixed(4)}, ${coord.lng.toFixed(4)}`;
  },

  // Convert address to coordinates (placeholder - would use geocoding service)
  geocode: async (_address: string): Promise<Coordinates | null> => {
    // This would typically use a geocoding service
    return null;
  },
};

// Helper function for toRadians
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
