
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import SearchSection from "@/components/SearchSection";
import IndustriesGrid from "@/components/IndustriesGrid";
import { IndustryInsights } from "@/components/IndustryInsights";
import { LeadsManager } from "@/components/LeadsManager";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Industry } from "@/components/IndustryCard";
import { generateAIIndustries } from "@/services/aiIndustryService";
import { getCurrentLocation } from "@/services/locationService";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { SubscriptionPaywall } from "@/components/SubscriptionPaywall";
import { useSearchLimit } from "@/hooks/useSearchLimit";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const { isSubscribed, isAdmin, checkSubscription } = useSubscriptionStatus();
  const { canSearch, hasReachedLimit, remainingSearches, incrementSearchCount } = useSearchLimit();
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);
  const [showLeadsManager, setShowLeadsManager] = useState(false);
  const [searchLocation, setSearchLocation] = useState("");
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [autoGenerateCount, setAutoGenerateCount] = useState<number | null>(null);

  // Handle checkout success/cancel
  useEffect(() => {
    const checkout = searchParams.get('checkout');
    if (checkout === 'success') {
      toast.success('Subscription activated! Refreshing...');
      checkSubscription();
    } else if (checkout === 'cancel') {
      toast.info('Checkout cancelled.');
    }
  }, [searchParams, checkSubscription]);

  const loadIndustriesForLocation = useCallback(async (location: string) => {
    setIsLoading(true);
    try {
      console.log('Loading industries for location:', location);
      const defaultIndustries = await generateAIIndustries('', location, 30);
      setIndustries(defaultIndustries);
      console.log('Industries loaded:', defaultIndustries);
    } catch (error) {
      console.error('Error loading industries:', error);
      toast.error('Failed to load industries. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const detectAndLoadLocation = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('Detecting location...');
      const loc = await getCurrentLocation();
      const locationLabel = [loc.city, loc.state].filter(Boolean).join(', ');
      setSearchLocation(locationLabel);
      toast.success(`Location detected: ${locationLabel}`);
      await loadIndustriesForLocation(locationLabel);
    } catch (locErr) {
      console.warn('Using fallback location due to geolocation issue:', locErr);
      setSearchLocation('Your Area');
      toast.info('Could not detect location. Using default area.');
      await loadIndustriesForLocation('Your Area');
    }
  }, [loadIndustriesForLocation]);

  // Load default industries on component mount
  useEffect(() => {
    detectAndLoadLocation();
  }, [detectAndLoadLocation]);

  const handleLocationChange = async (newLocation: string) => {
    setSearchLocation(newLocation);
    if (newLocation && newLocation !== searchLocation) {
      await loadIndustriesForLocation(newLocation);
    }
  };

  const handleRefreshLocation = () => {
    detectAndLoadLocation();
  };

  const handleSearch = async (term: string, count?: number) => {
    // Gate: require authentication
    if (!isAuthenticated) {
      setShowPaywall(true);
      return;
    }

    // Gate: check search limits for non-subscribers
    if (!canSearch) {
      setShowPaywall(true);
      return;
    }

    console.log('Searching for:', term, 'count:', count);
    setSearchTerm(term);
    incrementSearchCount();

    // If user selected 20/50/100, jump straight to LeadsManager and auto-generate
    if (count) {
      setAutoGenerateCount(count);
      setSelectedIndustry(null);
      setShowLeadsManager(true);
      return;
    }

    setIsLoading(true);
    try {
      const results = await generateAIIndustries(term, searchLocation || 'Your Area', 30);
      setIndustries(results);
      console.log('Search results:', results);
    } catch (error) {
      console.error('Error searching industries:', error);
      setIndustries([]);
      toast.error('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchIndustry = (industryName: string) => {
    console.log('Searching industry:', industryName);
    // Find the industry from the current list
    const industry = industries.find(ind => ind.name === industryName);
    if (industry) {
      setSelectedIndustry(industry);
    }
  };

  const handleIndustrySelect = (industry: Industry) => {
    console.log('Industry selected:', industry);
    setSelectedIndustry(industry);
  };

  const handleShowLeads = (industry: Industry, location: string) => {
    console.log('Showing leads for:', industry, 'in', location);
    setSelectedIndustry(industry);
    setSearchLocation(location);
    setShowLeadsManager(true);
  };

  const handleBackToSearch = () => {
    setSelectedIndustry(null);
    setShowLeadsManager(false);
  };

  const handleBackToInsights = () => {
    setShowLeadsManager(false);
    setAutoGenerateCount(null);
  };

  if (showLeadsManager && (selectedIndustry || searchTerm)) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <LeadsManager 
            industryName={selectedIndustry?.name || searchTerm}
            location={searchLocation}
            onBack={handleBackToInsights}
            autoGenerate={autoGenerateCount != null}
            initialCount={autoGenerateCount ?? undefined}
          />
        </main>
        <Footer />
      </div>
    );
  }

  if (selectedIndustry) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <IndustryInsights 
            industry={selectedIndustry} 
            location={searchLocation}
            onBack={handleBackToSearch}
            onShowLeads={handleShowLeads}
          />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8 space-y-12">
        <SearchSection 
          onSearch={handleSearch} 
          searchTerm={searchTerm} 
          location={searchLocation} 
          onLocationChange={handleLocationChange}
          onRefreshLocation={handleRefreshLocation}
        />
        {isLoading ? (
          <div className="w-full max-w-4xl text-center p-8">
            <p className="text-leather/70 text-lg">
              🤖 Generating industries with insights...
            </p>
          </div>
        ) : (
          <IndustriesGrid industries={industries} onSearchIndustry={handleSearchIndustry} />
        )}
      </main>
      <Footer />
      {showPaywall && (
        <SubscriptionPaywall 
          remainingSearches={remainingSearches}
          onClose={() => setShowPaywall(false)} 
        />
      )}
    </div>
  );
};

export default Index;
