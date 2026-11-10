import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface SubscriptionStatus {
  isAdmin: boolean;
  isSubscribed: boolean;
  canSaveToCRM: boolean;
  isLoading: boolean;
  subscriptionEnd: string | null;
  checkSubscription: () => Promise<void>;
}

const ADMIN_EMAILS = ['marcuscrowell44@gmail.com', 'marcus@play44sports.com', 'marcus@cdmweb.store', 'marcus_crowell@yahoo.com', 'marcus@zapai.io'];

export const useSubscriptionStatus = (): SubscriptionStatus => {
  const { user, session, isLoading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);

  const checkSubscription = useCallback(async () => {
    if (!session?.access_token) {
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
        const userEmail = user?.email?.toLowerCase();
        const isAdminByEmail = ADMIN_EMAILS.some(e => e.toLowerCase() === userEmail);
        setIsAdmin(isAdminByEmail);
        setIsSubscribed(isAdminByEmail);
        setIsLoading(false);
        return;
      }

      setIsAdmin(data.is_admin || false);
      setIsSubscribed(data.subscribed || false);
      setSubscriptionEnd(data.subscription_end || null);
    } catch (error) {
      console.error('Error checking subscription:', error);
      setIsAdmin(false);
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token, user?.email]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsAdmin(false);
      setIsSubscribed(false);
      setIsLoading(false);
      return;
    }
    checkSubscription();
  }, [user, authLoading, checkSubscription]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  return {
    isAdmin,
    isSubscribed,
    canSaveToCRM: isAdmin || isSubscribed,
    isLoading: isLoading || authLoading,
    subscriptionEnd,
    checkSubscription,
  };
};
