import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Mail, User } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const leadCaptureSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  email: z.string().trim().email('Please enter a valid email address').max(255, 'Email is too long'),
});

interface LeadCaptureFormProps {
  onSubmit: (data: { name: string; email: string }) => void;
  onClose?: () => void;
}

export const LeadCaptureForm: React.FC<LeadCaptureFormProps> = ({ onSubmit, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      const validatedData = leadCaptureSchema.parse({ name: name.trim(), email: email.trim() });
      
      // Save to database
      const { error: dbError } = await supabase
        .from('free_trial_leads')
        .upsert(
          {
            name: validatedData.name,
            email: validatedData.email,
            captured_at: new Date().toISOString(),
          },
          { onConflict: 'email' }
        );

      if (dbError) {
        console.error('Error saving to database:', dbError);
        // Continue anyway - localStorage will work as fallback
      }

      // Store in localStorage
      localStorage.setItem('lead_capture_data', JSON.stringify({
        name: validatedData.name,
        email: validatedData.email,
        capturedAt: new Date().toISOString()
      }));

      toast.success('Welcome! You now have 2 free searches.');
      onSubmit({ name: validatedData.name, email: validatedData.email });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { name?: string; email?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0] === 'name') fieldErrors.name = err.message;
          if (err.path[0] === 'email') fieldErrors.email = err.message;
        });
        setErrors(fieldErrors);
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-primary/20 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Start Your Free Trial</CardTitle>
          <CardDescription className="text-base">
            Enter your details to get 2 free lead searches
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="John Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={errors.name ? 'border-red-500' : ''}
                maxLength={100}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="john@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={errors.email ? 'border-red-500' : ''}
                maxLength={255}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Get 2 Free Searches'}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              By continuing, you agree to receive updates about our services.
              <br />
              Already have an account?{' '}
              <a href="/auth" className="text-primary hover:underline">Sign in</a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
