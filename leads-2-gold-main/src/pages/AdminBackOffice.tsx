import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Users, CreditCard, Mail, Search, Send, Loader2, UserCheck, UserX, Briefcase } from 'lucide-react';
import { CRMDashboard } from '@/components/crm/CRMDashboard';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Subscriber {
  id: string;
  email: string;
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
  created_at: string;
}

interface FreeTrialLead {
  id: string;
  name: string;
  email: string;
  searches_used: number;
  converted_to_paid: boolean;
  captured_at: string;
  last_search_at: string | null;
}

const AdminBackOffice: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [freeTrialLeads, setFreeTrialLeads] = useState<FreeTrialLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailTarget, setEmailTarget] = useState<'paid' | 'free' | 'all'>('all');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Admin emails
  const ADMIN_EMAILS = ['marcuscrowell44@gmail.com', 'marcus@play44sports.com', 'marcus@cdmweb.store', 'marcus_crowell@yahoo.com', 'marcus@zapai.io'];

  useEffect(() => {
    if (!authLoading && user) {
      checkAdminAndLoadData();
    } else if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading]);

  const checkAdminAndLoadData = async () => {
    if (!user?.email) {
      navigate('/');
      return;
    }

    const userEmail = user.email.toLowerCase();
    const isAdminByEmail = ADMIN_EMAILS.some(e => e.toLowerCase() === userEmail);

    if (!isAdminByEmail) {
      // Check database
      const { data } = await supabase
        .from('admin_users')
        .select('is_active')
        .eq('email', user.email)
        .eq('is_active', true)
        .maybeSingle();

      if (!data) {
        toast.error('Access denied. Admin privileges required.');
        navigate('/');
        return;
      }
    }

    setIsAdmin(true);
    await loadData();
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Load subscribers
      const { data: subs, error: subsError } = await supabase
        .from('subscribers')
        .select('*')
        .order('created_at', { ascending: false });

      if (subsError) throw subsError;
      setSubscribers(subs || []);

      // Load free trial leads
      const { data: leads, error: leadsError } = await supabase
        .from('free_trial_leads')
        .select('*')
        .order('captured_at', { ascending: false });

      if (leadsError) throw leadsError;
      setFreeTrialLeads(leads || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filteredSubscribers = subscribers.filter(s =>
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFreeTrialLeads = freeTrialLeads.filter(l =>
    l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paidSubscribers = filteredSubscribers.filter(s => s.subscribed);
  const inactiveSubscribers = filteredSubscribers.filter(s => !s.subscribed);

  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailContent.trim()) {
      toast.error('Please fill in subject and content');
      return;
    }

    setSendingEmail(true);
    try {
      let recipients: string[] = [];

      if (emailTarget === 'paid' || emailTarget === 'all') {
        recipients.push(...paidSubscribers.map(s => s.email));
      }
      if (emailTarget === 'free' || emailTarget === 'all') {
        recipients.push(...filteredFreeTrialLeads.filter(l => !l.converted_to_paid).map(l => l.email));
      }

      if (recipients.length === 0) {
        toast.error('No recipients found');
        return;
      }

      const { error } = await supabase.functions.invoke('send-admin-email', {
        body: {
          recipients,
          subject: emailSubject,
          content: emailContent
        }
      });

      if (error) throw error;

      toast.success(`Email sent to ${recipients.length} recipients`);
      setEmailDialogOpen(false);
      setEmailSubject('');
      setEmailContent('');
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Admin Back Office</h1>
              <p className="text-muted-foreground">Manage users and subscriptions</p>
            </div>
          </div>
          <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Mail className="h-4 w-4" />
                Send Email Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Send Email Campaign</DialogTitle>
                <DialogDescription>
                  Send an email to your users
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Recipients</label>
                  <div className="flex gap-2">
                    <Button
                      variant={emailTarget === 'paid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setEmailTarget('paid')}
                    >
                      Paid ({paidSubscribers.length})
                    </Button>
                    <Button
                      variant={emailTarget === 'free' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setEmailTarget('free')}
                    >
                      Free Trial ({filteredFreeTrialLeads.filter(l => !l.converted_to_paid).length})
                    </Button>
                    <Button
                      variant={emailTarget === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setEmailTarget('all')}
                    >
                      All Users
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Subject</label>
                  <Input
                    placeholder="Email subject..."
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Content</label>
                  <Textarea
                    placeholder="Email content..."
                    value={emailContent}
                    onChange={(e) => setEmailContent(e.target.value)}
                    rows={6}
                  />
                </div>
                <Button 
                  onClick={handleSendEmail} 
                  disabled={sendingEmail}
                  className="w-full gap-2"
                >
                  {sendingEmail ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Send Email
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <CreditCard className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{paidSubscribers.length}</p>
                  <p className="text-sm text-muted-foreground">Paid Subscribers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                  <Users className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{freeTrialLeads.length}</p>
                  <p className="text-sm text-muted-foreground">Free Trial Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <UserCheck className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {freeTrialLeads.filter(l => l.converted_to_paid).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Conversions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <UserX className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{inactiveSubscribers.length}</p>
                  <p className="text-sm text-muted-foreground">Inactive Subs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="crm" className="space-y-4">
          <TabsList>
            <TabsTrigger value="crm" className="gap-2">
              <Briefcase className="h-4 w-4" />
              Sales CRM
            </TabsTrigger>
            <TabsTrigger value="paid" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Paid Subscribers ({paidSubscribers.length})
            </TabsTrigger>
            <TabsTrigger value="free" className="gap-2">
              <Users className="h-4 w-4" />
              Free Trial Users ({filteredFreeTrialLeads.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="crm">
            <CRMDashboard />
          </TabsContent>

          <TabsContent value="paid">
            <Card>
              <CardHeader>
                <CardTitle>Paid Subscribers</CardTitle>
                <CardDescription>Users with active subscriptions</CardDescription>
              </CardHeader>
              <CardContent>
                {paidSubscribers.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No paid subscribers yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Tier</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paidSubscribers.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell className="font-medium">{sub.email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{sub.subscription_tier || 'Pro'}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="default" className="bg-green-600">Active</Badge>
                          </TableCell>
                          <TableCell>
                            {sub.subscription_end 
                              ? new Date(sub.subscription_end).toLocaleDateString()
                              : 'Never'}
                          </TableCell>
                          <TableCell>
                            {new Date(sub.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="free">
            <Card>
              <CardHeader>
                <CardTitle>Free Trial Users</CardTitle>
                <CardDescription>Users who signed up for free trial</CardDescription>
              </CardHeader>
              <CardContent>
                {filteredFreeTrialLeads.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No free trial users yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Searches Used</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Signed Up</TableHead>
                        <TableHead>Last Search</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFreeTrialLeads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell className="font-medium">{lead.name}</TableCell>
                          <TableCell>{lead.email}</TableCell>
                          <TableCell>
                            <Badge variant={lead.searches_used >= 2 ? 'destructive' : 'secondary'}>
                              {lead.searches_used}/2
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {lead.converted_to_paid ? (
                              <Badge variant="default" className="bg-green-600">Converted</Badge>
                            ) : lead.searches_used >= 2 ? (
                              <Badge variant="outline">Limit Reached</Badge>
                            ) : (
                              <Badge variant="secondary">Active Trial</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(lead.captured_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {lead.last_search_at 
                              ? new Date(lead.last_search_at).toLocaleDateString()
                              : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminBackOffice;
