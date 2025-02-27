
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import MapService from '@/services/MapService';

interface TokenInputProps {
  onTokenSaved: () => void;
}

const TokenInput: React.FC<TokenInputProps> = ({ onTokenSaved }) => {
  const [token, setToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const saveToken = () => {
    if (!token.trim()) {
      toast.error('Please enter a valid Mapbox token');
      return;
    }

    setIsLoading(true);

    // Simple token format validation
    if (!token.startsWith('pk.')) {
      toast.error('The token does not appear to be a valid Mapbox public token. It should start with "pk."');
      setIsLoading(false);
      return;
    }

    try {
      // Save token to service
      MapService.setMapboxToken(token);
      
      // Show success message
      toast.success('Mapbox token saved successfully!');
      
      // Invoke callback
      onTokenSaved();
    } catch (error) {
      console.error('Error saving token:', error);
      toast.error('Failed to save the token');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel max-w-lg mx-auto animate-fade-in">
      <h2 className="text-xl font-bold mb-4">Enter Your Mapbox Token</h2>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          To use the map features, you need to provide your Mapbox public token.
          You can get one for free by creating an account at{' '}
          <a 
            href="https://www.mapbox.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-app-blue hover:underline"
          >
            mapbox.com
          </a>
        </p>
        <p className="text-sm text-gray-600 mb-4">
          Your token will be stored locally in your browser and is not sent to our servers.
        </p>
      </div>
      
      <div className="space-y-4">
        <Input
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Enter your Mapbox public token (starts with pk.)"
          className="w-full"
        />
        
        <Button 
          onClick={saveToken} 
          disabled={isLoading} 
          className="w-full btn-primary"
        >
          {isLoading ? 'Saving...' : 'Save Token & Continue'}
        </Button>
      </div>
    </div>
  );
};

export default TokenInput;
