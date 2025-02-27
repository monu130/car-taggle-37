
import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Trash2, Car, Store, MapPinOff } from 'lucide-react';
import MapComponent from '@/components/MapComponent';
import MapService, { TaggedLocation } from '@/services/MapService';
import TokenInput from '@/components/TokenInput';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const Index = () => {
  const [savedLocations, setSavedLocations] = useState<TaggedLocation[]>([]);
  const [showLocationsList, setShowLocationsList] = useState<boolean>(false);
  const [hasToken, setHasToken] = useState<boolean>(false);
  
  useEffect(() => {
    // Check if mapbox token exists
    setHasToken(MapService.hasMapboxToken());
    
    // Load saved locations
    const locations = MapService.getTaggedLocations();
    setSavedLocations(locations);
  }, []);
  
  // Refresh the locations list
  const refreshLocations = () => {
    const locations = MapService.getTaggedLocations();
    setSavedLocations(locations);
  };
  
  // Delete a location
  const deleteLocation = (id: string) => {
    MapService.deleteTaggedLocation(id);
    refreshLocations();
    toast('Location deleted successfully!');
  };
  
  // Clear all locations
  const clearAllLocations = () => {
    if (confirm('Are you sure you want to delete all saved locations?')) {
      MapService.clearTaggedLocations();
      refreshLocations();
      toast('All locations cleared!');
    }
  };
  
  // Handle token saved
  const handleTokenSaved = () => {
    setHasToken(true);
  };
  
  // Get location type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'car':
        return <Car className="w-5 h-5" />;
      case 'shop':
        return <Store className="w-5 h-5" />;
      default:
        return <MapPin className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-app-blue/10">
      {/* Header */}
      <header className="px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-app-yellow rounded-full p-2 shadow-md">
            <MapPin className="w-6 h-6 text-black" />
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-app-purple to-app-pink">
            SpotTag
          </h1>
        </div>
        
        {hasToken && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => {
                setShowLocationsList(!showLocationsList);
                refreshLocations();
              }}
            >
              {showLocationsList ? <MapPinOff className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
              {showLocationsList ? 'Hide Saved' : 'Saved Spots'}
            </Button>
          </div>
        )}
      </header>
      
      {/* Main content */}
      <main className="container px-4 py-2 mx-auto">
        {/* Intro section */}
        <section className="mb-6">
          <div className="glass-panel text-center animate-fade-in">
            <h2 className="text-xl font-bold mb-2">Never Lose Your Spot Again!</h2>
            <p className="text-gray-700">
              Tag your car location, favorite street vendors, or any spot you want to remember.
            </p>
          </div>
        </section>
        
        {/* Token input or map section */}
        {!hasToken ? (
          <section className="mb-6">
            <TokenInput onTokenSaved={handleTokenSaved} />
          </section>
        ) : (
          <>
            {/* Map section */}
            <section className="mb-6">
              <MapComponent />
            </section>
            
            {/* Saved locations list */}
            {showLocationsList && (
              <section className="mb-6 animate-fade-in">
                <div className="glass-panel">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Your Saved Locations</h2>
                    {savedLocations.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 flex items-center gap-1"
                        onClick={clearAllLocations}
                      >
                        <Trash2 className="w-4 h-4" />
                        Clear All
                      </Button>
                    )}
                  </div>
                  
                  {savedLocations.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-gray-500">You don't have any saved locations yet.</p>
                      <p className="text-gray-500 mt-2">
                        Tap the <span className="text-app-pink font-bold">+</span> button to add your first location!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {savedLocations.map((location) => (
                        <div key={location.id} className="card hover:scale-[1.01] transition-all duration-200">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <div className="rounded-full p-2 bg-gray-100 shadow-sm">
                                {getTypeIcon(location.type)}
                              </div>
                              <div>
                                <h3 className="font-semibold">{location.name}</h3>
                                <p className="text-xs text-gray-500">
                                  {new Date(location.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <button
                                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                                onClick={() => {
                                  // Copy coordinates to clipboard
                                  navigator.clipboard.writeText(
                                    `${location.latitude},${location.longitude}`
                                  );
                                  toast('Coordinates copied to clipboard!');
                                }}
                                title="Copy coordinates"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                              </button>
                              <button
                                className="p-1 rounded-full hover:bg-red-50 text-red-500 transition-colors"
                                onClick={() => deleteLocation(location.id)}
                                title="Delete location"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 mt-3">
                            <div className="tag-chip">
                              <span className="text-xs">
                                {location.type.charAt(0).toUpperCase() + location.type.slice(1)}
                              </span>
                            </div>
                            <div className="tag-chip">
                              <Navigation className="w-3 h-3" />
                              <span className="text-xs">Lat: {location.latitude.toFixed(4)}</span>
                            </div>
                            <div className="tag-chip">
                              <Navigation className="w-3 h-3" />
                              <span className="text-xs">Lng: {location.longitude.toFixed(4)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}
          </>
        )}
        
        {/* How to use section */}
        <section className="mb-8">
          <div className="glass-panel animate-fade-in">
            <h2 className="text-xl font-bold mb-4 text-center">How to Use</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card text-center">
                <div className="bg-app-yellow/20 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                  <MapPin className="w-6 h-6 text-app-yellow" />
                </div>
                <h3 className="font-bold">Tag Location</h3>
                <p className="text-sm text-gray-600">
                  Tap the pink button and click on the map to tag your car or favorite shop.
                </p>
              </div>
              
              <div className="card text-center">
                <div className="bg-app-blue/20 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                  <Navigation className="w-6 h-6 text-app-blue" />
                </div>
                <h3 className="font-bold">Navigate</h3>
                <p className="text-sm text-gray-600">
                  Click on any saved location to get navigation from your current position.
                </p>
              </div>
              
              <div className="card text-center">
                <div className="bg-app-purple/20 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-app-purple">
                    <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"></path>
                    <path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4"></path>
                    <path d="M9 3v18"></path>
                  </svg>
                </div>
                <h3 className="font-bold">View Saved</h3>
                <p className="text-sm text-gray-600">
                  Access all your saved locations anytime, anywhere - even offline!
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="py-4 text-center text-sm text-gray-500">
        <p>SpotTag - Never lose your spot again!</p>
      </footer>
    </div>
  );
};

export default Index;
