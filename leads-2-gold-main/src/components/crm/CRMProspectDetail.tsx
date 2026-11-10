import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Phone, Mail, Globe, MapPin, Star, Calendar, 
  MessageSquare, Clock, History, Lightbulb, ExternalLink 
} from "lucide-react";
import { 
  CRMProspect, PIPELINE_STAGES, getStageLabel, getStageColor,
  updateProspectStage, scheduleCallback, logContact, addNote, updateProspect
} from "@/services/crmService";
import { toast } from "sonner";
import { format } from "date-fns";

interface CRMProspectDetailProps {
  prospect: CRMProspect;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const CRMProspectDetail = ({ prospect, open, onClose, onUpdate }: CRMProspectDetailProps) => {
  const [activeTab, setActiveTab] = useState("details");
  const [stage, setStage] = useState(prospect.stage);
  const [callbackDate, setCallbackDate] = useState("");
  const [callbackNotes, setCallbackNotes] = useState("");
  const [contactNote, setContactNote] = useState("");
  const [generalNote, setGeneralNote] = useState(prospect.notes || "");
  const [saving, setSaving] = useState(false);

  const handleStageChange = async (newStage: string) => {
    if (newStage === stage) return;
    
    try {
      setSaving(true);
      await updateProspectStage(prospect.id, newStage, stage);
      setStage(newStage);
      toast.success(`Stage updated to ${getStageLabel(newStage)}`);
      onUpdate();
    } catch (error) {
      toast.error("Failed to update stage");
    } finally {
      setSaving(false);
    }
  };

  const handleScheduleCallback = async () => {
    if (!callbackDate || !callbackNotes) {
      toast.error("Please provide date and notes for callback");
      return;
    }

    try {
      setSaving(true);
      await scheduleCallback(prospect.id, callbackDate, callbackNotes);
      toast.success("Callback scheduled");
      setCallbackDate("");
      setCallbackNotes("");
      onUpdate();
    } catch (error) {
      toast.error("Failed to schedule callback");
    } finally {
      setSaving(false);
    }
  };

  const handleLogContact = async (type: 'email' | 'phone') => {
    if (!contactNote) {
      toast.error("Please add notes about the contact");
      return;
    }

    try {
      setSaving(true);
      await logContact(prospect.id, type, contactNote);
      toast.success(`${type === 'email' ? 'Email' : 'Call'} logged`);
      setContactNote("");
      onUpdate();
    } catch (error) {
      toast.error("Failed to log contact");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNote = async () => {
    try {
      setSaving(true);
      await addNote(prospect.id, generalNote);
      toast.success("Note saved");
      onUpdate();
    } catch (error) {
      toast.error("Failed to save note");
    } finally {
      setSaving(false);
    }
  };

  const painPoints = prospect.pain_points as Record<string, string[]> | null;
  const aiInsights = prospect.ai_insights as Record<string, unknown> | null;
  const contactHistory = (Array.isArray(prospect.contact_history) ? prospect.contact_history : []) as Array<{
    id?: string;
    type: string;
    content: string;
    timestamp: string;
    from_stage?: string;
    to_stage?: string;
  }>;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl">{prospect.company_name}</DialogTitle>
              {prospect.industry_name && (
                <p className="text-muted-foreground">{prospect.industry_name}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Select value={stage} onValueChange={handleStageChange} disabled={saving}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PIPELINE_STAGES.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${s.color}`} />
                        {s.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {prospect.lead_score && (
                <Badge variant="outline" className="text-lg px-3 py-1">
                  Score: {prospect.lead_score}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="callback">Callback</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="details" className="space-y-4 m-0">
              {/* Contact Info */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {prospect.contact_name && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{prospect.contact_name}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    {prospect.phone && (
                      <a 
                        href={`tel:${prospect.phone}`} 
                        className="flex items-center gap-2 text-primary hover:underline"
                      >
                        <Phone className="h-4 w-4" />
                        {prospect.phone}
                      </a>
                    )}
                    {prospect.email && (
                      <a 
                        href={`mailto:${prospect.email}`} 
                        className="flex items-center gap-2 text-primary hover:underline"
                      >
                        <Mail className="h-4 w-4" />
                        {prospect.email}
                      </a>
                    )}
                    {prospect.website && (
                      <a 
                        href={prospect.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary hover:underline"
                      >
                        <Globe className="h-4 w-4" />
                        Website
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {(prospect.city || prospect.state || prospect.address) && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {[prospect.address, prospect.city, prospect.state].filter(Boolean).join(', ')}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Google Info */}
              {(prospect.google_rating || prospect.google_reviews_count) && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Google Business</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      {prospect.google_rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-medium">{prospect.google_rating}</span>
                        </div>
                      )}
                      {prospect.google_reviews_count && (
                        <span className="text-muted-foreground">
                          ({prospect.google_reviews_count} reviews)
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Social Links */}
              {(prospect.facebook_url || prospect.instagram_url || prospect.linkedin_url || prospect.twitter_url) && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Social Profiles</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4">
                      {prospect.facebook_url && (
                        <a href={prospect.facebook_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          Facebook
                        </a>
                      )}
                      {prospect.instagram_url && (
                        <a href={prospect.instagram_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          Instagram
                        </a>
                      )}
                      {prospect.linkedin_url && (
                        <a href={prospect.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          LinkedIn
                        </a>
                      )}
                      {prospect.twitter_url && (
                        <a href={prospect.twitter_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          Twitter/X
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Textarea
                    value={generalNote}
                    onChange={(e) => setGeneralNote(e.target.value)}
                    placeholder="Add notes about this prospect..."
                    rows={4}
                  />
                  <Button onClick={handleSaveNote} disabled={saving} size="sm">
                    Save Notes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4 m-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Log a Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Contact Notes</Label>
                    <Textarea
                      value={contactNote}
                      onChange={(e) => setContactNote(e.target.value)}
                      placeholder="What was discussed?"
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleLogContact('phone')} 
                      disabled={saving || !contactNote}
                      className="flex-1"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Log Phone Call
                    </Button>
                    <Button 
                      onClick={() => handleLogContact('email')} 
                      disabled={saving || !contactNote}
                      variant="outline"
                      className="flex-1"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Log Email
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Contact */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Quick Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {prospect.phone && (
                    <Button asChild variant="outline" className="w-full justify-start">
                      <a href={`tel:${prospect.phone}`}>
                        <Phone className="h-4 w-4 mr-2" />
                        Call {prospect.phone}
                      </a>
                    </Button>
                  )}
                  {prospect.email && (
                    <Button asChild variant="outline" className="w-full justify-start">
                      <a href={`mailto:${prospect.email}`}>
                        <Mail className="h-4 w-4 mr-2" />
                        Email {prospect.email}
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="callback" className="space-y-4 m-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Schedule Callback</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Date & Time</Label>
                    <Input
                      type="datetime-local"
                      value={callbackDate}
                      onChange={(e) => setCallbackDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      value={callbackNotes}
                      onChange={(e) => setCallbackNotes(e.target.value)}
                      placeholder="Reason for callback, topics to discuss..."
                      rows={3}
                    />
                  </div>
                  <Button 
                    onClick={handleScheduleCallback} 
                    disabled={saving || !callbackDate || !callbackNotes}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Callback
                  </Button>
                </CardContent>
              </Card>

              {prospect.next_callback_at && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Upcoming Callback</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {format(new Date(prospect.next_callback_at), 'MMMM d, yyyy h:mm a')}
                      </span>
                    </div>
                    {prospect.callback_notes && (
                      <p className="mt-2 text-muted-foreground">{prospect.callback_notes}</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="insights" className="space-y-4 m-0">
              {/* Pain Points */}
              {painPoints && Object.keys(painPoints).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Pain Points
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(painPoints).map(([category, points]) => (
                        <div key={category}>
                          <p className="font-medium capitalize mb-1">{category}</p>
                          <ul className="list-disc list-inside text-sm text-muted-foreground">
                            {(points as string[]).map((point, i) => (
                              <li key={i}>{point}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Suggested Products */}
              {prospect.suggested_products && prospect.suggested_products.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Suggested Products/Services</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {prospect.suggested_products.map((product, i) => (
                        <Badge key={i} variant="secondary">{product}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Best Call Times */}
              {prospect.best_call_times && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Best Times to Call
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {JSON.stringify(prospect.best_call_times)}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Personalized Email */}
              {prospect.personalized_email && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Personalized Email Draft</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">
                      {prospect.personalized_email}
                    </pre>
                    {prospect.email && (
                      <Button asChild variant="outline" className="mt-3">
                        <a href={`mailto:${prospect.email}?body=${encodeURIComponent(prospect.personalized_email)}`}>
                          <Mail className="h-4 w-4 mr-2" />
                          Use This Email
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="history" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Contact History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {contactHistory.length > 0 ? (
                    <div className="space-y-4">
                      {[...contactHistory].reverse().map((entry, i) => (
                        <div key={entry.id || i} className="flex gap-3 border-l-2 border-muted pl-4 pb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {entry.type === 'phone' && <Phone className="h-3 w-3 mr-1" />}
                                {entry.type === 'email' && <Mail className="h-3 w-3 mr-1" />}
                                {entry.type === 'note' && <MessageSquare className="h-3 w-3 mr-1" />}
                                {entry.type === 'callback_scheduled' && <Calendar className="h-3 w-3 mr-1" />}
                                {entry.type === 'stage_change' && <History className="h-3 w-3 mr-1" />}
                                {entry.type.replace('_', ' ')}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(entry.timestamp), 'MMM d, yyyy h:mm a')}
                              </span>
                            </div>
                            <p className="text-sm">{entry.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No contact history yet</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
