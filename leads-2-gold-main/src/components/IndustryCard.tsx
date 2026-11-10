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
    const lower = industryName.toLowerCase();

    // Check specific industry keywords
    if (lower.includes('software') || lower.includes('tech') || lower.includes('it ') || lower.includes('saas') || lower.includes('developer') || lower.includes('semiconductor') || lower.includes('electronic')) {
      return [
        'CDMWeb.store - Custom Software Development & App Engineering',
        'CDMWeb.store - IT Staffing & Dedicated Remote/AI Developers',
        'AIBizPro GoHighLevel CRM - B2B Pipeline & Lead Automation',
        'Fractional VP of Sales - Outbound Prospecting & Sales Leadership'
      ];
    }

    if (lower.includes('plumb') || lower.includes('hvac') || lower.includes('roof') || lower.includes('electric') || lower.includes('contract') || lower.includes('construction') || lower.includes('handyman') || lower.includes('pest') || lower.includes('landscap') || lower.includes('tree') || lower.includes('clean')) {
      return [
        'AIBizPro AI Phone Agents - 24/7 Call Answering & After-Hours Dispatch',
        'AIBizPro GoHighLevel CRM - Instant SMS Follow-ups & Lead Nurturing',
        'CDMWeb.store - High-Converting Websites & Local SEO',
        'EnergyChoice.us - Commercial Energy Bill Reduction (10-30% Savings)'
      ];
    }

    if (lower.includes('restaurant') || lower.includes('food') || lower.includes('bar') || lower.includes('cafe') || lower.includes('diner') || lower.includes('bakery') || lower.includes('catering') || lower.includes('hospitality') || lower.includes('hotel')) {
      return [
        'EnergyChoice.us - Commercial Electric & Gas Rate Reduction (10-30% Savings)',
        'AIBizPro AI Phone & Text Agents - 24/7 Phone Orders & Table Reservations',
        'AIBizPro Reputation & Social Media Management - Automated Review Growth',
        'CDMWeb.store - Online Ordering Websites & Digital Branding'
      ];
    }

    if (lower.includes('auto') || lower.includes('car') || lower.includes('mechanic') || lower.includes('tire') || lower.includes('body shop')) {
      return [
        'AIBizPro GoHighLevel CRM - Service History & Automated Maintenance Reminders',
        'AIBizPro AI Phone Agents - 24/7 Estimate Intake & Appointment Booking',
        'AIBizPro Reputation Management - Automated 5-Star Google Review Outreach',
        'EnergyChoice.us - Commercial Shop Utility Cost Savings'
      ];
    }

    if (lower.includes('real estate') || lower.includes('realty') || lower.includes('mortgage') || lower.includes('property') || lower.includes('broker')) {
      return [
        'AIBizPro GoHighLevel CRM - Drip Email/SMS Campaigns & Lead Tracking',
        'AIBizPro Voice & Text Agents - Instant AI Buyer/Seller Lead Qualification',
        'Fractional VP of Sales - Outbound B2B Prospecting & Team Management',
        'CDMWeb.store - Modern Property Showcase Websites & SEO'
      ];
    }

    if (lower.includes('health') || lower.includes('medical') || lower.includes('dental') || lower.includes('clinic') || lower.includes('doctor') || lower.includes('wellness') || lower.includes('spa') || lower.includes('salon')) {
      return [
        'AIBizPro AI Phone Agents - 24/7 Patient Appointment Scheduling & Intake',
        'AIBizPro GoHighLevel CRM - Automated Patient Recall & SMS Reminders',
        'AIBizPro Reputation Management - HIPAA-Aware Google Review Responses',
        'CDMWeb.store - Professional Healthcare Websites & Patient Portals'
      ];
    }

    if (lower.includes('retail') || lower.includes('store') || lower.includes('shop') || lower.includes('ecommerce') || lower.includes('e-commerce') || lower.includes('boutique')) {
      return [
        'CDMWeb.store - E-Commerce Development, Inventory Sync & Custom Stores',
        'AIBizPro GoHighLevel CRM - Customer Loyalty, SMS Marketing & Cart Recovery',
        'EnergyChoice.us - Store Utility & Electricity Cost Reduction (10-30%)',
        'AIBizPro Social Media Management & Automated Campaigns'
      ];
    }

    if (lower.includes('manufactur') || lower.includes('warehous') || lower.includes('industr') || lower.includes('logistics') || lower.includes('machin') || lower.includes('distribut')) {
      return [
        'EnergyChoice.us - Commercial Energy Procurement for High-Usage Facilities',
        'CDMWeb.store - Custom Software Development, ERP Portals & IT Staffing',
        'Fractional VP of Sales - Industrial B2B Prospecting & Sales Leadership',
        'AIBizPro GoHighLevel CRM - B2B Contract & Pipeline Management'
      ];
    }

    if (lower.includes('legal') || lower.includes('law') || lower.includes('attorney') || lower.includes('accounting') || lower.includes('cpa') || lower.includes('consult') || lower.includes('financ')) {
      return [
        'AIBizPro AI Voice & Text Agents - 24/7 Client Consultation Booking & Screening',
        'Fractional VP of Sales - High-Value Prospecting & Sales Team Systems',
        'AIBizPro GoHighLevel CRM - Secure Client Intake & Retention Automation',
        'CDMWeb.store - High-End Corporate Web Development & Brand Strategy'
      ];
    }

    // Default suggestions covering the full CDMWeb + AIBizPro ecosystem
    return [
      'AIBizPro GoHighLevel CRM - All-in-One Marketing, Drip Campaigns & Pipeline CRM',
      'AIBizPro 24/7 AI Voice & Phone Agents - Never Miss a Lead or After-Hours Call',
      'CDMWeb.store - Custom Software Development, IT Staffing & Remote AI Developers',
      'EnergyChoice.us - Commercial Energy Cost Reduction (10-30% in Deregulated Areas)',
      'Fractional VP of Sales & Prospecting - Sales Leadership & Team Management'
    ];
  };

  useEffect(() => {
    const predefinedSuggestions = getIndustrySuggestions(industry.name);
    setSuggestions(predefinedSuggestions);
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
            {suggestions.slice(0, 4).map((suggestion, index) => (
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
