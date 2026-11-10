import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Zap, Check, CreditCard, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SubscriptionPaywallProps {
  remainingSearches?: number;
  onClose?: () => void;
}

export const SubscriptionPaywall: React.FC<SubscriptionPaywallProps> = ({ 
  remainingSearches = 0,
  onClose 
}) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isCheckingOut, setIsCheckingOut] = React.useState(false);

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    setIsCheckingOut(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const features = [
    '2,500 quality leads per month',
    'Business Insights',
    'Sales Plan of Action',
    'Built-in Objection Handling',
    'Import Prospect Files (CSV, TXT, XLS, plain text)',
    'Full CRM access with autosave',
    'AI-powered lead enrichment',
    'Export leads to CSV',
    'Email campaign integration',
    'Priority support'
  ];

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-primary/20 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            {!isAuthenticated ? 'Sign In Required' : 'Free Trial Limit Reached'}
          </CardTitle>
          <CardDescription className="text-base">
            {!isAuthenticated 
              ? 'Sign in or create an account to search for leads.'
              : remainingSearches === 0 
                ? "You've used your 2 free searches."
                : `You have ${remainingSearches} free search${remainingSearches === 1 ? '' : 'es'} remaining.`
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-primary" />
              <span className="font-semibold">Unlock Full Access</span>
            </div>
            <ul className="space-y-2">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-primary">$259.99</div>
            <div className="text-sm text-muted-foreground">per month</div>
          </div>

          <div className="space-y-3">
            {!isAuthenticated ? (
              <Button 
                onClick={() => navigate('/auth')} 
                className="w-full gap-2"
                size="lg"
              >
                Sign In / Create Account
              </Button>
            ) : (
              <Button 
                onClick={handleSubscribe} 
                className="w-full gap-2"
                size="lg"
                disabled={isCheckingOut}
              >
                {isCheckingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                Subscribe Now
              </Button>
            )}
            {onClose && (
              <Button 
                variant="ghost" 
                onClick={onClose}
                className="w-full"
              >
                Maybe Later
              </Button>
            )}
          </div>

          {!isAuthenticated && (
            <p className="text-xs text-center text-muted-foreground">
              Already have an account?{' '}
              <button 
                onClick={() => navigate('/auth')}
                className="text-primary hover:underline"
              >
                Sign in
              </button>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
