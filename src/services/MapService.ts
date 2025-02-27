
// MapService handles map operations and location data
class MapService {
  // HERE Maps API credentials (free tier)
  private static readonly HERE_API_KEY = 'yfGGKBfKinFIRfCTbO60R-8e0712R8JY8t8ykh789Pc';
  private static readonly HERE_APP_ID = 'ylw1AtAEyAGPEW4m6FPf';

  // Store tagged locations 
  private static taggedLocations: TaggedLocation[] = [];

  // Get the HERE API Key
  static getHereApiKey(): string {
    return this.HERE_API_KEY;
  }

  // Get the HERE App ID
  static getHereAppId(): string {
    return this.HERE_APP_ID;
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
