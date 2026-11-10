
import { Industry } from '@/components/IndustryCard';

export const mockIndustries: Industry[] = [
  { name: 'Plumbing', rating: 4.8, businessCount: 45, location: 'Downtown Area' },
  { name: 'Real Estate', rating: 4.5, businessCount: 78, location: 'Business District' },
  { name: 'Landscaping', rating: 5.0, businessCount: 32, location: 'Suburban Zone' },
  { name: 'HVAC Services', rating: 4.9, businessCount: 28, location: 'Industrial Area' },
  { name: 'Roofing', rating: 4.2, businessCount: 19, location: 'Residential District' },
  { name: 'Auto Repair', rating: 4.7, businessCount: 56, location: 'Commercial Strip' },
  { name: 'Electrical', rating: 4.6, businessCount: 41, location: 'Tech Quarter' },
  { name: 'Pest Control', rating: 4.3, businessCount: 23, location: 'City Center' },
  { name: 'Cleaning Services', rating: 4.8, businessCount: 67, location: 'Metro Area' },
  { name: 'Construction', rating: 4.4, businessCount: 34, location: 'Development Zone' },
  { name: 'Handyman Services', rating: 4.7, businessCount: 52, location: 'Neighborhood Hub' },
  { name: 'Tree Services', rating: 4.5, businessCount: 15, location: 'Green District' },
];

// Sort industries based on criteria: by rating first, then by business count
export const sortIndustries = (industries: Industry[]): Industry[] => {
  return [...industries].sort((a, b) => {
    // 1. Sort by Google rating (descending)
    if (b.rating !== a.rating) return b.rating - a.rating;

    // 2. Sort by number of businesses (descending)
    return b.businessCount - a.businessCount;
  });
};

// Filter industries based on search term
export const filterIndustries = (industries: Industry[], searchTerm: string): Industry[] => {
  if (!searchTerm.trim()) return industries;
  
  return industries.filter(industry => 
    industry.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
};

// Generate location-based industries (simulates geolocation-based results)
export const generateLocationBasedIndustries = (userLocation?: string): Industry[] => {
  const locations = [
    'Near You', 'Your Area', 'Local District', 'Nearby Zone', 
    'City Center', 'Business District', 'Metro Area', 'Downtown'
  ];
  
  return mockIndustries.map(industry => ({
    ...industry,
    location: userLocation || locations[Math.floor(Math.random() * locations.length)]
  }));
};
