
import { Industry } from '@/components/IndustryCard';

export const mockIndustries: Industry[] = [
  { 
    name: 'Plumbing', 
    rating: 4.8, 
    businessCount: 45, 
    location: 'Downtown Area',
    challenges: ['Missed emergency calls after hours', 'Delayed quote follow-ups', 'High utility & dispatch costs']
  },
  { 
    name: 'Real Estate', 
    rating: 4.5, 
    businessCount: 78, 
    location: 'Business District',
    challenges: ['Slow speed-to-lead on portal inquiries', 'Inconsistent buyer/seller nurture', 'Outbound prospecting consistency']
  },
  { 
    name: 'Landscaping', 
    rating: 5.0, 
    businessCount: 32, 
    location: 'Suburban Zone',
    challenges: ['Seasonal revenue fluctuations', 'Labor scheduling & dispatch', 'Slow estimate turnaround']
  },
  { 
    name: 'HVAC Services', 
    rating: 4.9, 
    businessCount: 28, 
    location: 'Industrial Area',
    challenges: ['After-hours emergency call overload', 'Maintenance contract retention', 'Rising commercial energy & shop bills']
  },
  { 
    name: 'Roofing', 
    rating: 4.2, 
    businessCount: 19, 
    location: 'Residential District',
    challenges: ['Storm-damage lead response time', 'Insurance estimate delays', 'Local Google search competition']
  },
  { 
    name: 'Auto Repair', 
    rating: 4.7, 
    businessCount: 56, 
    location: 'Commercial Strip',
    challenges: ['Missed phone estimates while servicing cars', 'Customer maintenance recall drop-off', 'High shop electric/compressor bills']
  },
  { 
    name: 'Electrical', 
    rating: 4.6, 
    businessCount: 41, 
    location: 'Tech Quarter',
    challenges: ['Commercial bidding bottlenecks', 'Unanswered after-hours emergency calls', 'Field-to-office communication']
  },
  { 
    name: 'Pest Control', 
    rating: 4.3, 
    businessCount: 23, 
    location: 'City Center',
    challenges: ['Recurring subscription churn', 'Missed seasonal service inquiries', 'Customer review accumulation']
  },
  { 
    name: 'Cleaning Services', 
    rating: 4.8, 
    businessCount: 67, 
    location: 'Metro Area',
    challenges: ['High staff turnover & onboarding', 'Commercial account retention', 'Missed booking calls']
  },
  { 
    name: 'Construction', 
    rating: 4.4, 
    businessCount: 34, 
    location: 'Development Zone',
    challenges: ['Commercial project bidding timelines', 'Material & subcontractor coordination', 'Outbound commercial prospecting']
  },
  { 
    name: 'Handyman Services', 
    rating: 4.7, 
    businessCount: 52, 
    location: 'Neighborhood Hub',
    challenges: ['Phone quote delays while on jobs', 'Job dispatch and route efficiency', 'Local map ranking visibility']
  },
  { 
    name: 'Tree Services', 
    rating: 4.5, 
    businessCount: 15, 
    location: 'Green District',
    challenges: ['Emergency storm call handling', 'High equipment & insurance overhead', 'Post-job review collection']
  },
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
