import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Webhook, Plus, Trash2, Check, X } from 'lucide-react';

interface WebhookConfig {
  id: string;
  webhook_type: string;
  webhook_url: string;
  is_active: boolean;
}

const WEBHOOK_TYPES = [
  { value: 'crm_export', label: 'CRM Export', description: 'Send leads to your CRM' },
  { value: 'email_campaign', label: 'Email Campaign', description: 'Trigger email sequences' },
  { value: 'notification', label: 'Notifications', description: 'Get alerts for high-value leads' },
];

export const WebhookSettings = () => {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookType, setNewWebhookType] = useState('crm_export');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('webhook_configs')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error loading webhooks:', error);
      return;
    }

    setWebhooks(data || []);
  };

  const addWebhook = async () => {
    if (!newWebhookUrl.trim()) {
      toast.error('Please enter a webhook URL');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please sign in to add webhooks');
      return;
    }

    setIsLoading(true);

    const { error } = await supabase
      .from('webhook_configs')
      .insert({
        user_id: user.id,
        webhook_type: newWebhookType,
        webhook_url: newWebhookUrl.trim(),
        is_active: true,
      });

    if (error) {
      toast.error('Failed to add webhook');
      console.error(error);
    } else {
      toast.success('Webhook added successfully');
      setNewWebhookUrl('');
      loadWebhooks();
    }

    setIsLoading(false);
  };

  const toggleWebhook = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('webhook_configs')
      .update({ is_active: !isActive })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update webhook');
    } else {
      loadWebhooks();
    }
  };

  const deleteWebhook = async (id: string) => {
    const { error } = await supabase
      .from('webhook_configs')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete webhook');
    } else {
      toast.success('Webhook deleted');
      loadWebhooks();
    }
  };

  const testWebhook = async (url: string, type: string) => {
    toast.info('Testing webhook...');
    
    try {
      const { data, error } = await supabase.functions.invoke('trigger-webhook', {
        body: {
          webhookUrl: url,
          webhookType: type,
          data: {
            test: true,
            message: 'Test webhook from Lead Prospector',
            timestamp: new Date().toISOString()
          }
        }
      });

      if (error) throw error;
      toast.success('Webhook test sent successfully!');
    } catch (error) {
      console.error('Webhook test error:', error);
      toast.error('Failed to test webhook');
    }
  };

  return (
    <Card className="bg-dust/90 border-leather">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-leather">
          <Webhook className="w-5 h-5" />
          n8n Webhook Integrations
        </CardTitle>
        <CardDescription className="text-leather/70">
          Connect your n8n workflows to automate lead exports, email campaigns, and notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add new webhook */}
        <div className="space-y-4 p-4 bg-leather/5 rounded-lg">
          <h4 className="font-medium text-leather">Add New Webhook</h4>
          <div className="flex gap-2">
            <select
              value={newWebhookType}
              onChange={(e) => setNewWebhookType(e.target.value)}
              className="px-3 py-2 border border-leather/30 rounded-md bg-white text-leather"
            >
              {WEBHOOK_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <Input
              value={newWebhookUrl}
              onChange={(e) => setNewWebhookUrl(e.target.value)}
              placeholder="https://your-n8n-instance.com/webhook/..."
              className="flex-1 border-leather/30"
            />
            <Button onClick={addWebhook} variant="rust" disabled={isLoading}>
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
        </div>

        {/* Existing webhooks */}
        <div className="space-y-3">
          {webhooks.length === 0 ? (
            <p className="text-center text-leather/60 py-4">
              No webhooks configured yet
            </p>
          ) : (
            webhooks.map((webhook) => (
              <div
                key={webhook.id}
                className="flex items-center gap-3 p-3 bg-white rounded-lg border border-leather/20"
              >
                <div className={`w-2 h-2 rounded-full ${webhook.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-leather text-sm">
                    {WEBHOOK_TYPES.find(t => t.value === webhook.webhook_type)?.label || webhook.webhook_type}
                  </p>
                  <p className="text-xs text-leather/60 truncate">{webhook.webhook_url}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testWebhook(webhook.webhook_url, webhook.webhook_type)}
                  >
                    Test
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleWebhook(webhook.id, webhook.is_active)}
                  >
                    {webhook.is_active ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteWebhook(webhook.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
