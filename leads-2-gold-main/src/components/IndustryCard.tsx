import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Building, Lightbulb, AlertTriangle, Target, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface Industry {
  name: string;
  rating: number;
  businessCount: number;
  location: string;
  businessSize?: 'large' | 'medium' | 'small';
  challenges?: string[];
  strategicRecommendations?: string[];
}

interface IndustryCardProps {
  industry: Industry;
  onSearchIndustry: (industryName: string) => void;
}

const IndustryCard = ({ industry, onSearchIndustry }: IndustryCardProps) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const handleSearchClick = () => {
    onSearchIndustry(industry.name);
  };

  // Get badge color based on business size
  const getSizeBadgeVariant = (size?: string) => {
    switch (size) {
      case 'large': return 'default';
      case 'medium': return 'secondary';
      case 'small': return 'outline';
      default: return 'secondary';
    }
  };

  const getSizeLabel = (size?: string) => {
    switch (size) {
      case 'large': return 'Enterprise';
      case 'medium': return 'Mid-Market';
      case 'small': return 'Local';
      default: return 'Various';
    }
  };

  // AI-generated product/service suggestions based on industry (fallback for known industries)
  const getIndustrySuggestions = (industryName: string): string[] => {
    const suggestions: { [key: string]: string[] } = {
      'Plumbing': ['AIBizPro GoHighLevel CRM', 'AIBizPro Voice Agents', 'CDMWeb.store SEO'],
      'Real Estate': ['AIBizPro GoHighLevel CRM', 'AIBizPro Smart Websites', 'CDMWeb.store'],
      'Landscaping': ['AIBizPro GoHighLevel CRM', 'AIBizPro Voice Agents', 'EnergyChoice.us'],
      'HVAC Services': ['EnergyChoice.us', 'AIBizPro GoHighLevel CRM', 'AIBizPro Voice Agents'],
      'Roofing': ['AIBizPro GoHighLevel CRM', 'AIBizPro Smart Websites', 'CDMWeb.store'],
      'Auto Repair': ['AIBizPro GoHighLevel CRM', 'AIBizPro Voice Agents', 'AIBizPro Reputation Management'],
      'Electrical': ['EnergyChoice.us', 'AIBizPro GoHighLevel CRM', 'AIBizPro Voice Agents'],
      'Pest Control': ['AIBizPro GoHighLevel CRM', 'AIBizPro Voice Agents', 'AIBizPro Smart Websites'],
      'Cleaning Services': ['AIBizPro GoHighLevel CRM', 'AIBizPro Voice Agents', 'AIBizPro Virtual AI Agents'],
      'Construction': ['AIBizPro GoHighLevel CRM', 'AIBizPro Voice Agents', 'play44recruiting.site'],
      'Handyman Services': ['AIBizPro GoHighLevel CRM', 'AIBizPro Voice Agents', 'agentdunn.cdmweb.store'],
      'Tree Services': ['AIBizPro GoHighLevel CRM', 'AIBizPro Voice Agents', 'EnergyChoice.us']
    };
    
    return suggestions[industryName] || [];
  };

  useEffect(() => {
    // Use predefined suggestions or default - no AI calls on initial page load
    const predefinedSuggestions = getIndustrySuggestions(industry.name);
    
    if (predefinedSuggestions.length > 0) {
      setSuggestions(predefinedSuggestions);
    } else {
      // Use static defaults instead of AI call to reduce API usage
      setSuggestions(['AIBizPro GoHighLevel CRM', 'AIBizPro Voice Agents', 'CDMWeb.store']);
    }
  }, [industry.name]);

  return (
    <div className="bg-card p-5 rounded-lg shadow-western hover:shadow-western-hover transform hover:-translate-y-1 transition-all duration-300 border-2 border-leather/30">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-xl font-bold text-gold font-body">
          {industry.name}
        </h3>
        {industry.businessSize && (
          <Badge variant={getSizeBadgeVariant(industry.businessSize)} className="text-xs">
            {getSizeLabel(industry.businessSize)}
          </Badge>
        )}
      </div>
      
      {(industry.location && !industry.location.toLowerCase().includes('your')) && (
        <p className="text-sm text-leather/70 mb-3">
          <span className="font-semibold text-gold">{industry.location}</span>
        </p>
      )}
      
      <div className="mb-3 flex items-center gap-4 text-sm text-leather/70">
        <div className="flex items-center gap-1">
          <Building className="w-4 h-4" />
          <span>{industry.businessCount} businesses</span>
        </div>
        <div className="flex items-center gap-1">
          <MapPin className="w-4 h-4" />
          <span>100mi radius</span>
        </div>
      </div>

      {/* Industry Challenges */}
      {industry.challenges && industry.challenges.length > 0 && (
        <div className="mb-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-700" />
            <span className="text-sm font-semibold text-amber-800">Industry Challenges</span>
          </div>
          <ul className="text-xs text-amber-900 space-y-1">
            {industry.challenges.slice(0, 3).map((challenge, index) => (
              <li key={index} className="flex items-start gap-1">
                <span className="text-amber-600 mt-0.5">•</span>
                <span>{challenge}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Strategic Recommendations */}
      {industry.strategicRecommendations && industry.strategicRecommendations.length > 0 && (
        <div className="mb-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-emerald-700" />
            <span className="text-sm font-semibold text-emerald-800">Sales Strategy</span>
          </div>
          <ul className="text-xs text-emerald-900 space-y-1">
            {industry.strategicRecommendations.slice(0, 3).map((rec, index) => (
              <li key={index} className="flex items-start gap-1">
                <span className="text-emerald-600 mt-0.5">✓</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* AI Suggested Products */}
      <div className="mb-4 p-3 bg-dust/30 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="w-4 h-4 text-gold" />
          <span className="text-sm font-semibold text-gold">Recommended Products</span>
        </div>
        {isLoadingSuggestions ? (
          <p className="text-xs text-leather/60">🤖 Generating suggestions...</p>
        ) : (
          <ul className="text-xs text-leather/80 space-y-1">
            {suggestions.slice(0, 3).map((suggestion, index) => (
              <li key={index} className="flex items-start gap-1">
                <TrendingUp className="w-3 h-3 text-gold mt-0.5 flex-shrink-0" />
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <Button variant="rust" className="w-full text-sm" onClick={handleSearchClick}>
        Generate Leads
      </Button>
    </div>
  );
};

export default IndustryCard;
