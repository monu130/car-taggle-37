
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Navigation, Trash2, Car, Store, MapPinOff } from 'lucide-react';
import MapService, { TaggedLocation } from '@/services/MapService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import * as turf from '@turf/turf';

interface MapComponentProps {
  onLocationSelected?: (location: { lat: number; lng: number }) => void;
  onLocationsUpdated?: () => void;
}

const MapComponent: React.FC<MapComponentProps> = ({ 
  onLocationSelected,
  onLocationsUpdated 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const currentLocationMarker = useRef<mapboxgl.Marker | null>(null);
  const [taggingMode, setTaggingMode] = useState<boolean>(false);
  const [showTagForm, setShowTagForm] = useState<boolean>(false);
  const [newTagName, setNewTagName] = useState<string>('');
  const [newTagType, setNewTagType] = useState<'car' | 'shop' | 'custom'>('car');
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const locationMarkers = useRef<{ [id: string]: mapboxgl.Marker }>({});
  const navigationLine = useRef<mapboxgl.GeoJSONSource | null>(null);
  const [isLoadingMap, setIsLoadingMap] = useState<boolean>(true);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Get Mapbox token from service
    const mapboxToken = MapService.getMapboxToken();
    if (!mapboxToken) {
      console.error("No Mapbox token available");
      return;
    }
    
    mapboxgl.accessToken = mapboxToken;

    // Initialize the map
    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [0, 0], // Default center
        zoom: 2,
      });

      console.log("Map initialized successfully");

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl(),
        'top-right'
      );

      // Set up click handler for tagging mode
      map.current.on('click', (e) => {
        if (taggingMode) {
          const { lng, lat } = e.lngLat;
          setSelectedLocation({ lng, lat });
          
          // Add temporary marker
          if (marker.current) {
            marker.current.remove();
          }
          
          // Create custom marker element
          const el = document.createElement('div');
          el.className = 'map-marker animate-bounce';
          el.innerHTML = `<span class="text-xl">📍</span>`;
          
          // Add marker to map
          marker.current = new mapboxgl.Marker(el)
            .setLngLat([lng, lat])
            .addTo(map.current!);
            
          // Show the tag form
          setShowTagForm(true);
        }
      });

      // On map load, add navigation line source
      map.current.on('load', () => {
        console.log("Map loaded successfully");
        setIsLoadingMap(false);
        
        map.current!.addSource('navigation-route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: []
            }
          }
        });
        
        map.current!.addLayer({
          id: 'navigation-route',
          type: 'line',
          source: 'navigation-route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#3B82F6', // Changed to app-blue instead of pink
            'line-width': 5,
            'line-opacity': 0.8
          }
        });
        
        navigationLine.current = map.current!.getSource('navigation-route') as mapboxgl.GeoJSONSource;
        
        // Load and display saved tagged locations
        loadTaggedLocations();
        
        // Get user's current position
        getCurrentPosition();
      });

      // Setup interval to update current position
      const positionInterval = setInterval(() => {
        getCurrentPosition();
      }, 10000); // Update every 10 seconds

      // Cleanup on unmount
      return () => {
        map.current?.remove();
        clearInterval(positionInterval);
      };
    } catch (error) {
      console.error("Error initializing map:", error);
      setIsLoadingMap(false);
      toast.error("Failed to initialize map. Please check your Mapbox token.");
    }
  }, []);

  // Update current location marker
  const updateCurrentLocationMarker = (position: { lat: number; lng: number }) => {
    if (!map.current) return;
    
    // Remove existing marker if it exists
    if (currentLocationMarker.current) {
      currentLocationMarker.current.remove();
    }
    
    // Create custom marker element for current location
    const el = document.createElement('div');
    el.className = 'current-location-marker';
    el.innerHTML = `
      <div class="w-6 h-6 rounded-full bg-app-blue border-2 border-white flex items-center justify-center relative">
        <div class="w-2 h-2 rounded-full bg-white"></div>
        <div class="absolute w-12 h-12 rounded-full border-2 border-app-blue/30 animate-ping"></div>
      </div>
    `;
    
    // Add marker to map
    currentLocationMarker.current = new mapboxgl.Marker(el)
      .setLngLat([position.lng, position.lat])
      .addTo(map.current);
  };

  // Get user's current position
  const getCurrentPosition = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newPosition = { lat: latitude, lng: longitude };
          setCurrentPosition(newPosition);
          
          // Update the current location marker
          updateCurrentLocationMarker(newPosition);
          
          // If map is already initialized and no locations loaded yet, fly to the user's location
          if (map.current && !Object.keys(locationMarkers.current).length) {
            map.current.flyTo({
              center: [longitude, latitude],
              zoom: 15,
              speed: 1.5,
              curve: 1.5
            });
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Could not get your location. Please check your browser permissions.');
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser.');
    }
  };

  // Quick tag current location
  const quickTagCurrentLocation = () => {
    if (!currentPosition) {
      toast.error('Cannot tag location: Your current position is not available.');
      return;
    }
    
    // Show tag form with current position
    setSelectedLocation(currentPosition);
    setShowTagForm(true);
    
    // Create temporary marker at current position
    if (marker.current) {
      marker.current.remove();
    }
    
    if (map.current) {
      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'map-marker animate-bounce';
      el.innerHTML = `<span class="text-xl">📍</span>`;
      
      // Add marker to map
      marker.current = new mapboxgl.Marker(el)
        .setLngLat([currentPosition.lng, currentPosition.lat])
        .addTo(map.current);
    }
    
    // Set default name based on type
    if (newTagType === 'car') {
      setNewTagName('My Car');
    } else if (newTagType === 'shop') {
      setNewTagName('Favorite Shop');
    } else {
      setNewTagName('Tagged Location');
    }
  };

  // Load tagged locations from the service
  const loadTaggedLocations = async () => {
    if (!map.current) return;

    // Clear existing markers
    Object.values(locationMarkers.current).forEach(marker => marker.remove());
    locationMarkers.current = {};

    try {
      // Get saved locations from MongoDB
      const locations = await MapService.getTaggedLocations();
      console.log("Loading tagged locations:", locations);

      // Add markers for each location with staggered animation
      locations.forEach((location, index) => {
        setTimeout(() => {
          addLocationMarker(location);
        }, index * 200); // Stagger by 200ms
      });
      
      // Notify parent component if needed
      if (onLocationsUpdated) {
        onLocationsUpdated();
      }
    } catch (error) {
      console.error("Error loading locations:", error);
      toast.error("Could not load your saved locations");
    }
  };

  // Add a marker for a tagged location
  const addLocationMarker = (location: TaggedLocation) => {
    if (!map.current) return;

    console.log("Adding marker for location:", location);

    // Create a custom marker element
    const el = document.createElement('div');
    el.className = 'map-marker animate-zoom-in';

    // Set icon based on type
    if (location.type === 'car') {
      el.innerHTML = `<span><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 17H5V15H19V17Z" fill="currentColor"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M17.0349 5.59921C16.1962 4.17389 14.7091 3.25 13 3.25H11C9.29086 3.25 7.80381 4.17389 6.96506 5.59921L5.26756 8.59921C5.0935 8.91944 5 9.27648 5 9.63891V11.75H19V9.63891C19 9.27648 18.9065 8.91944 18.7324 8.59921L17.0349 5.59921ZM8.5 10C8.5 9.44772 8.94772 9 9.5 9C10.0523 9 10.5 9.44772 10.5 10C10.5 10.5523 10.0523 11 9.5 11C8.94772 11 8.5 10.5523 8.5 10ZM14.5 9C13.9477 9 13.5 9.44772 13.5 10C13.5 10.5523 13.9477 11 14.5 11C15.0523 11 15.5 10.5523 15.5 10C15.5 9.44772 15.0523 9 14.5 9Z" fill="currentColor"/>
        <path d="M6.5 17.25V19C6.5 19.5523 6.94772 20 7.5 20H9.5C10.0523 20 10.5 19.5523 10.5 19V17.25H6.5Z" fill="currentColor"/>
        <path d="M13.5 17.25V19C13.5 19.5523 13.9477 20 14.5 20H16.5C17.0523 20 17.5 19.5523 17.5 19V17.25H13.5Z" fill="currentColor"/>
      </svg></span>`;
    } else if (location.type === 'shop') {
      el.innerHTML = `<span><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 6L3 8H21V6H3Z" fill="currentColor"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M12 18.5C12 18.2239 12.2239 18 12.5 18H18.5C18.7761 18 19 18.2239 19 18.5C19 18.7761 18.7761 19 18.5 19H12.5C12.2239 19 12 18.7761 12 18.5Z" fill="currentColor"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M12 15.5C12 15.2239 12.2239 15 12.5 15H18.5C18.7761 15 19 15.2239 19 15.5C19 15.7761 18.7761 16 18.5 16H12.5C12.2239 16 12 15.7761 12 15.5Z" fill="currentColor"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M12 12.5C12 12.2239 12.2239 12 12.5 12H18.5C18.7761 12 19 12.2239 19 12.5C19 12.7761 18.7761 13 18.5 13H12.5C12.2239 13 12 12.7761 12 12.5Z" fill="currentColor"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M7.5 11C6.67157 11 6 11.6716 6 12.5C6 13.3284 6.67157 14 7.5 14C8.32843 14 9 13.3284 9 12.5C9 11.6716 8.32843 11 7.5 11ZM5 12.5C5 11.1193 6.11929 10 7.5 10C8.88071 10 10 11.1193 10 12.5C10 13.8807 8.88071 15 7.5 15C6.11929 15 5 13.8807 5 12.5Z" fill="currentColor"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M3 8V20H21V8H3ZM4 9V19H20V9H4Z" fill="currentColor"/>
        <path d="M7.5 17.5V19H16.5V17.5H7.5Z" fill="currentColor"/>
      </svg></span>`;
    } else {
      el.innerHTML = `<span>📍</span>`;
    }

    // Add name label to marker
    const nameLabel = document.createElement('div');
    nameLabel.className = 'map-marker-label';
    nameLabel.innerText = location.name;
    el.appendChild(nameLabel);

    // Create popup
    const popup = new mapboxgl.Popup({ offset: 25 })
      .setHTML(`
        <div class="flex flex-col gap-2">
          <h3 class="text-lg font-bold">${location.name}</h3>
          <p class="text-sm text-gray-600">
            Type: ${location.type.charAt(0).toUpperCase() + location.type.slice(1)}<br/>
            Created: ${new Date(location.createdAt).toLocaleString()}
          </p>
          <div class="flex gap-2 mt-2">
            <button class="navigate-btn bg-app-blue text-white py-1 px-3 text-sm rounded-full" data-id="${location.id}">
              Navigate Here
            </button>
            <button class="delete-btn bg-app-red text-white py-1 px-3 text-sm rounded-full" data-id="${location.id}">
              Delete
            </button>
          </div>
        </div>
      `);
      
    // Add the marker to the map
    const newMarker = new mapboxgl.Marker(el)
      .setLngLat([location.longitude, location.latitude])
      .setPopup(popup)
      .addTo(map.current);
    
    // Save reference to the marker
    locationMarkers.current[location.id] = newMarker;
    
    // Add event listeners to the popup buttons
    popup.on('open', () => {
      // Navigate button
      document.querySelectorAll('.navigate-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const target = e.currentTarget as HTMLElement;
          const id = target.getAttribute('data-id');
          if (id) navigateToLocation(id);
        });
      });
      
      // Delete button
      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const target = e.currentTarget as HTMLElement;
          const id = target.getAttribute('data-id');
          if (id) deleteLocation(id);
        });
      });
    });
  };

  // Delete a location
  const deleteLocation = async (id: string) => {
    // Remove the marker from the map
    if (locationMarkers.current[id]) {
      locationMarkers.current[id].remove();
      delete locationMarkers.current[id];
    }
    
    try {
      // Delete from MongoDB
      await MapService.deleteTaggedLocation(id);
      
      // Show toast
      toast.success('Location deleted successfully!');
      
      // Notify parent component if needed
      if (onLocationsUpdated) {
        onLocationsUpdated();
      }
    } catch (error) {
      console.error("Error deleting location:", error);
      toast.error("Could not delete location");
    }
  };

  // Navigate to a location
  const navigateToLocation = async (id: string) => {
    if (!currentPosition) {
      toast.error('Cannot navigate: Your current location is not available.');
      return;
    }
    
    try {
      // Get all locations
      const locations = await MapService.getTaggedLocations();
      
      // Find the location to navigate to
      const targetLocation = locations.find(loc => loc.id === id);
      
      if (!targetLocation) {
        toast.error('Location not found.');
        return;
      }
      
      // Create a simple line between current position and target
      if (navigationLine.current && map.current) {
        const route = {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [
              [currentPosition.lng, currentPosition.lat],
              [targetLocation.longitude, targetLocation.latitude]
            ]
          }
        };
        
        navigationLine.current.setData(route as any);
        
        // Calculate distance
        const from = turf.point([currentPosition.lng, currentPosition.lat]);
        const to = turf.point([targetLocation.longitude, targetLocation.latitude]);
        const distance = turf.distance(from, to, { units: 'kilometers' });
        
        // Fit the map to show both points
        const bounds = new mapboxgl.LngLatBounds()
          .extend([currentPosition.lng, currentPosition.lat])
          .extend([targetLocation.longitude, targetLocation.latitude]);
          
        map.current.fitBounds(bounds, {
          padding: 100,
          duration: 1000
        });
        
        // Show toast with distance info
        toast.success(`Navigation started! Distance: ${distance.toFixed(2)} km`);
      }
    } catch (error) {
      console.error("Error navigating to location:", error);
      toast.error("Could not start navigation");
    }
  };

  // Toggle tagging mode
  const toggleTaggingMode = () => {
    setTaggingMode(!taggingMode);
    if (!taggingMode) {
      toast('Tap on the map to mark a location!');
    } else {
      if (marker.current) {
        marker.current.remove();
        marker.current = null;
      }
      setShowTagForm(false);
    }
  };

  // Save a new tagged location
  const saveTaggedLocation = async () => {
    if (!selectedLocation) return;
    if (newTagName.trim() === '') {
      toast.error('Please enter a name for this location');
      return;
    }
    
    // Create a new location object
    const newLocation: TaggedLocation = {
      id: Date.now().toString(),
      name: newTagName,
      type: newTagType,
      latitude: selectedLocation.lat,
      longitude: selectedLocation.lng,
      createdAt: new Date().toISOString()
    };
    
    console.log("Saving new location:", newLocation);
    
    try {
      // Save to MongoDB
      await MapService.saveTaggedLocation(newLocation);
      
      // Add marker to map
      addLocationMarker(newLocation);
      
      // Reset form
      setNewTagName('');
      setSelectedLocation(null);
      if (marker.current) {
        marker.current.remove();
        marker.current = null;
      }
      setShowTagForm(false);
      setTaggingMode(false);
      
      // Show success toast
      toast.success('Location tagged successfully!');
      
      // Notify parent component if needed
      if (onLocationsUpdated) {
        onLocationsUpdated();
      }
    } catch (error) {
      console.error("Error saving location:", error);
      toast.error("Could not save location");
    }
  };

  return (
    <div className="relative animate-fade-in">
      {/* Main map container */}
      <div className="relative">
        <div ref={mapContainer} className="map-container h-[500px] w-full rounded-lg shadow-lg" style={{ minHeight: '400px' }} />
        
        {/* Loading overlay */}
        {isLoadingMap && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-app-blue mb-3"></div>
              <p className="text-gray-700">Loading map...</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Floating action buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3">
        {/* Quick tag current location button */}
        <button
          className="floating-action-button bg-app-blue flex items-center justify-center"
          onClick={quickTagCurrentLocation}
          title="Tag my current location"
          disabled={isLoadingMap}
        >
          <div className="relative">
            <MapPin className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 text-sm bg-white text-app-blue rounded-full w-4 h-4 flex items-center justify-center font-bold">+</span>
          </div>
        </button>
        
        {/* Toggle map tagging mode button */}
        <button
          className={`floating-action-button ${taggingMode ? 'bg-app-green' : 'bg-app-pink'}`}
          onClick={toggleTaggingMode}
          title="Toggle map tagging mode"
          disabled={isLoadingMap}
        >
          <MapPin className={`w-6 h-6 ${taggingMode ? 'animate-pulse' : ''}`} />
        </button>
      </div>
      
      {/* Tag form */}
      {showTagForm && selectedLocation && (
        <div className="absolute left-0 right-0 bottom-4 mx-auto w-11/12 max-w-md glass-panel animate-slide-in">
          <h3 className="text-lg font-bold mb-2">Tag This Location</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Location Name</label>
              <Input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="e.g. My Car, Favorite Food Stall"
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Location Type</label>
              <RadioGroup defaultValue="car" value={newTagType} onValueChange={(value) => setNewTagType(value as any)}>
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="car" id="car" />
                    <Label htmlFor="car">Car</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="shop" id="shop" />
                    <Label htmlFor="shop">Shop/Vendor</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="custom" />
                    <Label htmlFor="custom">Other</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
            
            <div className="flex space-x-2">
              <Button onClick={() => {
                setShowTagForm(false);
                if (marker.current) {
                  marker.current.remove();
                  marker.current = null;
                }
              }} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button onClick={saveTaggedLocation} className="flex-1 btn-primary">
                Save Location
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapComponent;
