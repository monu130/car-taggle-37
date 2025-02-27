// MapService handles map operations and location data
import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';

class MapService {
  // Default token placeholder (user will need to provide their own token)
  private static mapboxToken: string | null = null;
  
  // MongoDB connection
  private static mongoClient: MongoClient | null = null;
  private static dbName = 'spottag';
  private static collectionName = 'locations';
  private static uri = 'mongodb+srv://your-mongodb-connection-string'; // Replace with your MongoDB connection string
  
  // Store tagged locations 
  private static taggedLocations: TaggedLocation[] = [];
  private static isInitialized = false;

  // Initialize MongoDB connection
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Try to connect to MongoDB
      this.mongoClient = new MongoClient(this.uri, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        }
      });
      
      console.log("Attempting to connect to MongoDB...");
      await this.mongoClient.connect();
      console.log("Connected to MongoDB successfully");
      
      // Load locations from MongoDB
      await this.fetchTaggedLocations();
      
      this.isInitialized = true;
    } catch (error) {
      console.error("Error connecting to MongoDB:", error);
      // Fallback to localStorage if MongoDB connection fails
      this.loadFromLocalStorage();
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

  // Fetch tagged locations from MongoDB
  static async fetchTaggedLocations(): Promise<TaggedLocation[]> {
    if (!this.mongoClient) {
      console.log("MongoDB client not initialized, using localStorage");
      return this.loadFromLocalStorage();
    }
    
    try {
      const db = this.mongoClient.db(this.dbName);
      const collection = db.collection(this.collectionName);
      
      const locations = await collection.find({}).toArray();
      
      // Map MongoDB documents to TaggedLocation objects
      this.taggedLocations = locations.map(loc => ({
        id: loc._id.toString(),
        name: loc.name,
        type: loc.type,
        latitude: loc.latitude,
        longitude: loc.longitude,
        createdAt: loc.createdAt
      }));
      
      console.log(`Loaded ${this.taggedLocations.length} locations from MongoDB`);
      return this.taggedLocations;
    } catch (error) {
      console.error("Error fetching locations from MongoDB:", error);
      return this.loadFromLocalStorage();
    }
  }

  // Save a tagged location to MongoDB
  static async saveTaggedLocation(location: TaggedLocation): Promise<void> {
    // Add the new location to local array
    this.taggedLocations.push(location);
    
    // Save to MongoDB
    if (this.mongoClient) {
      try {
        const db = this.mongoClient.db(this.dbName);
        const collection = db.collection(this.collectionName);
        
        // Convert TaggedLocation to MongoDB document
        const doc = {
          name: location.name,
          type: location.type,
          latitude: location.latitude,
          longitude: location.longitude,
          createdAt: location.createdAt
        };
        
        await collection.insertOne(doc);
        console.log("Location saved to MongoDB");
      } catch (error) {
        console.error("Error saving location to MongoDB:", error);
        // Fallback to localStorage
        this.saveToLocalStorage();
      }
    } else {
      // Fallback to localStorage
      this.saveToLocalStorage();
    }
  }

  // Get all tagged locations
  static async getTaggedLocations(): Promise<TaggedLocation[]> {
    // Initialize if not already done
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    // If we have locations in memory, return them
    if (this.taggedLocations.length > 0) {
      return this.taggedLocations;
    }
    
    // Otherwise fetch from MongoDB
    return this.fetchTaggedLocations();
  }

  // Delete a tagged location by ID
  static async deleteTaggedLocation(id: string): Promise<void> {
    // Remove from local array
    this.taggedLocations = this.taggedLocations.filter(loc => loc.id !== id);
    
    // Delete from MongoDB
    if (this.mongoClient) {
      try {
        const db = this.mongoClient.db(this.dbName);
        const collection = db.collection(this.collectionName);
        
        // Try to convert id to ObjectId if it's a valid MongoDB id
        let mongoId;
        try {
          mongoId = new ObjectId(id);
        } catch (e) {
          mongoId = id;
        }
        
        await collection.deleteOne({ _id: mongoId });
        console.log("Location deleted from MongoDB");
      } catch (error) {
        console.error("Error deleting location from MongoDB:", error);
        // Fallback to localStorage
        this.saveToLocalStorage();
      }
    } else {
      // Fallback to localStorage
      this.saveToLocalStorage();
    }
  }
  
  // Clear all tagged locations
  static async clearTaggedLocations(): Promise<void> {
    this.taggedLocations = [];
    
    // Clear from MongoDB
    if (this.mongoClient) {
      try {
        const db = this.mongoClient.db(this.dbName);
        const collection = db.collection(this.collectionName);
        
        await collection.deleteMany({});
        console.log("All locations cleared from MongoDB");
      } catch (error) {
        console.error("Error clearing locations from MongoDB:", error);
        // Fallback to localStorage
        localStorage.setItem('tagged_locations', JSON.stringify([]));
      }
    } else {
      // Fallback to localStorage
      localStorage.setItem('tagged_locations', JSON.stringify([]));
    }
  }
  
  // Load locations from localStorage (fallback)
  private static loadFromLocalStorage(): TaggedLocation[] {
    const savedLocations = localStorage.getItem('tagged_locations');
    if (savedLocations) {
      this.taggedLocations = JSON.parse(savedLocations);
    }
    return this.taggedLocations;
  }
  
  // Save locations to localStorage (fallback)
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
