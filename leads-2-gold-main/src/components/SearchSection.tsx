
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, RefreshCw } from 'lucide-react';

interface SearchSectionProps {
  onSearch: (searchTerm: string, count?: number) => void;
  searchTerm?: string;
  onLocationChange?: (location: string) => void;
  location?: string;
  onRefreshLocation?: () => void;
}

const COMMON_LOCATIONS = [
  { value: 'detect', label: '📍 Detect My Location' },
  { value: 'custom', label: '✏️ Enter Custom Location' },
  { value: 'Austin, TX', label: 'Austin, TX' },
  { value: 'Houston, TX', label: 'Houston, TX' },
  { value: 'Dallas, TX', label: 'Dallas, TX' },
  { value: 'San Antonio, TX', label: 'San Antonio, TX' },
  { value: 'Fort Worth, TX', label: 'Fort Worth, TX' },
  { value: 'Los Angeles, CA', label: 'Los Angeles, CA' },
  { value: 'San Francisco, CA', label: 'San Francisco, CA' },
  { value: 'New York, NY', label: 'New York, NY' },
  { value: 'Chicago, IL', label: 'Chicago, IL' },
  { value: 'Miami, FL', label: 'Miami, FL' },
  { value: 'Seattle, WA', label: 'Seattle, WA' },
  { value: 'Denver, CO', label: 'Denver, CO' },
  { value: 'Phoenix, AZ', label: 'Phoenix, AZ' },
  { value: 'Atlanta, GA', label: 'Atlanta, GA' },
  { value: 'Boston, MA', label: 'Boston, MA' },
];

const SearchSection = ({ 
  onSearch, 
  searchTerm: externalSearchTerm, 
  onLocationChange, 
  location: externalLocation,
  onRefreshLocation 
}: SearchSectionProps) => {
  const [searchTerm, setSearchTerm] = useState(externalSearchTerm || '');
  const [locationTerm, setLocationTerm] = useState(externalLocation || '');
  const [selectedCount, setSelectedCount] = useState<number>(50);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [selectValue, setSelectValue] = useState<string>('');

  useEffect(() => {
    setSearchTerm(externalSearchTerm || '');
  }, [externalSearchTerm]);

  useEffect(() => {
    setLocationTerm(externalLocation || '');
    // Check if external location matches a preset
    const preset = COMMON_LOCATIONS.find(loc => loc.value === externalLocation);
    if (preset && preset.value !== 'detect' && preset.value !== 'custom') {
      setSelectValue(externalLocation || '');
      setShowCustomInput(false);
    } else if (externalLocation && externalLocation !== 'Your Area') {
      setShowCustomInput(true);
      setSelectValue('custom');
    }
  }, [externalLocation]);

  const handleSearch = () => {
    onSearch(searchTerm, selectedCount);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Trigger search on empty input to show all results
    if (value === '') {
      onSearch('');
    }
  };

  const handleLocationSelect = (value: string) => {
    setSelectValue(value);
    
    if (value === 'detect') {
      // Trigger location detection
      setShowCustomInput(false);
      onRefreshLocation?.();
    } else if (value === 'custom') {
      setShowCustomInput(true);
      setLocationTerm('');
    } else {
      setShowCustomInput(false);
      setLocationTerm(value);
      onLocationChange?.(value);
    }
  };

  const handleCustomLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocationTerm(value);
    onLocationChange?.(value);
  };

  return (
    <div className="bg-dust/80 backdrop-blur-sm p-6 sm:p-10 rounded-xl shadow-western border-4 border-leather w-full max-w-2xl text-center">
      <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-leather">
        Search for Your Motherlode
      </h2>
      
      <div className="flex flex-col gap-3">
        <Input
          type="text"
          placeholder="Search by industry or business (e.g., 'plumbing', 'real estate', 'Starbucks')"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          className="w-full text-lg font-body border-2 border-leather/30 focus:border-gold bg-white"
        />
        
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <Select value={selectValue} onValueChange={handleLocationSelect}>
              <SelectTrigger className="w-full text-left border-2 border-leather/30 focus:border-gold bg-white">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-leather/60" />
                  <SelectValue placeholder="Select a location" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {COMMON_LOCATIONS.map((loc) => (
                  <SelectItem key={loc.value} value={loc.value}>
                    {loc.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {showCustomInput && (
            <Input
              type="text"
              placeholder="City, State, or ZIP"
              value={locationTerm}
              onChange={handleCustomLocationChange}
              onKeyPress={handleKeyPress}
              className="flex-1 text-lg font-body border-2 border-leather/30 focus:border-gold bg-white"
            />
          )}
          
          {locationTerm && !showCustomInput && (
            <Button
              variant="outline"
              size="icon"
              onClick={onRefreshLocation}
              title="Refresh location"
              className="border-2 border-leather/30"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {locationTerm && (
          <p className="text-sm text-leather/70 flex items-center justify-center gap-1">
            <MapPin className="h-3 w-3" />
            Searching within 100 miles of <strong>{locationTerm}</strong>
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="flex gap-2">
          {[20, 50, 100].map((count) => (
            <Button
              key={count}
              variant={selectedCount === count ? 'rust' : 'outline'}
              onClick={() => setSelectedCount(count)}
            >
              {count}
            </Button>
          ))}
        </div>
        <Button 
          variant="rust" 
          onClick={handleSearch}
          className="text-lg px-6 sm:ml-auto"
        >
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
      </div>
      
      <p className="mt-4 text-sm text-leather/70">
        Or discover new prospects in your area below.
      </p>
    </div>
  );
};

export default SearchSection;
