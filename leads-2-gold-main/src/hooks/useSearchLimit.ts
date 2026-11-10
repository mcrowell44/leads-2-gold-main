import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

const FREE_SEARCH_LIMIT = 2;
const LOCAL_STORAGE_KEY = 'lead_search_count';
const LEAD_CAPTURE_KEY = 'lead_capture_data';

// Admin emails exempt from limits
const ADMIN_EMAILS = ['marcuscrowell44@gmail.com', 'marcus@play44sports.com', 'marcus@cdmweb.store', 'marcus_crowell@yahoo.com', 'marcus@zapai.io'];

interface LeadCaptureData {
  name: string;
  email: string;
  capturedAt: string;
}

interface SearchLimitState {
  searchCount: number;
  hasReachedLimit: boolean;
  remainingSearches: number;
  isAdmin: boolean;
  isSubscribed: boolean;
  canSearch: boolean;
  isLoading: boolean;
  hasProvidedDetails: boolean;
  leadCaptureData: LeadCaptureData | null;
  incrementSearchCount: () => void;
  setLeadCaptured: () => void;
}

export const useSearchLimit = (): SearchLimitState => {
  const { user, isLoading: authLoading } = useAuth();
  const [searchCount, setSearchCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasProvidedDetails, setHasProvidedDetails] = useState(false);
  const [leadCaptureData, setLeadCaptureData] = useState<LeadCaptureData | null>(null);

  // Load search count and lead capture data from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      setSearchCount(parseInt(stored, 10) || 0);
    }
    
    const captureData = localStorage.getItem(LEAD_CAPTURE_KEY);
    if (captureData) {
      try {
        const parsed = JSON.parse(captureData) as LeadCaptureData;
        setLeadCaptureData(parsed);
        setHasProvidedDetails(true);
      } catch {
        setHasProvidedDetails(false);
      }
    }
  }, []);

  // Check admin and subscription status via Stripe
  useEffect(() => {
    const checkStatus = async () => {
      if (authLoading) return;
      
      if (!user) {
        setIsAdmin(false);
        setIsSubscribed(false);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('check-subscription');
        
        if (error) {
          console.error('Error checking subscription:', error);
          // Fallback: check admin by email
          const userEmail = user.email?.toLowerCase();
          if (userEmail && ADMIN_EMAILS.some(email => email.toLowerCase() === userEmail)) {
            setIsAdmin(true);
            setIsSubscribed(true);
          } else {
            setIsAdmin(false);
            setIsSubscribed(false);
          }
          setIsLoading(false);
          return;
        }

        setIsAdmin(data.is_admin || false);
        setIsSubscribed(data.subscribed || false);
      } catch (error) {
        console.error('Error checking status:', error);
        setIsAdmin(false);
        setIsSubscribed(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, [user, authLoading]);

  const incrementSearchCount = useCallback(async () => {
    // Admins and subscribers don't track searches
    if (isAdmin || isSubscribed) return;
    
    const newCount = searchCount + 1;
    setSearchCount(newCount);
    localStorage.setItem(LOCAL_STORAGE_KEY, newCount.toString());

    // Also update database if we have lead capture data
    if (leadCaptureData?.email) {
      try {
        await supabase
          .from('free_trial_leads')
          .update({ 
            searches_used: newCount,
            last_search_at: new Date().toISOString()
          })
          .eq('email', leadCaptureData.email);
      } catch (error) {
        console.error('Error updating search count in database:', error);
      }
    }
  }, [searchCount, isAdmin, isSubscribed, leadCaptureData]);

  const setLeadCaptured = useCallback(() => {
    setHasProvidedDetails(true);
    const captureData = localStorage.getItem(LEAD_CAPTURE_KEY);
    if (captureData) {
      try {
        setLeadCaptureData(JSON.parse(captureData));
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  const hasReachedLimit = !isAdmin && !isSubscribed && searchCount >= FREE_SEARCH_LIMIT;
  const remainingSearches = Math.max(0, FREE_SEARCH_LIMIT - searchCount);
  // Must be authenticated. Admins/subscribers have unlimited. Otherwise need details + remaining searches.
  const canSearch = !!user && (isAdmin || isSubscribed || (hasProvidedDetails && searchCount < FREE_SEARCH_LIMIT));

  return {
    searchCount,
    hasReachedLimit,
    remainingSearches,
    isAdmin,
    isSubscribed,
    canSearch,
    isLoading: isLoading || authLoading,
    hasProvidedDetails,
    leadCaptureData,
    incrementSearchCount,
    setLeadCaptured,
  };
};
