
// MapService handles map operations and location data
class MapService {
  // Default Mapbox token (public token for demo purposes)
  private static readonly DEFAULT_MAPBOX_TOKEN = 'pk.eyJ1IjoibG92YWJsZS1haS1kZW1vIiwiYSI6ImNsdmh1dWVvazAxczQyanBnOTk3dmxldm0ifQ.a7r5inWxbJVersIS6GN4ZA';
  
  // Store tagged locations 
  private static taggedLocations: TaggedLocation[] = [];

  // Get the Mapbox token
  static getMapboxToken(): string {
    return this.DEFAULT_MAPBOX_TOKEN;
  }

  // Save a tagged location
  static saveTaggedLocation(location: TaggedLocation): void {
    // Add the new location
    this.taggedLocations.push(location);
    
    // Save to localStorage
    localStorage.setItem('tagged_locations', JSON.stringify(this.taggedLocations));
  }

  // Get all tagged locations
  static getTaggedLocations(): TaggedLocation[] {
    // Load from localStorage if not already loaded
    if (this.taggedLocations.length === 0) {
      const savedLocations = localStorage.getItem('tagged_locations');
      if (savedLocations) {
        this.taggedLocations = JSON.parse(savedLocations);
      }
    }
    
    return this.taggedLocations;
  }

  // Delete a tagged location by ID
  static deleteTaggedLocation(id: string): void {
    this.taggedLocations = this.taggedLocations.filter(loc => loc.id !== id);
    localStorage.setItem('tagged_locations', JSON.stringify(this.taggedLocations));
  }
  
  // Clear all tagged locations
  static clearTaggedLocations(): void {
    this.taggedLocations = [];
    localStorage.setItem('tagged_locations', JSON.stringify(this.taggedLocations));
  }
}

// Types
export interface TaggedLocation {
  id: string;
  name: string;
  type: 'car' | 'shop' | 'custom';
  latitude: number;
  longitude: number;
  createdAt: string;
  icon?: string;
}

export default MapService;
