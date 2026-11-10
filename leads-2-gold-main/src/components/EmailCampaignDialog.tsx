import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Send, Sparkles, Mail, Users, Clock, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Lead } from '@/services/leadGenerationService';

interface EmailCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: Lead[];
  industryName: string;
}

export const EmailCampaignDialog: React.FC<EmailCampaignDialogProps> = ({
  open,
  onOpenChange,
  leads,
  industryName
}) => {
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [subject, setSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [totalToSend, setTotalToSend] = useState(0);
  const [useN8n, setUseN8n] = useState(true);

  const leadsWithEmail = leads.filter(lead => lead.email || lead.owner_email);

  useEffect(() => {
    if (open && leadsWithEmail.length > 0 && !selectedLead) {
      setSelectedLead(leadsWithEmail[0]);
    }
  }, [open, leadsWithEmail]);

  useEffect(() => {
    if (selectedLead && mode === 'single') {
      generateEmailForLead(selectedLead);
    }
  }, [selectedLead, mode]);

  const generateEmailForLead = async (lead: Lead) => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-email', {
        body: {
          lead: {
            companyName: lead.company_name,
            contactName: lead.contact_name,
            industryName: lead.industry_name || industryName,
            email: lead.owner_email || lead.email,
            website: lead.website,
            painPoints: lead.pain_points
          }
        }
      });

      if (error) throw error;

      if (data?.subject && data?.body) {
        setSubject(data.subject);
        setEmailBody(data.body);
      }
    } catch (error) {
      console.error('Error generating email:', error);
      toast.error('Failed to generate email. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const sendViaN8n = async (to: string, subj: string, body: string, lead: Lead) => {
    const { data, error } = await supabase.functions.invoke('send-n8n-email', {
      body: {
        to,
        subject: subj,
        body,
        recipientName: lead.contact_name,
        companyName: lead.company_name,
        industry: lead.industry_name || industryName
      }
    });
    
    if (error) throw error;
    return data;
  };

  const handleSendSingle = async () => {
    if (!selectedLead?.email && !selectedLead?.owner_email) {
      toast.error('No email address available for this lead');
      return;
    }

    const emailTo = selectedLead.owner_email || selectedLead.email;

    if (useN8n) {
      setSending(true);
      try {
        await sendViaN8n(emailTo!, subject, emailBody, selectedLead);
        toast.success(`Email sent to ${selectedLead.company_name} via n8n`);
        onOpenChange(false);
      } catch (error) {
        console.error('n8n email error:', error);
        toast.error('Failed to send via n8n. Try using mailto instead.');
      } finally {
        setSending(false);
      }
    } else {
      const mailtoLink = `mailto:${emailTo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
      window.open(mailtoLink, '_blank');
      toast.success(`Email compose window opened for ${selectedLead.company_name}`);
    }
  };

  const handleSendBatch = async () => {
    if (leadsWithEmail.length === 0) {
      toast.error('No leads with email addresses available');
      return;
    }

    setSending(true);
    setTotalToSend(leadsWithEmail.length);
    setSentCount(0);

    let successCount = 0;

    for (let i = 0; i < leadsWithEmail.length; i++) {
      const lead = leadsWithEmail[i];
      
      try {
        const { data, error } = await supabase.functions.invoke('generate-email', {
          body: {
            lead: {
              companyName: lead.company_name,
              contactName: lead.contact_name,
              industryName: lead.industry_name || industryName,
              email: lead.owner_email || lead.email,
              website: lead.website,
              painPoints: lead.pain_points
            }
          }
        });

        if (!error && data?.subject && data?.body) {
          const emailTo = lead.owner_email || lead.email;

          if (useN8n) {
            await sendViaN8n(emailTo!, data.subject, data.body, lead);
            successCount++;
          } else {
            const mailtoLink = `mailto:${emailTo}?subject=${encodeURIComponent(data.subject)}&body=${encodeURIComponent(data.body)}`;
            window.open(mailtoLink, '_blank');
            successCount++;
          }
        }

        setSentCount(i + 1);

        // 6 second delay between emails (except for the last one)
        if (i < leadsWithEmail.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 6000));
        }
      } catch (error) {
        console.error(`Error processing email for ${lead.company_name}:`, error);
      }
    }

    setSending(false);
    toast.success(`${useN8n ? 'Sent' : 'Opened'} ${successCount} emails${useN8n ? ' via n8n' : ''}`);
    onOpenChange(false);
  };

  const regenerateEmail = () => {
    if (selectedLead) {
      generateEmailForLead(selectedLead);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Campaign Composer
          </DialogTitle>
          <DialogDescription>
            Create AI-powered personalized emails for your leads
          </DialogDescription>
        </DialogHeader>

        {/* n8n Toggle */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-medium">Send via n8n</p>
              <p className="text-xs text-muted-foreground">Automatically send through connected Gmail/Google Workspace</p>
            </div>
          </div>
          <Switch checked={useN8n} onCheckedChange={setUseN8n} />
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={mode === 'single' ? 'default' : 'outline'}
            onClick={() => setMode('single')}
            className="flex-1"
          >
            <Mail className="h-4 w-4 mr-2" />
            Single Email
          </Button>
          <Button
            variant={mode === 'batch' ? 'default' : 'outline'}
            onClick={() => setMode('batch')}
            className="flex-1"
          >
            <Users className="h-4 w-4 mr-2" />
            Batch Campaign ({leadsWithEmail.length})
          </Button>
        </div>

        {mode === 'single' ? (
          <>
            {/* Lead Selector */}
            <div className="space-y-2">
              <Label>Select Lead</Label>
              <select
                className="w-full p-2 border rounded-md bg-background"
                value={selectedLead?.id || selectedLead?.company_name || ''}
                onChange={(e) => {
                  const lead = leadsWithEmail.find(
                    l => (l.id || l.company_name) === e.target.value
                  );
                  if (lead) setSelectedLead(lead);
                }}
              >
                {leadsWithEmail.map((lead, idx) => (
                  <option key={lead.id || idx} value={lead.id || lead.company_name}>
                    {lead.company_name} - {lead.owner_email || lead.email}
                  </option>
                ))}
              </select>
            </div>

            {selectedLead && (
              <div className="bg-muted/50 p-3 rounded-lg text-sm space-y-1">
                <p><strong>To:</strong> {selectedLead.contact_name || 'Business Owner'}</p>
                <p><strong>Email:</strong> {selectedLead.owner_email || selectedLead.email}</p>
                <p><strong>Company:</strong> {selectedLead.company_name}</p>
              </div>
            )}

            {/* Email Compose */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Subject Line</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject..."
                  disabled={generating}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Email Body</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={regenerateEmail}
                    disabled={generating}
                  >
                    {generating ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-1" />
                    )}
                    Regenerate
                  </Button>
                </div>
                <Textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Email content..."
                  rows={10}
                  disabled={generating}
                  className="font-mono text-sm"
                />
              </div>
            </div>

            <Button
              onClick={handleSendSingle}
              disabled={generating || !subject || !emailBody}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              Open Email Compose
            </Button>
          </>
        ) : (
          <>
            {/* Batch Mode */}
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Batch Email Campaign
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  This will generate personalized emails for each lead and open compose windows with a 6-second delay between each to avoid overwhelming your email client.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Leads with Email ({leadsWithEmail.length})</Label>
                <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-1">
                  {leadsWithEmail.map((lead, idx) => (
                    <div key={lead.id || idx} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                      <span className="font-medium">{lead.company_name}</span>
                      <Badge variant="outline" className="text-xs">
                        {lead.owner_email || lead.email}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {sending && (
                <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                    <span className="font-medium text-green-800 dark:text-green-200">
                      Sending emails...
                    </span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Progress: {sentCount} / {totalToSend} emails opened
                  </p>
                  <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2 mt-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${(sentCount / totalToSend) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={handleSendBatch}
              disabled={sending || leadsWithEmail.length === 0}
              className="w-full"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Opening Emails ({sentCount}/{totalToSend})...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Start Batch Campaign ({leadsWithEmail.length} emails)
                </>
              )}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
