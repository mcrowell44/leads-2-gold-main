import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Download, Building2, Mail, Phone, MapPin, Globe, Star, ArrowLeft, Loader2, Lightbulb, Clock, TrendingUp, Target, Sparkles, Linkedin, Instagram, Facebook, Twitter, BarChart3, Send, User, Lock, ExternalLink, ShieldCheck } from 'lucide-react';
import { Lead, generateLeads, saveLeads, getUserLeads, exportLeadsToCSV, createLeadCampaign, updateLeadCampaign, BusinessPainPoints } from '@/services/leadGenerationService';
import { bulkAddProspectsToCRM, saveAdminSearch } from '@/services/crmService';
import { getCurrentLocation } from '@/services/locationService';
import { supabase } from '@/integrations/supabase/client';
import { BusyTimesChart } from './BusyTimesChart';
import { EmailCampaignDialog } from './EmailCampaignDialog';
import { SubscriptionPaywall } from './SubscriptionPaywall';
import { LeadCaptureForm } from './LeadCaptureForm';
import { useSearchLimit } from '@/hooks/useSearchLimit';
import { useMonthlyLeadUsage, MONTHLY_LEAD_CAP } from '@/hooks/useMonthlyLeadUsage';

interface EnrichedLeadData {
  company_name: string;
  industry_name: string;
  location?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  linkedin_url?: string;
  instagram_url?: string;
  facebook_url?: string;
  twitter_url?: string;
  lead_score?: number;
  pain_points?: string[];
  suggested_products?: string[];
  personalized_email?: string;
  best_call_times?: string[];
  ai_insights?: {
    best_contact_approach?: string;
    enriched_at?: string;
  };
}

interface LeadsManagerProps {
  industryName: string;
  location: string;
  onBack: () => void;
  autoGenerate?: boolean;
  initialCount?: number;
}

