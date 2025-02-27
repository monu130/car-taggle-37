
// MapService handles map operations and location data
class MapService {
  // Default token placeholder (user will need to provide their own token)
  private static mapboxToken: string | null = null;
  
  // Store tagged locations 
  private static taggedLocations: TaggedLocation[] = [];
  private static isInitialized = false;

  // Initialize the service
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Load locations from localStorage
      this.loadFromLocalStorage();
      this.isInitialized = true;
      console.log("MapService initialized successfully");
    } catch (error) {
      console.error("Error initializing MapService:", error);
    }
  }

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
  static async saveTaggedLocation(location: TaggedLocation): Promise<void> {
    // Add the new location
    this.taggedLocations.push(location);
    
    // Save to localStorage
    this.saveToLocalStorage();
  }

  // Get all tagged locations
  static async getTaggedLocations(): Promise<TaggedLocation[]> {
    // Initialize if not already done
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    return this.taggedLocations;
  }

  // Delete a tagged location by ID
  static async deleteTaggedLocation(id: string): Promise<void> {
    this.taggedLocations = this.taggedLocations.filter(loc => loc.id !== id);
    this.saveToLocalStorage();
  }
  
  // Clear all tagged locations
  static async clearTaggedLocations(): Promise<void> {
    this.taggedLocations = [];
    localStorage.setItem('tagged_locations', JSON.stringify([]));
  }
  
  // Load locations from localStorage
  private static loadFromLocalStorage(): TaggedLocation[] {
    const savedLocations = localStorage.getItem('tagged_locations');
    if (savedLocations) {
      this.taggedLocations = JSON.parse(savedLocations);
    }
    return this.taggedLocations;
  }
  
  // Save locations to localStorage
  private static saveToLocalStorage(): void {
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
