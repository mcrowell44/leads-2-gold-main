import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const MONTHLY_LEAD_CAP = 2500;

const getPeriodStart = () => {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`;
};

interface MonthlyUsageState {
  leadsUsed: number;
  leadsRemaining: number;
  hasReachedMonthlyCap: boolean;
  cap: number;
  periodStart: string;
  isLoading: boolean;
  refresh: () => Promise<void>;
  recordLeads: (count: number) => Promise<number>;
}

export const useMonthlyLeadUsage = (enabled: boolean = true): MonthlyUsageState => {
  const { user } = useAuth();
  const [leadsUsed, setLeadsUsed] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const periodStart = getPeriodStart();

  const refresh = useCallback(async () => {
    if (!user || !enabled) {
      setLeadsUsed(0);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('monthly_lead_usage')
        .select('leads_count')
        .eq('user_id', user.id)
        .eq('period_start', periodStart)
        .maybeSingle();
      if (error) throw error;
      setLeadsUsed(data?.leads_count ?? 0);
    } catch (err) {
      console.error('Error loading monthly lead usage:', err);
      setLeadsUsed(0);
    } finally {
      setIsLoading(false);
    }
  }, [user, enabled, periodStart]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const recordLeads = useCallback(
    async (count: number): Promise<number> => {
      if (!user || !enabled || count <= 0) return leadsUsed;
      const newTotal = leadsUsed + count;
      try {
        const { error } = await supabase
          .from('monthly_lead_usage')
          .upsert(
            {
              user_id: user.id,
              period_start: periodStart,
              leads_count: newTotal,
            },
            { onConflict: 'user_id,period_start' }
          );
        if (error) throw error;
        setLeadsUsed(newTotal);
        return newTotal;
      } catch (err) {
        console.error('Error recording monthly lead usage:', err);
        return leadsUsed;
      }
    },
    [user, enabled, periodStart, leadsUsed]
  );

  const leadsRemaining = Math.max(0, MONTHLY_LEAD_CAP - leadsUsed);
  const hasReachedMonthlyCap = enabled && leadsUsed >= MONTHLY_LEAD_CAP;

  return {
    leadsUsed,
    leadsRemaining,
    hasReachedMonthlyCap,
    cap: MONTHLY_LEAD_CAP,
    periodStart,
    isLoading,
    refresh,
    recordLeads,
  };
};