export const LeadsManager: React.FC<LeadsManagerProps> = ({ 
  industryName, 
  location, 
  onBack,
  autoGenerate,
  initialCount
}) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCount, setSelectedCount] = useState<number>(50);
  const [searchTerm, setSearchTerm] = useState('');
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showLeadCapture, setShowLeadCapture] = useState(false);
  
  const [locationTerm, setLocationTerm] = useState(location || '');
  const [enrichingLeads, setEnrichingLeads] = useState<Set<string>>(new Set());
  const [enrichedData, setEnrichedData] = useState<Map<string, EnrichedLeadData>>(new Map());
  const [emailCampaignOpen, setEmailCampaignOpen] = useState(false);
  const [emailCampaignLeads, setEmailCampaignLeads] = useState<Lead[]>([]);
  const [verifyingLeads, setVerifyingLeads] = useState<Set<string>>(new Set());
  const [verifiedData, setVerifiedData] = useState<Map<string, Record<string, any>>>(new Map());

  const { canSearch, hasReachedLimit, remainingSearches, isAdmin, isSubscribed, hasProvidedDetails, incrementSearchCount, setLeadCaptured, isLoading: searchLimitLoading } = useSearchLimit();
  // Monthly cap only applies to paid subscribers (admins exempt, free trial gated by search limit)
  const monthlyUsageEnabled = isSubscribed && !isAdmin;
  const { leadsUsed: monthlyLeadsUsed, leadsRemaining: monthlyLeadsRemaining, hasReachedMonthlyCap, recordLeads: recordMonthlyLeads } = useMonthlyLeadUsage(monthlyUsageEnabled);

  useEffect(() => {
    setLocationTerm(location || '');
  }, [location]);

  useEffect(() => {
    loadExistingLeads();
  }, []);

  const loadExistingLeads = async () => {
    try {
      const existingLeads = await getUserLeads();
      setAllLeads(existingLeads);
      console.log('Loaded existing leads:', existingLeads.length);
    } catch (error) {
      console.error('Error loading existing leads:', error);
    }
  };

  useEffect(() => {
    if (initialCount) setSelectedCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    // Wait for search limit check to complete before making decisions
    if (searchLimitLoading) return;
    
    if (autoGenerate) {
      // Admins and subscribers can always generate
      if (isAdmin || isSubscribed) {
        handleGenerateLeads(initialCount || selectedCount);
      } else if (!hasProvidedDetails) {
        // Non-admin, non-subscribed users need to provide details first
        setShowLeadCapture(true);
      } else if (canSearch) {
        handleGenerateLeads(initialCount || selectedCount);
      } else {
        setShowPaywall(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchLimitLoading, canSearch, hasProvidedDetails, isAdmin, isSubscribed]);

  const handleGenerateLeads = async (count: number) => {
    // Check if user needs to provide details first
    if (!isAdmin && !isSubscribed && !hasProvidedDetails) {
      setShowLeadCapture(true);
      return;
    }

    // Check search limit before proceeding
    if (!canSearch) {
      setShowPaywall(true);
      return;
    }

    // Enforce monthly lead cap for paid subscribers (admins exempt)
    let effectiveCount = count;
    if (monthlyUsageEnabled) {
      if (hasReachedMonthlyCap || monthlyLeadsRemaining <= 0) {
        toast.error(`Monthly limit of ${MONTHLY_LEAD_CAP.toLocaleString()} leads reached. Resets on the 1st.`);
        return;
      }
      if (count > monthlyLeadsRemaining) {
        effectiveCount = monthlyLeadsRemaining;
        toast.warning(`Only ${monthlyLeadsRemaining} leads remaining this month. Generating ${effectiveCount}.`);
      }
    }

    console.log(`Starting real lead generation for ${effectiveCount} leads`);
    setLoading(true);
    setHasGenerated(false);
    
    try {
      toast.info(`Generating ${effectiveCount} real businesses for ${industryName} in ${locationTerm || 'your area'}...`);

      // Increment search count for non-subscribers
      incrementSearchCount();

      // Create campaign record first (optional, won't fail if user not authenticated)
      let campaign = null;
      try {
        campaign = await createLeadCampaign({
          industry_name: industryName,
          location: locationTerm || 'Unknown',
          requested_count: effectiveCount,
          status: 'generating'
        });
        if (campaign) {
          console.log('Created campaign:', campaign);
        }
      } catch (campaignError) {
        console.log('Campaign creation skipped (user may not be authenticated)');
      }

      // Generate leads using live business data
      console.log('Fetching real businesses...');
      const newLeads = await generateLeads(industryName, locationTerm || '', effectiveCount);
      console.log('Generated real leads:', newLeads.length);
      
      if (newLeads.length === 0) {
        toast.error('No real businesses found. Please try a different industry or location.');
        return;
      }

      // Save leads to database (or get display version if not authenticated/subscribed)
      console.log('Processing real business leads...');
      const processedLeads = await saveLeads(newLeads);
      console.log('Processed leads:', processedLeads.length);
      
      // Update campaign status if we created one
      if (campaign?.id) {
        try {
          await updateLeadCampaign(campaign.id, {
            generated_count: processedLeads.length,
            status: 'completed'
          });
        } catch (updateError) {
          console.log('Campaign update skipped');
        }
      }

      // Update state with new leads
      setLeads(processedLeads);
      setAllLeads(prev => [...processedLeads, ...prev]);
      setHasGenerated(true);

      // Record monthly lead usage for paid subscribers
      if (monthlyUsageEnabled && processedLeads.length > 0) {
        await recordMonthlyLeads(processedLeads.length);
      }

      // Auto-save to CRM for admin/subscribed users
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser && (isAdmin || isSubscribed)) {
          const crmProspects = processedLeads.map(lead => ({
            company_name: lead.company_name || 'Unknown',
            industry_name: lead.industry_name || industryName,
            business_type: lead.business_type,
            contact_name: lead.contact_name,
            email: lead.email,
            phone: lead.phone,
            website: lead.website,
            address: lead.address,
            city: lead.city,
            state: lead.state,
            google_rating: lead.rating,
            google_reviews_count: lead.user_ratings_total,
          }));
          const savedCount = await bulkAddProspectsToCRM(crmProspects, currentUser.id, `${industryName} in ${locationTerm}`);
          console.log(`Auto-saved ${savedCount} prospects to CRM`);
          
          // Also save the search
          await saveAdminSearch(currentUser.id, industryName, industryName, locationTerm || 'Unknown', processedLeads.length);
        }
      } catch (crmError) {
        console.warn('CRM autosave failed (non-blocking):', crmError);
      }
      
      // Show remaining searches / monthly cap info
      if (!isAdmin && !isSubscribed && remainingSearches > 0) {
        toast.success(`Successfully generated ${processedLeads.length} real businesses! You have ${remainingSearches - 1} free search${remainingSearches - 1 === 1 ? '' : 'es'} remaining.`);
      } else if (monthlyUsageEnabled) {
        const newRemaining = Math.max(0, monthlyLeadsRemaining - processedLeads.length);
        toast.success(`Generated ${processedLeads.length} leads. ${newRemaining.toLocaleString()} of ${MONTHLY_LEAD_CAP.toLocaleString()} monthly leads remaining.`);
      } else {
        toast.success(`Successfully generated ${processedLeads.length} real businesses for ${industryName}!`);
      }
    } catch (error) {
      console.error('Error in real lead generation process:', error);
      toast.error(`Failed to fetch real business data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };


  const handleExportCSV = () => {
    // Check if user can export (must be admin or subscribed)
    if (!isAdmin && !isSubscribed) {
      toast.error('Subscribe to export leads to CSV');
      setShowPaywall(true);
      return;
    }

    if (leads.length === 0) {
      toast.error('No leads to export');
      return;
    }
    
    try {
      exportLeadsToCSV(leads);
      toast.success('Leads exported to CSV successfully!');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export leads to CSV');
    }
  };

  const handleEnrichLead = async (lead: Lead) => {
    const leadId = lead.id || lead.company_name;
    
    if (enrichingLeads.has(leadId)) return;
    
    setEnrichingLeads(prev => new Set(prev).add(leadId));
    toast.info(`Enriching ${lead.company_name}...`);
    
    try {
      const { data, error } = await supabase.functions.invoke('enrich-lead', {
        body: {
          lead: {
            companyName: lead.company_name,
            industryName: lead.industry_name || industryName,
            location: lead.city && lead.state ? `${lead.city}, ${lead.state}` : locationTerm,
            website: lead.website,
            phone: lead.phone,
            email: lead.email,
            address: lead.address
          }
        }
      });
      
      if (error) throw error;
      
      if (data?.success && data?.data) {
        setEnrichedData(prev => new Map(prev).set(leadId, data.data));
        toast.success(`${lead.company_name} enriched with AI insights!`);
      } else {
        throw new Error(data?.error || 'Failed to enrich lead');
      }
    } catch (error) {
      console.error('Error enriching lead:', error);
      toast.error(`Failed to enrich ${lead.company_name}`);
    } finally {
      setEnrichingLeads(prev => {
        const next = new Set(prev);
        next.delete(leadId);
        return next;
      });
    }
  };

  const handleEnrichAllLeads = async () => {
    if (leads.length === 0) {
      toast.error('No leads to enrich');
      return;
    }
    
    toast.info(`Starting enrichment for ${leads.length} leads...`);
    
    // Enrich in batches of 3 to avoid rate limiting
    for (let i = 0; i < leads.length; i += 3) {
      const batch = leads.slice(i, i + 3);
      await Promise.all(batch.map(lead => handleEnrichLead(lead)));
      
      // Small delay between batches
      if (i + 3 < leads.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    toast.success('All leads enriched!');
  };

  // Firecrawl verification: scrape website + search Google for verified phone, rating, reviews
  const handleVerifyLead = async (lead: Lead) => {
    const leadId = lead.id || lead.company_name;
    if (!leadId || verifyingLeads.has(leadId)) return;

    setVerifyingLeads(prev => new Set(prev).add(leadId));

    try {
      const { data, error } = await supabase.functions.invoke('verify-business', {
        body: {
          businessName: lead.company_name,
          website: lead.website,
          googleMapsUrl: lead.google_maps_url,
          location: lead.city && lead.state ? `${lead.city}, ${lead.state}` : locationTerm,
        }
      });

      if (error) throw error;

      if (data?.success && data?.verified) {
        const v = data.verified;
        setVerifiedData(prev => new Map(prev).set(leadId, v));

        // Merge verified data back into the lead
        setLeads(prev => prev.map(l => {
          const lid = l.id || l.company_name;
          if (lid !== leadId) return l;
          return {
            ...l,
            phone: v.phone || l.phone,
            email: v.email || l.email,
            website: v.website || l.website,
            rating: v.rating || l.rating,
            user_ratings_total: v.user_ratings_total || l.user_ratings_total,
            instagram_url: v.instagram_url || l.instagram_url,
            facebook_url: v.facebook_url || l.facebook_url,
            linkedin_url: v.linkedin_url || l.linkedin_url,
            twitter_url: v.twitter_url || l.twitter_url,
            google_maps_url: v.google_maps_url || l.google_maps_url,
          };
        }));
      }
    } catch (err) {
      console.error('Verify failed for', lead.company_name, err);
    } finally {
      setVerifyingLeads(prev => { const n = new Set(prev); n.delete(leadId); return n; });
    }
  };

  const handleVerifyAllLeads = async () => {
    if (leads.length === 0) return;
    toast.info(`Verifying ${leads.length} leads via Firecrawl...`);

    for (let i = 0; i < leads.length; i += 3) {
      const batch = leads.slice(i, i + 3);
      await Promise.all(batch.map(lead => handleVerifyLead(lead)));
      if (i + 3 < leads.length) {
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    }

    toast.success('Firecrawl verification complete!');
  };

  const filteredLeads = leads.filter(lead =>
    lead.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper function to create Google Maps link
  const createGoogleMapsLink = (address: string, city: string, state: string, zipCode: string) => {
    const fullAddress = `${address}, ${city}, ${state} ${zipCode}`;
    return `https://www.google.com/maps/search/${encodeURIComponent(fullAddress)}`;
  };

  // Helper function to render pain points
  const renderPainPoints = (painPoints: string[] | BusinessPainPoints | undefined) => {
    if (!painPoints) return null;
    
    // If it's an array (legacy format)
    if (Array.isArray(painPoints)) {
      if (painPoints.length === 0) return null;
      return (
        <div>
          <h6 className="font-medium text-red-700 dark:text-red-300 mb-2 flex items-center gap-1">
            <Target className="h-4 w-4" />
            Business Challenges
          </h6>
          <ul className="space-y-1">
            {painPoints.map((point, idx) => (
              <li key={idx} className="text-xs text-red-600 dark:text-red-400 flex items-start gap-1">
                <span className="w-1 h-1 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      );
    }
    
    // If it's the new BusinessPainPoints object
    const categories = Object.entries(painPoints).filter(([_, points]) => points && points.length > 0);
    if (categories.length === 0) return null;
    
    return (
      <div className="space-y-3">
        {categories.map(([category, points]) => (
          <div key={category}>
            <h6 className="font-medium text-red-700 dark:text-red-300 mb-1 flex items-center gap-1 capitalize">
              <Target className="h-4 w-4" />
              {category.replace('_', ' ')} Challenges
            </h6>
            <ul className="space-y-1">
              {points.map((point: string, idx: number) => (
                <li key={idx} className="text-xs text-red-600 dark:text-red-400 flex items-start gap-1">
                  <span className="w-1 h-1 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      {showPaywall && (
        <SubscriptionPaywall 
          remainingSearches={remainingSearches}
          onClose={() => setShowPaywall(false)}
        />
      )}

      {showLeadCapture && (
        <LeadCaptureForm 
          onSubmit={() => {
            setLeadCaptured();
            setShowLeadCapture(false);
          }}
        />
      )}
      
      <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Search
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Real Business Lead Generation</h2>
          <p className="text-muted-foreground">
            {industryName} • {locationTerm || 'Your Area'} • Proprietary Task Agents
          </p>
        </div>
      </div>

      {/* Lead Generation Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Real Business Leads</CardTitle>
          <CardDescription>
            Generate real business listings for {industryName} in {locationTerm || 'your area'} using Proprietary Task Agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 mb-4">
            {[20, 50, 100].map((count) => (
              <Button
                key={count}
                variant={selectedCount === count ? "default" : "outline"}
                onClick={() => setSelectedCount(count)}
                disabled={loading}
              >
                {count} Real Businesses
              </Button>
            ))}
            <div className="w-full sm:w-auto sm:ml-auto">
              <Input
                placeholder="City, State, or ZIP"
                value={locationTerm}
                onChange={(e) => setLocationTerm(e.target.value)}
                className="sm:w-64"
              />
            </div>
          </div>
          
          {/* Free search indicator for non-subscribers */}
          {!isAdmin && !isSubscribed && hasProvidedDetails && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
              <Lock className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-800 dark:text-amber-200">
                {remainingSearches > 0 
                  ? `Free trial: ${remainingSearches} search${remainingSearches === 1 ? '' : 'es'} remaining`
                  : 'Free trial ended. Subscribe for unlimited access.'
                }
              </span>
              {remainingSearches === 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowPaywall(true)}
                  className="ml-auto text-amber-700 border-amber-300 hover:bg-amber-100"
                >
                  Subscribe
                </Button>
              )}
            </div>
          )}

          {/* Monthly lead cap indicator for paid subscribers */}
          {monthlyUsageEnabled && (
            <div className={`flex items-center gap-2 mb-4 p-3 rounded-lg border ${
              hasReachedMonthlyCap
                ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
                : monthlyLeadsRemaining < 250
                  ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
                  : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
            }`}>
              <BarChart3 className={`h-4 w-4 ${hasReachedMonthlyCap ? 'text-red-600' : 'text-emerald-700'}`} />
              <span className="text-sm">
                {hasReachedMonthlyCap
                  ? `Monthly cap reached (${MONTHLY_LEAD_CAP.toLocaleString()} leads). Resets on the 1st.`
                  : `${monthlyLeadsUsed.toLocaleString()} / ${MONTHLY_LEAD_CAP.toLocaleString()} monthly leads used — ${monthlyLeadsRemaining.toLocaleString()} remaining`}
              </span>
            </div>
          )}

          <div className="flex flex-wrap gap-2 sm:gap-4">
            <Button
              onClick={() => handleGenerateLeads(selectedCount)}
              disabled={loading || hasReachedMonthlyCap}
              className="flex-1 min-w-[200px]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating {selectedCount} real businesses...
                </>
              ) : !isAdmin && !isSubscribed && !hasProvidedDetails ? (
                <>
                  <User className="h-4 w-4 mr-2" />
                  Start Free Trial
                </>
              ) : !canSearch ? (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Subscribe to Continue
                </>
              ) : hasReachedMonthlyCap ? (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Monthly Limit Reached
                </>
              ) : (
                `Get ${selectedCount} Real Business Leads`
              )}
            </Button>
          </div>

          {/* Post-generation action buttons - mobile responsive */}
          {leads.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              <Button
                variant="secondary"
                onClick={handleEnrichAllLeads}
                disabled={loading || enrichingLeads.size > 0}
                className="flex-1 sm:flex-none"
              >
                {enrichingLeads.size > 0 ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enriching ({enrichingLeads.size})...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Enhance Insights</span>
                    <span className="sm:hidden">Enhance</span>
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleExportCSV}
                disabled={loading}
                className="flex-1 sm:flex-none"
              >
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">Export</span>
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  setEmailCampaignLeads(leads);
                  setEmailCampaignOpen(true);
                }}
                disabled={loading}
                className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700"
              >
                <Send className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Email Campaign</span>
                <span className="sm:hidden">Email</span>
              </Button>
              <Button
                variant="secondary"
                onClick={handleVerifyAllLeads}
                disabled={loading || verifyingLeads.size > 0}
                className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {verifyingLeads.size > 0 ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying ({verifyingLeads.size})...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Verify via Firecrawl</span>
                    <span className="sm:hidden">Verify</span>
                  </>
                )}
              </Button>
            </div>
          )}
          
          {loading && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                🤖 Fetching real business data for {industryName}...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Show message when no leads generated yet */}
      {!loading && !hasGenerated && leads.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ready to Generate Real Business Data</h3>
              <p className="text-muted-foreground">
                Click the button above to generate real businesses for {industryName} in {locationTerm || 'your area'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Real Business Lead Results */}
      {leads.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Real Business Leads ({leads.length})</CardTitle>
                <CardDescription>
                  Real businesses converted to sales leads
                </CardDescription>
              </div>
              <Badge variant="default" className="bg-green-600">
                {leads.length} Real Businesses
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input
                placeholder="Search leads by company, contact, or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>

            <div className="grid gap-6">
              {filteredLeads.map((lead, index) => {
                const leadId = lead.id || lead.company_name;
                const enriched = enrichedData.get(leadId);
                const isEnriching = enrichingLeads.has(leadId);
                const isVerified = verifiedData.has(leadId);
                const isVerifying = verifyingLeads.has(leadId);
                
                return (
                <Card key={lead.id || index} className={`border-l-4 ${isVerified ? 'border-l-emerald-500' : enriched ? 'border-l-purple-500' : 'border-l-green-500'}`}>
                  <CardContent className="pt-4">
                    <div className="grid lg:grid-cols-3 gap-6">
                      {/* Business Info */}
                      <div className="lg:col-span-1">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-start gap-2">
                            <Building2 className="h-5 w-5 text-green-600 mt-0.5" />
                            <div>
                              <h4 className="font-semibold text-lg">{lead.company_name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {lead.business_type} • Real Business
                              </p>
                              {enriched && (
                                <div className="flex items-center gap-1 text-xs text-purple-600 mt-1">
                                  <Sparkles className="h-3 w-3" />
                                  Enriched • Score: {enriched.lead_score}/100
                                </div>
                              )}
                              {isVerified && (
                                <div className="flex items-center gap-1 text-xs text-emerald-600 mt-1">
                                  <ShieldCheck className="h-3 w-3" />
                                  Firecrawl Verified
                                </div>
                              )}
                              {isVerifying && (
                                <div className="flex items-center gap-1 text-xs text-amber-600 mt-1">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Verifying...
                                </div>
                              )}
                              {lead.place_id && !enriched && !isVerified && !isVerifying && (
                                <p className="text-xs text-green-600 mt-1">
                                  ✓ Verified Business
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEmailCampaignLeads([lead]);
                                setEmailCampaignOpen(true);
                              }}
                              className="flex-shrink-0"
                              title="Email this lead"
                            >
                              <Send className="h-4 w-4 text-purple-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEnrichLead(lead)}
                              disabled={isEnriching || !!enriched}
                              className="flex-shrink-0"
                            >
                              {isEnriching ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : enriched ? (
                                <Sparkles className="h-4 w-4 text-purple-500" />
                              ) : (
                                <Sparkles className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleVerifyLead(lead)}
                              disabled={isVerifying || isVerified}
                              className="flex-shrink-0"
                              title="Verify via Firecrawl"
                            >
                              {isVerifying ? (
                                <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                              ) : isVerified ? (
                                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <ShieldCheck className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        
                        {/* Owner/Contact Info with LinkedIn */}
                        {lead.contact_name && (
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{lead.contact_name}</span>
                            {lead.owner_linkedin_url && (
                              <a
                                href={lead.owner_linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors"
                              >
                                <Linkedin className="h-3 w-3" /> Profile
                              </a>
                            )}
                            {lead.owner_email && (
                              <a
                                href={`mailto:${lead.owner_email}`}
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800/40 transition-colors"
                              >
                                <Mail className="h-3 w-3" /> Direct
                              </a>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center flex-wrap gap-3 text-sm text-muted-foreground mb-3">
                          {lead.rating && (
                            <div className="flex items-center gap-1" title={isVerified && verifiedData.get(leadId)?.rating_source ? 'Verified via Firecrawl' : 'From Google'}>
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">{lead.rating}</span>
                              {isVerified && verifiedData.get(leadId)?.rating_source && (
                                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                              )}
                            </div>
                          )}
                          {lead.user_ratings_total && (
                            <div className="flex items-center gap-1" title={isVerified && verifiedData.get(leadId)?.reviews_source ? 'Verified via Firecrawl' : 'From Google'}>
                              <TrendingUp className="h-4 w-4 text-green-600" />
                              <span>{lead.user_ratings_total} Reviews</span>
                              {isVerified && verifiedData.get(leadId)?.reviews_source && (
                                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                              )}
                            </div>
                          )}
                          {lead.open_now !== undefined && (
                            <span className={lead.open_now ? 'text-green-600' : 'text-orange-600'}>
                              {lead.open_now ? 'Currently Open' : 'Currently Closed'}
                            </span>
                          )}
                          {lead.google_maps_url && (
                            <a
                              href={lead.google_maps_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-colors font-medium"
                            >
                              <ExternalLink className="h-3 w-3" /> Google Business
                            </a>
                          )}
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-2">
                          {lead.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <a 
                                href={`mailto:${lead.email}`}
                                className="text-primary hover:underline"
                              >
                                {lead.email}
                              </a>
                            </div>
                          )}
                          
                          {lead.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <a 
                                href={`tel:${lead.phone}`}
                                className="text-primary hover:underline"
                              >
                                {lead.phone}
                              </a>
                              {isVerified && verifiedData.get(leadId)?.phone_source && (
                                <span className="inline-flex items-center gap-0.5 text-xs text-emerald-600">
                                  <ShieldCheck className="h-3 w-3" />
                                  {verifiedData.get(leadId)?.phone_source === 'website' ? 'from website' : 'verified'}
                                </span>
                              )}
                            </div>
                          )}
                          
                          {(lead.address || lead.city) && (
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <a 
                                href={createGoogleMapsLink(
                                  lead.address || '', 
                                  lead.city || '', 
                                  lead.state || '', 
                                  lead.zip_code || ''
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                {lead.address && `${lead.address}, `}
                                {lead.city}{lead.state && `, ${lead.state}`}
                                {lead.zip_code && ` ${lead.zip_code}`}
                              </a>
                            </div>
                          )}
                          
                          {(lead.website || enriched?.website) && (
                            <div className="flex items-center gap-2 text-sm">
                              <Globe className="h-4 w-4 text-muted-foreground" />
                              <a 
                                href={(lead.website || enriched?.website || '').startsWith('http') ? (lead.website || enriched?.website) : `https://${lead.website || enriched?.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                {lead.website || enriched?.website}
                              </a>
                            </div>
                          )}
                          
                          {/* Social Media Links */}
                          {(lead.linkedin_url || lead.instagram_url || lead.facebook_url || lead.twitter_url || enriched?.linkedin_url || enriched?.instagram_url || enriched?.facebook_url || enriched?.twitter_url) && (
                            <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-muted/30">
                              {(lead.linkedin_url || enriched?.linkedin_url) && (
                                <a 
                                  href={lead.linkedin_url || enriched?.linkedin_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors"
                                >
                                  <Linkedin className="h-3 w-3" /> LinkedIn
                                </a>
                              )}
                              {(lead.instagram_url || enriched?.instagram_url) && (
                                <a 
                                  href={lead.instagram_url || enriched?.instagram_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded hover:bg-pink-200 dark:hover:bg-pink-800/40 transition-colors"
                                >
                                  <Instagram className="h-3 w-3" /> Instagram
                                </a>
                              )}
                              {(lead.facebook_url || enriched?.facebook_url) && (
                                <a 
                                  href={lead.facebook_url || enriched?.facebook_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors"
                                >
                                  <Facebook className="h-3 w-3" /> Facebook
                                </a>
                              )}
                              {(lead.twitter_url || enriched?.twitter_url) && (
                                <a 
                                  href={lead.twitter_url || enriched?.twitter_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800/30 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-700/40 transition-colors"
                                >
                                  <Twitter className="h-3 w-3" /> X
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Business Intelligence */}
                      <div className="lg:col-span-2">
                        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-lg p-4 space-y-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Lightbulb className="h-5 w-5 text-green-600" />
                            <h5 className="font-semibold text-green-900 dark:text-green-100">Real Business Intelligence</h5>
                          </div>
                          
                          {lead.ai_insights && (
                            <p className="text-sm text-green-800 dark:text-green-200 mb-3">
                              {lead.ai_insights}
                            </p>
                          )}
                          
                          <div className="grid md:grid-cols-2 gap-4">
                            {/* Industry Pain Points */}
                            {lead.pain_points && (
                              <div>
                                {renderPainPoints(lead.pain_points)}
                              </div>
                            )}
                            
                            {/* Suggested Solutions */}
                            {lead.suggested_products && lead.suggested_products.length > 0 && (
                              <div>
                                <h6 className="font-medium text-green-700 dark:text-green-300 mb-2 flex items-center gap-1">
                                  <Star className="h-4 w-4" />
                                  Recommended Solutions
                                </h6>
                                <ul className="space-y-1">
                                  {lead.suggested_products.map((product, idx) => (
                                    <li key={idx} className="text-xs text-green-600 dark:text-green-400 flex items-start gap-1">
                                      <span className="w-1 h-1 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                                      {product}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                          
                          {/* Busy Times Visualization */}
                          {lead.busy_times && (
                            <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                              <div className="flex items-start gap-2 text-sm">
                                <BarChart3 className="h-4 w-4 text-blue-600 mt-0.5" />
                                <div className="flex-1">
                                  <span className="font-medium text-blue-700 dark:text-blue-300">
                                    Business Activity & Optimal Contact Windows:
                                  </span>
                                  <BusyTimesChart 
                                    busyTimes={lead.busy_times} 
                                    operatingHours={lead.operating_hours}
                                    className="mt-2"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Best Contact Time - show enriched data if available */}
                          {!lead.busy_times && (enriched?.best_call_times || lead.best_contact_time) && (
                            <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                              <div className="flex items-start gap-2 text-sm">
                                <Clock className="h-4 w-4 text-orange-600 mt-0.5" />
                                <div>
                                  <span className="font-medium text-orange-700 dark:text-orange-300">
                                    Best Times to Call:
                                  </span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {enriched?.best_call_times ? (
                                      enriched.best_call_times.map((time, idx) => (
                                        <Badge key={idx} variant="outline" className="text-xs text-orange-600 border-orange-300">
                                          {time}
                                        </Badge>
                                      ))
                                    ) : (
                                      <span className="text-orange-600 dark:text-orange-400">
                                        {lead.best_contact_time}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* AI Contact Approach */}
                          {enriched?.ai_insights?.best_contact_approach && (
                            <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800">
                              <div className="flex items-start gap-2 text-sm">
                                <Target className="h-4 w-4 text-purple-600 mt-0.5" />
                                <div>
                                  <span className="font-medium text-purple-700 dark:text-purple-300">
                                    AI Contact Strategy:
                                  </span>
                                  <p className="text-purple-600 dark:text-purple-400 mt-1">
                                    {enriched.ai_insights.best_contact_approach}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Personalized Email Template */}
                          {enriched?.personalized_email && (
                            <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                              <div className="flex items-start gap-2 text-sm">
                                <Mail className="h-4 w-4 text-blue-600 mt-0.5" />
                                <div className="flex-1">
                                  <span className="font-medium text-blue-700 dark:text-blue-300">
                                    AI Generated Email:
                                  </span>
                                  <pre className="text-xs text-blue-600 dark:text-blue-400 mt-1 whitespace-pre-wrap bg-blue-50 dark:bg-blue-950/30 p-2 rounded">
                                    {enriched.personalized_email}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {lead.notes && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground">
                          <strong>Source:</strong> {lead.notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )})}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All User Leads */}
      {allLeads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your CRM Leads ({allLeads.length} total)</CardTitle>
            <CardDescription>
              All real business leads you've collected across different campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">
                Total leads in your CRM: {allLeads.length}
              </p>
              <Button
                variant="outline"
                onClick={() => exportLeadsToCSV(allLeads)}
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export All Leads
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email Campaign Dialog */}
      <EmailCampaignDialog
        open={emailCampaignOpen}
        onOpenChange={setEmailCampaignOpen}
        leads={emailCampaignLeads}
        industryName={industryName}
      />
    </div>
    </>
  );
};
