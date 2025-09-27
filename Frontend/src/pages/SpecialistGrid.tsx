import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft,
  Activity,
  Brain,
  Heart,
  Eye,
  Zap,
  Shield,
  Skull,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle
} from "lucide-react";

const SpecialistGrid = () => {
  const specialists = [
    {
      id: "infectious",
      name: "Infectious Disease",
      icon: Activity,
      status: "online",
      confidence: 87,
      activeCases: 12,
      avgResponseTime: "2.3 min",
      accuracy: "94%",
      recentCases: [
        { id: "BSG-001", diagnosis: "Bacterial Endocarditis", confidence: 92 },
        { id: "BSG-008", diagnosis: "Viral Meningitis", confidence: 78 },
        { id: "BSG-015", diagnosis: "Sepsis", confidence: 95 }
      ],
      capabilities: ["Culture Analysis", "Antibiotic Susceptibility", "Outbreak Detection"],
      lastUpdate: "2 min ago",
      modelVersion: "v2.4.1"
    },
    {
      id: "cardiology", 
      name: "Cardiology",
      icon: Heart,
      status: "online",
      confidence: 94,
      activeCases: 8,
      avgResponseTime: "1.8 min",
      accuracy: "96%",
      recentCases: [
        { id: "BSG-002", diagnosis: "STEMI", confidence: 98 },
        { id: "BSG-007", diagnosis: "Heart Failure", confidence: 89 },
        { id: "BSG-012", diagnosis: "Atrial Fibrillation", confidence: 85 }
      ],
      capabilities: ["ECG Analysis", "Echo Interpretation", "Risk Stratification"],
      lastUpdate: "1 min ago", 
      modelVersion: "v3.1.2"
    },
    {
      id: "neurology",
      name: "Neurology", 
      icon: Brain,
      status: "online",
      confidence: 76,
      activeCases: 5,
      avgResponseTime: "3.1 min",
      accuracy: "91%",
      recentCases: [
        { id: "BSG-003", diagnosis: "Multiple Sclerosis", confidence: 73 },
        { id: "BSG-009", diagnosis: "Migraine", confidence: 88 },
        { id: "BSG-014", diagnosis: "Seizure Disorder", confidence: 82 }
      ],
      capabilities: ["MRI Analysis", "EEG Interpretation", "Neuropsychological Assessment"],
      lastUpdate: "5 min ago",
      modelVersion: "v2.8.0"
    },
    {
      id: "oncology",
      name: "Oncology",
      icon: Skull,
      status: "degraded", 
      confidence: 82,
      activeCases: 3,
      avgResponseTime: "4.7 min",
      accuracy: "93%",
      recentCases: [
        { id: "BSG-004", diagnosis: "Lung Adenocarcinoma", confidence: 87 },
        { id: "BSG-010", diagnosis: "Lymphoma", confidence: 79 },
        { id: "BSG-016", diagnosis: "Breast Cancer", confidence: 91 }
      ],
      capabilities: ["Pathology Review", "Staging", "Treatment Planning"],
      lastUpdate: "15 min ago",
      modelVersion: "v1.9.3"
    },
    {
      id: "autoimmune",
      name: "Autoimmune & Rheumatology",
      icon: Shield,
      status: "online",
      confidence: 69,
      activeCases: 15,
      avgResponseTime: "2.9 min", 
      accuracy: "88%",
      recentCases: [
        { id: "BSG-001", diagnosis: "Systemic Lupus", confidence: 89 },
        { id: "BSG-006", diagnosis: "Rheumatoid Arthritis", confidence: 84 },
        { id: "BSG-011", diagnosis: "Vasculitis", confidence: 72 }
      ],
      capabilities: ["Autoantibody Interpretation", "Joint Analysis", "Immunosuppression Planning"],
      lastUpdate: "3 min ago",
      modelVersion: "v2.2.4"
    },
    {
      id: "toxicology",
      name: "Toxicology",
      icon: AlertCircle,
      status: "online", 
      confidence: 91,
      activeCases: 2,
      avgResponseTime: "1.5 min",
      accuracy: "97%",
      recentCases: [
        { id: "BSG-005", diagnosis: "Acetaminophen Toxicity", confidence: 96 },
        { id: "BSG-013", diagnosis: "Carbon Monoxide Poisoning", confidence: 94 }
      ],
      capabilities: ["Poison Identification", "Antidote Recommendations", "Environmental Exposure"],
      lastUpdate: "8 min ago",
      modelVersion: "v1.7.1"
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
            <h1 className="text-xl font-semibold">AI Specialist Grid</h1>
            <p className="text-sm text-muted-foreground">Multi-agent diagnostic system status and performance</p>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <Badge variant="outline" className="bg-success text-success-foreground">
              <CheckCircle className="mr-1 h-3 w-3" />
              6 Agents Online
            </Badge>
            <Button variant="outline">System Diagnostics</Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 space-y-6">
        {/* System Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              System Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">46</div>
                <div className="text-sm text-muted-foreground">Active Cases</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">2.4 min</div>
                <div className="text-sm text-muted-foreground">Avg Response Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">93.2%</div>
                <div className="text-sm text-muted-foreground">Overall Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">98.7%</div>
                <div className="text-sm text-muted-foreground">System Uptime</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Specialist Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {specialists.map((specialist) => (
            <Card key={specialist.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-lg">
                    <specialist.icon className="mr-3 h-6 w-6" />
                    {specialist.name}
                  </CardTitle>
                  <Badge 
                    variant={specialist.status === 'online' ? 'default' : 'destructive'}
                    className={specialist.status === 'online' ? 'bg-success' : ''}
                  >
                    {specialist.status}
                  </Badge>
                </div>
                <CardDescription>
                  Model {specialist.modelVersion} • Updated {specialist.lastUpdate}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Performance Metrics */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Confidence Level</span>
                    <span className="text-sm font-bold">{specialist.confidence}%</span>
                  </div>
                  <Progress value={specialist.confidence} className="h-2" />
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Active Cases</div>
                      <div className="font-semibold">{specialist.activeCases}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Accuracy</div>
                      <div className="font-semibold">{specialist.accuracy}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Avg Response</div>
                      <div className="font-semibold">{specialist.avgResponseTime}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Last Update</div>
                      <div className="font-semibold flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        {specialist.lastUpdate}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Cases */}
                <div>
                  <h4 className="font-medium mb-2 text-sm">Recent Cases</h4>
                  <div className="space-y-2">
                    {specialist.recentCases.map((case_) => (
                      <div key={case_.id} className="flex justify-between items-center p-2 bg-muted rounded-lg text-xs">
                        <div>
                          <div className="font-medium">{case_.id}</div>
                          <div className="text-muted-foreground">{case_.diagnosis}</div>
                        </div>
                        <Badge variant="outline">
                          {case_.confidence}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Capabilities */}
                <div>
                  <h4 className="font-medium mb-2 text-sm">Core Capabilities</h4>
                  <div className="flex flex-wrap gap-1">
                    {specialist.capabilities.map((capability) => (
                      <Badge key={capability} variant="secondary" className="text-xs">
                        {capability}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2">
                  <Button variant="outline" size="sm" className="w-full">
                    View Detailed Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Agent Interaction Matrix */}
        <Card>
          <CardHeader>
            <CardTitle>Agent Collaboration Matrix</CardTitle>
            <CardDescription>
              How specialists work together on complex cases requiring multi-disciplinary input
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 gap-2 text-xs">
              <div></div>
              {specialists.slice(0, 5).map((spec) => (
                <div key={spec.id} className="text-center font-medium p-2">
                  {spec.name.split(' ')[0]}
                </div>
              ))}
              
              {specialists.slice(0, 5).map((rowSpec, i) => (
                <div key={rowSpec.id} className="contents">
                  <div className="font-medium p-2">{rowSpec.name.split(' ')[0]}</div>
                  {specialists.slice(0, 5).map((colSpec, j) => (
                    <div 
                      key={colSpec.id} 
                      className={`p-2 text-center rounded ${
                        i === j ? 'bg-primary text-primary-foreground' :
                        Math.random() > 0.6 ? 'bg-success text-success-foreground' :
                        Math.random() > 0.3 ? 'bg-warning text-warning-foreground' :
                        'bg-muted'
                      }`}
                    >
                      {i === j ? '—' : Math.floor(Math.random() * 30 + 70) + '%'}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Values represent agreement rates when both specialists analyze the same case
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SpecialistGrid;