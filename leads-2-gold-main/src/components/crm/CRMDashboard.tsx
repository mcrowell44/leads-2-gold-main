import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users, Phone, Calendar, TrendingUp, Clock } from "lucide-react";
import { getCRMStats, getUpcomingCallbacks, PIPELINE_STAGES, CRMProspect } from "@/services/crmService";
import { CRMPipeline } from "./CRMPipeline";
import { CRMProspectList } from "./CRMProspectList";
import { toast } from "sonner";
import { format } from "date-fns";

export const CRMDashboard = () => {
  const [stats, setStats] = useState<{
    total: number;
    byStage: Record<string, number>;
    upcomingCallbacks: number;
    contactedToday: number;
  } | null>(null);
  const [upcomingCallbacks, setUpcomingCallbacks] = useState<CRMProspect[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pipeline");

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, callbacksData] = await Promise.all([
        getCRMStats(),
        getUpcomingCallbacks(),
      ]);
      setStats(statsData);
      setUpcomingCallbacks(callbacksData);
    } catch (error) {
      console.error("Error loading CRM data:", error);
      toast.error("Failed to load CRM data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Prospects</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">In your pipeline</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contacted Today</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.contactedToday || 0}</div>
            <p className="text-xs text-muted-foreground">Outreach made today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Callbacks</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.upcomingCallbacks || 0}</div>
            <p className="text-xs text-muted-foreground">Scheduled follow-ups</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Won Deals</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.byStage?.won || 0}</div>
            <p className="text-xs text-muted-foreground">Closed successfully</p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Stage Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pipeline Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {PIPELINE_STAGES.map(stage => (
              <Badge 
                key={stage.id} 
                variant="outline" 
                className={`${stage.color} text-white border-0`}
              >
                {stage.label}: {stats?.byStage?.[stage.id] || 0}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Callbacks */}
      {upcomingCallbacks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Upcoming Callbacks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingCallbacks.slice(0, 5).map(prospect => (
                <div 
                  key={prospect.id} 
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{prospect.company_name}</p>
                    <p className="text-sm text-muted-foreground">{prospect.callback_notes}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {prospect.next_callback_at && format(new Date(prospect.next_callback_at), 'MMM d, h:mm a')}
                    </p>
                    {prospect.phone && (
                      <a href={`tel:${prospect.phone}`} className="text-sm text-primary hover:underline">
                        {prospect.phone}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main CRM Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="mt-4">
          <CRMPipeline onUpdate={loadData} />
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <CRMProspectList onUpdate={loadData} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
