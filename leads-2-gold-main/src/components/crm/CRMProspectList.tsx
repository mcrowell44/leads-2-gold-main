import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Phone, Mail, ExternalLink, Trash2 } from "lucide-react";
import { getCRMProspects, PIPELINE_STAGES, CRMProspect, getStageLabel, getStageColor, deleteProspect } from "@/services/crmService";
import { CRMProspectDetail } from "./CRMProspectDetail";
import { toast } from "sonner";
import { format } from "date-fns";

interface CRMProspectListProps {
  onUpdate: () => void;
}

export const CRMProspectList = ({ onUpdate }: CRMProspectListProps) => {
  const [prospects, setProspects] = useState<CRMProspect[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
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

  const handleDelete = async (prospectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this prospect?")) return;

    try {
      await deleteProspect(prospectId);
      toast.success("Prospect deleted");
      loadProspects();
      onUpdate();
    } catch (error) {
      toast.error("Failed to delete prospect");
    }
  };

  const filteredProspects = prospects.filter(prospect => {
    const matchesSearch = 
      prospect.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prospect.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prospect.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prospect.industry_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStage = stageFilter === "all" || prospect.stage === stageFilter;
    
    return matchesSearch && matchesStage;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>All Prospects</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search prospects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-[250px]"
                />
              </div>
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  {PIPELINE_STAGES.map(stage => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Last Contact</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProspects.map(prospect => (
                  <TableRow 
                    key={prospect.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedProspect(prospect)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{prospect.company_name}</p>
                        {prospect.city && prospect.state && (
                          <p className="text-xs text-muted-foreground">
                            {prospect.city}, {prospect.state}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{prospect.industry_name || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {prospect.contact_name && (
                          <span className="text-sm">{prospect.contact_name}</span>
                        )}
                        <div className="flex items-center gap-2">
                          {prospect.phone && (
                            <a 
                              href={`tel:${prospect.phone}`}
                              onClick={e => e.stopPropagation()}
                              className="text-primary hover:underline"
                            >
                              <Phone className="h-3 w-3" />
                            </a>
                          )}
                          {prospect.email && (
                            <a 
                              href={`mailto:${prospect.email}`}
                              onClick={e => e.stopPropagation()}
                              className="text-primary hover:underline"
                            >
                              <Mail className="h-3 w-3" />
                            </a>
                          )}
                          {prospect.website && (
                            <a 
                              href={prospect.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="text-primary hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStageColor(prospect.stage)} text-white border-0`}>
                        {getStageLabel(prospect.stage)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {prospect.lead_score ? (
                        <Badge variant="outline">{prospect.lead_score}</Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {prospect.last_contacted_at ? (
                        <span className="text-sm">
                          {format(new Date(prospect.last_contacted_at), 'MMM d, yyyy')}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={(e) => handleDelete(prospect.id, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                
                {filteredProspects.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No prospects found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

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
