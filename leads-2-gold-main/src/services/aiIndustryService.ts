
import { supabase } from '@/integrations/supabase/client';
import { Industry } from '@/components/IndustryCard';

export const generateAIIndustries = async (searchTerm: string, location: string, count: number = 10): Promise<Industry[]> => {
  try {
    console.log('Generating AI industries for:', searchTerm, 'in', location, 'count:', count);
    
    // Always call the edge function for AI-powered results with insights
    const { data, error } = await supabase.functions.invoke('generate-industries', {
      body: { searchTerm, location, count }
    });

    if (error) {
      console.error('Error calling generate-industries function:', error);
      throw error;
    }

    const industries = data?.industries || [];
    console.log('AI generated industries:', industries);
    if (!industries.length) {
      console.warn('No industries returned from AI, using fallback list');
      return getFallbackIndustries(searchTerm, location, count);
    }
    return industries.slice(0, count);
  } catch (error) {
    console.error('Error generating AI industries:', error);
    // Return fallback industries if AI fails
    return getFallbackIndustries(searchTerm, location, count);
  }
};

const getFallbackIndustries = (searchTerm: string, location: string, count: number = 10): Industry[] => {
  const fallbackIndustries = [
    { 
      name: 'Advanced Manufacturing', 
      rating: 4.5, 
      businessCount: 120, 
      location: location || 'Local Area' 
    },
    { 
      name: 'Aerospace Vehicles, Aircraft, and Defense', 
      rating: 4.6, 
      businessCount: 80, 
      location: location || 'Local Area' 
    },
    { 
      name: 'Automotive', 
      rating: 4.4, 
      businessCount: 95, 
      location: location || 'Local Area' 
    },
    { 
      name: 'Computers, Electronics, and Semiconductors', 
      rating: 4.5, 
      businessCount: 110, 
      location: location || 'Local Area' 
    },
    { 
      name: 'Production Technology and Heavy Machinery', 
      rating: 4.3, 
      businessCount: 70, 
      location: location || 'Local Area' 
    },

    { 
      name: 'Energy Evolution', 
      rating: 4.6, 
      businessCount: 130, 
      location: location || 'Local Area' 
    },
    { 
      name: 'Electric Power Generation and Transmission', 
      rating: 4.4, 
      businessCount: 85, 
      location: location || 'Local Area' 
    },
    { 
      name: 'Oil and Gas Extraction, Production, and Transportation', 
      rating: 4.5, 
      businessCount: 140, 
      location: location || 'Local Area' 
    },
    { 
      name: 'Renewables', 
      rating: 4.7, 
      businessCount: 75, 
      location: location || 'Local Area' 
    },

    { 
      name: 'Food and Livestock Products', 
      rating: 4.3, 
      businessCount: 90, 
      location: location || 'Local Area' 
    },
    { 
      name: 'Food Processing', 
      rating: 4.2, 
      businessCount: 65, 
      location: location || 'Local Area' 
    },
    { 
      name: 'Livestock Processing', 
      rating: 4.1, 
      businessCount: 55, 
      location: location || 'Local Area' 
    },

    { 
      name: 'Hospitality, Tourism and Culture', 
      rating: 4.4, 
      businessCount: 150, 
      location: location || 'Local Area' 
    },
    { 
      name: 'Film, Music, and Culture', 
      rating: 4.3, 
      businessCount: 60, 
      location: location || 'Local Area' 
    },
    { 
      name: 'Hospitality and Tourism', 
      rating: 4.5, 
      businessCount: 145, 
      location: location || 'Local Area' 
    },

    { 
      name: 'Information Technology', 
      rating: 4.6, 
      businessCount: 160, 
      location: location || 'Local Area' 
    },
    { 
      name: 'Information Technology and Artificial Intelligence', 
      rating: 4.7, 
      businessCount: 120, 
      location: location || 'Local Area' 
    },

    { 
      name: 'Life Sciences and Biotechnology', 
      rating: 4.6, 
      businessCount: 100, 
      location: location || 'Local Area' 
    },
    { 
      name: 'Biotechnology, Pharmaceutical, and Medical Devices', 
      rating: 4.6, 
      businessCount: 95, 
      location: location || 'Local Area' 
    },
    { 
      name: 'Agricultural Science and Technology', 
      rating: 4.2, 
      businessCount: 80, 
      location: location || 'Local Area' 
    },

    { 
      name: 'Petroleum Refining and Chemicals', 
      rating: 4.5, 
      businessCount: 135, 
      location: location || 'Local Area' 
    },
    { 
      name: 'Industrial Chemical Products', 
      rating: 4.3, 
      businessCount: 90, 
      location: location || 'Local Area' 
    },
    { 
      name: 'Petroleum Refining', 
      rating: 4.4, 
      businessCount: 110, 
      location: location || 'Local Area' 
    },
    { 
      name: 'Plastics', 
      rating: 4.2, 
      businessCount: 85, 
      location: location || 'Local Area' 
    },

    { 
      name: 'Professional Services and Corporate Operations', 
      rating: 4.5, 
      businessCount: 170, 
      location: location || 'Local Area' 
    },
    { 
      name: 'Business Services and Corporate Headquarters', 
      rating: 4.4, 
      businessCount: 140, 
      location: location || 'Local Area' 
    },
    { 
      name: 'Financial Services', 
      rating: 4.5, 
      businessCount: 120, 
      location: location || 'Local Area' 
    },

    { 
      name: 'Rare Earth Elements and Mineral Mining', 
      rating: 4.1, 
      businessCount: 60, 
      location: location || 'Local Area' 
    },
    { 
      name: 'Metal Mining', 
      rating: 4.0, 
      businessCount: 45, 
      location: location || 'Local Area' 
    },
    { 
      name: 'Nonmetal Mining', 
      rating: 4.0, 
      businessCount: 50, 
      location: location || 'Local Area' 
    },

    { 
      name: 'Transportation and Logistics', 
      rating: 4.5, 
      businessCount: 155, 
      location: location || 'Local Area' 
    },
    { 
      name: 'Distribution and E-Commerce', 
      rating: 4.3, 
      businessCount: 115, 
      location: location || 'Local Area' 
    },
    { 
      name: 'Transportation and Aviation Services', 
      rating: 4.4, 
      businessCount: 100, 
      location: location || 'Local Area' 
    },

    // Additional common labels from the site section for discoverability
    { 
      name: 'Aerospace, Aviation & Defense', 
      rating: 4.6, 
      businessCount: 90, 
      location: location || 'Local Area' 
    },
    { 
      name: 'Biotechnology & Life Sciences', 
      rating: 4.6, 
      businessCount: 100, 
      location: location || 'Local Area' 
    },
    { 
      name: 'Corporate Services', 
      rating: 4.4, 
      businessCount: 130, 
      location: location || 'Local Area' 
    },
    { 
      name: 'Energy', 
      rating: 4.7, 
      businessCount: 180, 
      location: location || 'Local Area' 
    },
    { 
      name: 'Semiconductors', 
      rating: 4.5, 
      businessCount: 105, 
      location: location || 'Local Area' 
    },
    { 
      name: 'Creative Industries', 
      rating: 4.2, 
      businessCount: 70, 
      location: location || 'Local Area' 
    },
    { name: 'Pottery Classes', rating: 4.3, businessCount: 30, location: location || 'Local Area' },
    { name: 'Painting & Crafting Classes', rating: 4.2, businessCount: 40, location: location || 'Local Area' },
    { name: 'Etiquette Classes', rating: 4.0, businessCount: 20, location: location || 'Local Area' },
    { name: 'Mobile Pet Grooming', rating: 4.5, businessCount: 60, location: location || 'Local Area' },
    { name: 'Mobile Mechanic', rating: 4.4, businessCount: 50, location: location || 'Local Area' },
    { name: 'Bookkeeping Services', rating: 4.6, businessCount: 80, location: location || 'Local Area' },
    { name: 'Event Photography', rating: 4.5, businessCount: 45, location: location || 'Local Area' },
    { name: 'Wedding Planning', rating: 4.4, businessCount: 35, location: location || 'Local Area' },
    { name: 'IT Support', rating: 4.6, businessCount: 90, location: location || 'Local Area' },
    { name: 'Financial Planning', rating: 4.6, businessCount: 70, location: location || 'Local Area' },
    { name: 'Insurance Broker', rating: 4.5, businessCount: 65, location: location || 'Local Area' },
    { name: 'Real Estate Agent', rating: 4.5, businessCount: 150, location: location || 'Local Area' },
    { name: 'Travel Agent', rating: 4.2, businessCount: 25, location: location || 'Local Area' },
    { name: 'Event Bartending', rating: 4.3, businessCount: 25, location: location || 'Local Area' }
  ];

  // Append user-provided additional industries (deduped)
  const additionalIndustryNames = [
    'Automotive','Aerospace','Chemicals','Pharmaceuticals','Food & Beverage','Textiles','Electronics','Machinery','Metals','Plastics','Lumber','Paper','Furniture','Appliances','Construction Materials','Footwear','Jewelry','Sporting Goods','Toys','Musical Instruments','Biotechnology','Semiconductor','Computer Hardware','Telecommunications Equipment','Medical Equipment','Renewable Energy Equipment','Oil and Gas Extraction','Mining','Steel Production',
    'Banking','Insurance','Financial Services','Real Estate','Retail','Restaurants','Hotels','Transportation (Airlines, Trucking, Shipping)','Logistics','Healthcare','Education','IT Services','Software Development','Consulting','Legal Services','Accounting','Advertising','Marketing','Public Relations','Entertainment (Movies, Music, TV)','Sports','Tourism','Broadcasting','Telecommunications','Utilities (Electricity, Gas, Water)','Waste Management','Security Services','Repair Services','Maintenance Services','Event Planning','Recruiting','Human Resources','Management Consulting','Engineering & Design','Architecture','Construction','Government Services','Non-profit Organizations','Religious Organizations','Research & Development','Veterinary Services','Personal Care Services (Hair Salons, Spas)','Laundry Services','Funeral Services','Gambling',
    'Farming','Fishing','Forestry','Livestock','Dairy Farming','Poultry Farming','Vineyards','Orchards','Seafood Processing','Renewable Energy (Solar, Wind, Hydro)','Alternative Energy (Fuel Cells, Biofuels)','Forestry Products',
    'Conglomerates (Companies with diverse holdings)','Holding Companies','Investment Funds','Venture Capital','Private Equity','Real Estate Investment Trusts (REITs)','Trading Companies','Supply Chain Management','E-commerce','Social Media','Cybersecurity','Artificial Intelligence','Blockchain Technology','Nanotechnology'
  ];
  for (const name of additionalIndustryNames) {
    if (!fallbackIndustries.some(i => i.name.toLowerCase() === name.toLowerCase())) {
      fallbackIndustries.push({ name, rating: 4.4, businessCount: 60, location: location || 'Local Area' });
    }
  }
  
  // If there's a search term, filter relevant industries
  if (searchTerm.trim()) {
    const searchLower = searchTerm.toLowerCase();
    const relevant = fallbackIndustries.filter(industry => 
      industry.name.toLowerCase().includes(searchLower)
    );
    if (relevant.length > 0) return relevant;

    // Add a custom industry based on search term
    return [
      { name: `${searchTerm} Services`, rating: 4.5, businessCount: 35, location: location || 'Local Area' },
      { name: `${searchTerm} Solutions`, rating: 4.3, businessCount: 28, location: location || 'Local Area' },
      ...fallbackIndustries.slice(0, 6)
    ];
  }

  // No search term: return a randomized sample based on count
  const sampleSize = Math.min(count, fallbackIndustries.length);
  const shuffled = [...fallbackIndustries].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, sampleSize);
};
