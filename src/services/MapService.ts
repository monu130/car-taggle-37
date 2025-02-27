
// MapService handles map operations and location data
class MapService {
  // Default token placeholder (user will need to provide their own token)
  private static mapboxToken: string | null = null;
  
  // Store tagged locations 
  private static taggedLocations: TaggedLocation[] = [];

  // Set the Mapbox token
  static setMapboxToken(token: string): void {
    this.mapboxToken = token;
    localStorage.setItem('mapbox_token', token);
  }

  // Get the Mapbox token
  static getMapboxToken(): string | null {
    if (!this.mapboxToken) {
      // Try to load from localStorage
      const savedToken = localStorage.getItem('mapbox_token');
      if (savedToken) {
        this.mapboxToken = savedToken;
      }
    }
    return this.mapboxToken;
  }

  // Check if token is set
  static hasMapboxToken(): boolean {
    return !!this.getMapboxToken();
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
