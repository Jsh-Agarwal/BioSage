import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft,
  Search,
  BookOpen,
  Lightbulb,
  Telescope,
  FileText,
  Download,
  ExternalLink,
  Beaker,
  Target,
  TrendingUp,
  Clock
} from "lucide-react";

const ResearchHub = () => {
  const [houseMode, setHouseMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const researchSuggestions = [
    {
      id: "rare-001",
      title: "Lupus-like Syndrome in Young Adults with Complement Deficiency",
      category: "rare-disease",
      confidence: 0.73,
      relevance: "High",
      description: "Investigate C1q deficiency presenting as SLE-like symptoms in patients under 30",
      suggestedActions: ["Genetic screening", "Family history analysis", "Immunological profiling"],
      similarCases: 3,
      literature: 12,
      priority: "medium"
    },
    {
      id: "drug-rep-002", 
      title: "Hydroxychloroquine Alternatives in Refractory Autoimmune Cases",
      category: "drug-repurposing",
      confidence: 0.85,
      relevance: "High",
      description: "Novel antimalarial compounds showing promise for treatment-resistant lupus",
      suggestedActions: ["Literature review", "Mechanism analysis", "Safety profile"],
      similarCases: 8,
      literature: 27,
      priority: "high"
    },
    {
      id: "analogy-003",
      title: "COVID-19 Induced Autoimmunity: Lessons from Viral Triggers",
      category: "analogical-reasoning", 
      confidence: 0.68,
      relevance: "Medium",
      description: "Post-viral autoimmune syndrome patterns applicable to current case",
      suggestedActions: ["Viral serology", "Temporal analysis", "Immune profiling"],
      similarCases: 15,
      literature: 89,
      priority: "low"
    }
  ];

  const clinicalTrials = [
    {
      id: "NCT05234567",
      title: "Phase II Trial of CAR-T Cell Therapy for Refractory Lupus",
      phase: "Phase II",
      status: "recruiting",
      location: "Multiple Centers",
      estimatedEnrollment: 120,
      eligibility: "Age 18-65, Active SLE, Failed ≥2 standard therapies",
      primaryEndpoint: "SLEDAI-2K reduction at 24 weeks",
      contactInfo: "Dr. Sarah Johnson, Johns Hopkins",
      matchScore: 0.89,
      distance: "12 miles"
    },
    {
      id: "NCT05876543",
      title: "Precision Medicine Approach to Lupus Treatment Selection",
      phase: "Phase III",
      status: "recruiting", 
      location: "Stanford Medical Center",
      estimatedEnrollment: 300,
      eligibility: "Newly diagnosed SLE, ANA positive",
      primaryEndpoint: "Time to treatment response",
      contactInfo: "Dr. Michael Chen, Stanford University",
      matchScore: 0.76,
      distance: "8 miles"
    },
    {
      id: "NCT05123890",
      title: "Biomarker-Guided Therapy in Lupus Nephritis",
      phase: "Phase II/III",
      status: "active",
      location: "Mayo Clinic",
      estimatedEnrollment: 200,
      eligibility: "Lupus nephritis, eGFR >30",
      primaryEndpoint: "Renal response at 52 weeks", 
      contactInfo: "Dr. Lisa Wang, Mayo Clinic",
      matchScore: 0.67,
      distance: "45 miles"
    }
  ];

  const researchBriefs = [
    {
      id: "brief-001",
      title: "Systemic Lupus Erythematosus: Current Diagnostic Challenges",
      author: "BioSage Research Team",
      dateGenerated: "2024-01-15",
      pages: 15,
      sections: ["Current Guidelines", "Diagnostic Gaps", "Emerging Biomarkers", "Technology Integration"],
      keyInsights: [
        "ANA testing sensitivity varies by substrate and technique",
        "Machine learning models show 94% accuracy in early diagnosis",
        "Multi-omics approaches reveal novel therapeutic targets"
      ],
      citationCount: 47,
      downloadCount: 234
    },
    {
      id: "brief-002", 
      title: "Drug Repurposing Opportunities in Autoimmune Disease",
      author: "AI Research Consortium",
      dateGenerated: "2024-01-10",
      pages: 23,
      sections: ["Computational Methods", "Clinical Evidence", "Regulatory Pathways", "Case Studies"],
      keyInsights: [
        "783 existing drugs show potential for autoimmune indications",
        "Network-based approaches identify unexpected therapeutic targets",
        "Regulatory fast-track pathways available for 15 compounds"
      ],
      citationCount: 63,
      downloadCount: 412
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex h-16 items-center px-6">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="ml-6">
            <h1 className="text-xl font-semibold">Research Hub</h1>
            <p className="text-sm text-muted-foreground">AI-curated research insights and clinical trial matching</p>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">House Mode</label>
              <Switch checked={houseMode} onCheckedChange={setHouseMode} />
            </div>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search research..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 space-y-6">
        <Tabs defaultValue="suggestions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="suggestions">Research Suggestions</TabsTrigger>
            <TabsTrigger value="trials">Clinical Trials</TabsTrigger>
            <TabsTrigger value="briefs">Research Briefs</TabsTrigger>
          </TabsList>

          {/* Research Suggestions Tab */}
          <TabsContent value="suggestions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="mr-2 h-5 w-5" />
                  AI-Curated Research Suggestions
                  {houseMode && <Badge className="ml-2 bg-warning text-warning-foreground">House Mode</Badge>}
                </CardTitle>
                <CardDescription>
                  {houseMode 
                    ? "Expanded search including rare diseases and analogical reasoning for complex presentations"
                    : "Standard research suggestions based on current case patterns"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {researchSuggestions.map((suggestion) => (
                    <Card key={suggestion.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold text-lg">{suggestion.title}</h3>
                              <Badge variant={
                                suggestion.priority === 'high' ? 'destructive' :
                                suggestion.priority === 'medium' ? 'default' :
                                'secondary'
                              }>
                                {suggestion.priority} priority
                              </Badge>
                              <Badge variant="outline">
                                {suggestion.category.replace('-', ' ')}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground">{suggestion.description}</p>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-sm text-muted-foreground">Confidence</div>
                            <div className="text-xl font-bold">{Math.round(suggestion.confidence * 100)}%</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <div className="text-lg font-semibold">{suggestion.similarCases}</div>
                            <div className="text-sm text-muted-foreground">Similar Cases</div>
                          </div>
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <div className="text-lg font-semibold">{suggestion.literature}</div>
                            <div className="text-sm text-muted-foreground">Literature Sources</div>
                          </div>
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <div className="text-lg font-semibold">{suggestion.relevance}</div>
                            <div className="text-sm text-muted-foreground">Relevance</div>
                          </div>
                        </div>

                        <div className="mb-4">
                          <h4 className="font-medium mb-2">Suggested Actions:</h4>
                          <div className="flex flex-wrap gap-2">
                            {suggestion.suggestedActions.map((action) => (
                              <Badge key={action} variant="secondary">{action}</Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button size="sm">
                            <Telescope className="mr-2 h-4 w-4" />
                            Explore Research
                          </Button>
                          <Button size="sm" variant="outline">
                            <BookOpen className="mr-2 h-4 w-4" />
                            View Literature
                          </Button>
                          <Button size="sm" variant="outline">
                            <FileText className="mr-2 h-4 w-4" />
                            Generate Brief
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clinical Trials Tab */}
          <TabsContent value="trials" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Beaker className="mr-2 h-5 w-5" />
                  Clinical Trial Matching
                </CardTitle>
                <CardDescription>
                  Relevant clinical trials based on patient characteristics and current case
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {clinicalTrials.map((trial) => (
                    <Card key={trial.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold text-lg">{trial.title}</h3>
                              <Badge variant={trial.status === 'recruiting' ? 'default' : 'secondary'}>
                                {trial.status}
                              </Badge>
                              <Badge variant="outline">{trial.phase}</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {trial.id} • {trial.location} • {trial.distance}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-sm text-muted-foreground">Match Score</div>
                            <div className="text-xl font-bold text-primary">{Math.round(trial.matchScore * 100)}%</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <h4 className="font-medium text-sm mb-1">Eligibility Criteria</h4>
                            <p className="text-sm text-muted-foreground">{trial.eligibility}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-sm mb-1">Primary Endpoint</h4>
                            <p className="text-sm text-muted-foreground">{trial.primaryEndpoint}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <div className="text-lg font-semibold">{trial.estimatedEnrollment}</div>
                            <div className="text-sm text-muted-foreground">Target Enrollment</div>
                          </div>
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <div className="text-lg font-semibold">{trial.distance}</div>
                            <div className="text-sm text-muted-foreground">Distance</div>
                          </div>
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <div className="text-lg font-semibold">{Math.round(trial.matchScore * 100)}%</div>
                            <div className="text-sm text-muted-foreground">Match Score</div>
                          </div>
                        </div>

                        <div className="mb-4 p-3 bg-accent-muted rounded-lg">
                          <h4 className="font-medium text-sm mb-1">Principal Investigator</h4>
                          <p className="text-sm">{trial.contactInfo}</p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button size="sm">
                            <Target className="mr-2 h-4 w-4" />
                            Check Eligibility
                          </Button>
                          <Button size="sm" variant="outline">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            ClinicalTrials.gov
                          </Button>
                          <Button size="sm" variant="outline">
                            <FileText className="mr-2 h-4 w-4" />
                            Contact PI
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Research Briefs Tab */}
          <TabsContent value="briefs" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Auto-Generated Research Briefs</h2>
                <p className="text-muted-foreground">Comprehensive reports on relevant medical topics</p>
              </div>
              <Button>
                <FileText className="mr-2 h-4 w-4" />
                Generate New Brief
              </Button>
            </div>

            <div className="space-y-4">
              {researchBriefs.map((brief) => (
                <Card key={brief.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="space-y-2 flex-1">
                        <h3 className="font-semibold text-lg">{brief.title}</h3>
                        <div className="text-sm text-muted-foreground">
                          By {brief.author} • Generated {brief.dateGenerated} • {brief.pages} pages
                        </div>
                      </div>
                      <Badge variant="outline" className="ml-4">
                        {brief.citationCount} citations
                      </Badge>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium text-sm mb-2">Sections Covered</h4>
                      <div className="flex flex-wrap gap-2">
                        {brief.sections.map((section) => (
                          <Badge key={section} variant="secondary">{section}</Badge>
                        ))}
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium text-sm mb-2">Key Insights</h4>
                      <ul className="space-y-1">
                        {brief.keyInsights.map((insight, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start">
                            <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <TrendingUp className="mr-1 h-3 w-3" />
                          {brief.citationCount} citations
                        </div>
                        <div className="flex items-center">
                          <Download className="mr-1 h-3 w-3" />
                          {brief.downloadCount} downloads
                        </div>
                        <div className="flex items-center">
                          <Clock className="mr-1 h-3 w-3" />
                          {brief.dateGenerated}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <FileText className="mr-2 h-4 w-4" />
                          Preview
                        </Button>
                        <Button size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ResearchHub;