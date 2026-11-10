import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight, Phone, Mail, Building2 } from "lucide-react";
import { getCRMProspects, PIPELINE_STAGES, CRMProspect, updateProspectStage, getStageColor } from "@/services/crmService";
import { CRMProspectDetail } from "./CRMProspectDetail";
import { toast } from "sonner";

interface CRMPipelineProps {
  onUpdate: () => void;
}

export const CRMPipeline = ({ onUpdate }: CRMPipelineProps) => {
  const [prospects, setProspects] = useState<CRMProspect[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProspect, setSelectedProspect] = useState<CRMProspect | null>(null);

  const loadProspects = async () => {
    try {
      setLoading(true);
      const data = await getCRMProspects();
      setProspects(data);
    } catch (error) {
      console.error("Error loading prospects:", error);
      toast.error("Failed to load prospects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProspects();
  }, []);

  const handleMoveStage = async (prospect: CRMProspect, direction: 'next' | 'prev') => {
    const currentIndex = PIPELINE_STAGES.findIndex(s => s.id === prospect.stage);
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    
    if (newIndex < 0 || newIndex >= PIPELINE_STAGES.length) return;
    
    const newStage = PIPELINE_STAGES[newIndex].id;
    
    try {
      await updateProspectStage(prospect.id, newStage, prospect.stage);
      toast.success(`Moved to ${PIPELINE_STAGES[newIndex].label}`);
      loadProspects();
      onUpdate();
    } catch (error) {
      toast.error("Failed to update stage");
    }
  };

  const getProspectsByStage = (stageId: string) => {
    return prospects.filter(p => p.stage === stageId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 overflow-x-auto">
        {PIPELINE_STAGES.map(stage => (
          <Card key={stage.id} className="min-w-[250px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                  {stage.label}
                </span>
                <Badge variant="secondary">{getProspectsByStage(stage.id).length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <ScrollArea className="h-[400px]">
                <div className="space-y-2 pr-2">
                  {getProspectsByStage(stage.id).map(prospect => (
                    <Card 
                      key={prospect.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedProspect(prospect)}
                    >
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{prospect.company_name}</p>
                              {prospect.industry_name && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {prospect.industry_name}
                                </p>
                              )}
                            </div>
                            {prospect.lead_score && (
                              <Badge variant="outline" className="ml-1 text-xs">
                                {prospect.lead_score}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {prospect.phone && (
                              <a 
                                href={`tel:${prospect.phone}`} 
                                onClick={e => e.stopPropagation()}
                                className="hover:text-primary"
                              >
                                <Phone className="h-3 w-3" />
                              </a>
                            )}
                            {prospect.email && (
                              <a 
                                href={`mailto:${prospect.email}`}
                                onClick={e => e.stopPropagation()}
                                className="hover:text-primary"
                              >
                                <Mail className="h-3 w-3" />
                              </a>
                            )}
                            {prospect.city && prospect.state && (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {prospect.city}, {prospect.state}
                              </span>
                            )}
                          </div>

                          {/* Quick stage move buttons */}
                          <div className="flex justify-end gap-1">
                            {stage.id !== 'new_lead' && stage.id !== 'won' && stage.id !== 'lost' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveStage(prospect, 'next');
                                }}
                              >
                                <ChevronRight className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {getProspectsByStage(stage.id).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No prospects
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Prospect Detail Dialog */}
      {selectedProspect && (
        <CRMProspectDetail
          prospect={selectedProspect}
          open={!!selectedProspect}
          onClose={() => setSelectedProspect(null)}
          onUpdate={() => {
            loadProspects();
            onUpdate();
          }}
        />
      )}
    </>
  );
};
