import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, TrendingUp, Users, DollarSign, Target, Lightbulb, Star, Building2, MapPin } from 'lucide-react';
import { Industry } from '@/components/IndustryCard';

interface IndustryInsightsProps {
  industry: Industry;
  location: string;
  onBack: () => void;
  onShowLeads: (industry: Industry, location: string) => void;
}

export const IndustryInsights: React.FC<IndustryInsightsProps> = ({ 
  industry, 
  location, 
  onBack,
  onShowLeads 
}) => {
  const mockInsights = {
    marketSize: "$2.3B",
    growthRate: "12.5%",
    avgRevenue: "$450K",
    competitionLevel: "Medium",
    opportunities: [
      "Digital transformation increasing demand",
      "Growing remote work trends",
      "Increased focus on customer experience",
      "Sustainability initiatives driving growth"
    ],
    challenges: [
      "Skilled workforce shortage",
      "Rising operational costs",
      "Regulatory compliance requirements",
      "Technology adoption barriers"
    ],
    recommendations: [
      "Focus on digital service offerings",
      "Invest in employee training programs",
      "Develop strategic partnerships",
      "Implement data-driven decision making"
    ]
  };

  const handleGenerateLeads = () => {
    onShowLeads(industry, location);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Search
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{industry.name}</h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              <span>{industry.businessCount} businesses</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>{industry.rating}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button onClick={handleGenerateLeads} size="lg" className="flex-1">
          <Target className="h-5 w-5 mr-2" />
          Generate Leads
        </Button>
        <Button variant="outline" size="lg">
          <TrendingUp className="h-5 w-5 mr-2" />
          Market Analysis
        </Button>
      </div>

      {/* Market Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Market Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold">{mockInsights.marketSize}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold">{mockInsights.growthRate}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              <span className="text-2xl font-bold">{mockInsights.avgRevenue}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Competition</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-600" />
              <span className="text-2xl font-bold">{mockInsights.competitionLevel}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Market Opportunities
            </CardTitle>
            <CardDescription>
              Key growth drivers and opportunities in this industry
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {mockInsights.opportunities.map((opportunity, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-sm">{opportunity}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-red-600" />
              Industry Challenges
            </CardTitle>
            <CardDescription>
              Common obstacles and challenges to be aware of
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {mockInsights.challenges.map((challenge, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-sm">{challenge}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Strategic Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            Strategic Recommendations
          </CardTitle>
          <CardDescription>
            AI-powered insights for success in this industry
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {mockInsights.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <Badge variant="outline" className="mt-0.5">
                  {index + 1}
                </Badge>
                <span className="text-sm">{recommendation}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold">Ready to Generate Leads?</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get verified contact information for businesses in the {industry.name} industry. 
              Choose from 50, 100, or 250 leads with full CRM integration and CSV export.
            </p>
            <Button onClick={handleGenerateLeads} size="lg">
              Start Lead Generation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
