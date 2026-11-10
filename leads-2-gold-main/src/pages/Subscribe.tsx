import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Zap, ArrowLeft, CreditCard, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Subscribe: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isSubscribed, isAdmin, subscriptionEnd } = useSubscriptionStatus();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isManaging, setIsManaging] = useState(false);

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
    'Access to all industries',
    'Priority support',
    'Advanced analytics'
  ];

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

  const handleManageSubscription = async () => {
    setIsManaging(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Portal error:', error);
      toast.error('Failed to open subscription management.');
    } finally {
      setIsManaging(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Upgrade to Pro</h1>
            <p className="text-xl text-muted-foreground">
              Unlock unlimited access to all lead generation features
            </p>
          </div>

          <Card className={`shadow-xl ${isSubscribed || isAdmin ? 'border-green-500/50 border-2' : 'border-primary/20'}`}>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              {(isSubscribed || isAdmin) && (
                <div className="inline-block mx-auto bg-green-500/10 text-green-600 text-sm font-semibold px-3 py-1 rounded-full mb-2">
                  ✅ {isAdmin ? 'Admin Access' : 'Your Plan'}
                </div>
              )}
              <CardTitle className="text-2xl">Pro Plan</CardTitle>
              <CardDescription>Everything you need to generate leads</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-primary">$259.99</div>
                <div className="text-muted-foreground">per month</div>
              </div>

              {subscriptionEnd && (
                <p className="text-center text-sm text-muted-foreground">
                  Renews on {new Date(subscriptionEnd).toLocaleDateString()}
                </p>
              )}

              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {isSubscribed || isAdmin ? (
                <Button 
                  onClick={handleManageSubscription}
                  size="lg"
                  variant="outline"
                  className="w-full gap-2"
                  disabled={isManaging || isAdmin}
                >
                  {isManaging ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                  {isAdmin ? 'Admin — Free Access' : 'Manage Subscription'}
                </Button>
              ) : (
                <Button 
                  onClick={handleSubscribe}
                  size="lg"
                  className="w-full gap-2"
                  disabled={isCheckingOut}
                >
                  {isCheckingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                  {isAuthenticated ? 'Subscribe Now' : 'Sign Up to Subscribe'}
                </Button>
              )}

              <p className="text-xs text-center text-muted-foreground">
                Cancel anytime. No long-term commitment required.
              </p>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Questions? Contact us at{' '}
            <a href="mailto:marcus@play44sports.com" className="text-primary hover:underline">
              marcus@play44sports.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Subscribe;
