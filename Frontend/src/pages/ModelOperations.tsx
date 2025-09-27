import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft,
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  CheckCircle,
  Clock,
  GitBranch,
  LineChart,
  Monitor,
  Settings,
  TrendingUp,
  Users,
  Zap
} from "lucide-react";

const ModelOperations = () => {
  const modelVersions = [
    {
      id: "v3.2.1",
      name: "BioSage Integrator",
      status: "production",
      accuracy: 94.7,
      deployedAt: "2024-01-15 14:30",
      trainingData: "847K cases",
      performance: {
        avgResponseTime: "1.8s",
        throughput: "450 req/min",
        errorRate: "0.03%"
      }
    },
    {
      id: "v2.8.3", 
      name: "Cardiology Specialist",
      status: "production",
      accuracy: 96.2,
      deployedAt: "2024-01-12 09:15",
      trainingData: "312K cases",
      performance: {
        avgResponseTime: "1.2s",
        throughput: "380 req/min", 
        errorRate: "0.01%"
      }
    },
    {
      id: "v3.3.0-beta",
      name: "Multi-modal Integrator",
      status: "staging",
      accuracy: 95.8,
      deployedAt: "2024-01-18 11:45", 
      trainingData: "1.2M cases",
      performance: {
        avgResponseTime: "2.1s",
        throughput: "320 req/min",
        errorRate: "0.05%"
      }
    }
  ];

  const driftAlerts = [
    {
      id: "drift-001",
      modelId: "v2.4.1",
      specialist: "Infectious Disease",
      severity: "medium",
      detectedAt: "2024-01-18 08:30",
      metric: "Prediction confidence distribution",
      description: "Average confidence decreased by 8% over last 48 hours",
      affectedCases: 23,
      recommendation: "Review recent training data quality"
    },
    {
      id: "drift-002", 
      modelId: "v1.9.3",
      specialist: "Oncology",
      severity: "low",
      detectedAt: "2024-01-17 15:20",
      metric: "Feature importance shift",
      description: "Lab value weights have shifted for staging algorithms",
      affectedCases: 7,
      recommendation: "Schedule routine retraining"
    }
  ];

  const performanceMetrics = {
    overallUptime: 99.97,
    avgLatency: 1.6,
    requestsToday: 15847,
    errorsToday: 12,
    modelsActive: 6,
    accuracyTrend: "+0.3%"
  };

  const calibrationData = [
    { specialist: "Infectious", predicted: 85, actual: 82, cases: 156 },
    { specialist: "Cardiology", predicted: 92, actual: 94, cases: 98 },
    { specialist: "Neurology", predicted: 78, actual: 76, cases: 67 },
    { specialist: "Oncology", predicted: 88, actual: 85, cases: 43 },
    { specialist: "Autoimmune", predicted: 81, actual: 83, cases: 189 },
    { specialist: "Toxicology", predicted: 95, actual: 97, cases: 21 }
  ];

  const feedbackQueue = [
    {
      id: "fb-001",
      caseId: "BSG-2024-001",
      clinician: "Dr. Sarah Chen", 
      timestamp: "2024-01-18 14:20",
      modelPrediction: "Systemic Lupus (87%)",
      clinicianDx: "Mixed Connective Tissue Disease",
      feedback: "Patient responded to anti-RNP treatment, supports MCTD diagnosis",
      priority: "high",
      processed: false
    },
    {
      id: "fb-002",
      caseId: "BSG-2024-008",
      clinician: "Dr. Michael Kim",
      timestamp: "2024-01-18 11:45", 
      modelPrediction: "Viral Meningitis (78%)",
      clinicianDx: "Bacterial Meningitis",
      feedback: "CSF culture positive for S. pneumoniae, antibiotic response confirmed",
      priority: "high",
      processed: false
    },
    {
      id: "fb-003",
      caseId: "BSG-2024-012",
      clinician: "Dr. Lisa Wang",
      timestamp: "2024-01-18 09:30",
      modelPrediction: "STEMI (95%)", 
      clinicianDx: "STEMI",
      feedback: "Excellent prediction accuracy, rapid diagnosis enabled immediate intervention",
      priority: "medium",
      processed: true
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
            <h1 className="text-xl font-semibold">Model Operations & Explainability</h1>
            <p className="text-sm text-muted-foreground">AI system monitoring, performance metrics, and model governance</p>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <Badge variant="outline" className="bg-success text-success-foreground">
              <Activity className="mr-1 h-3 w-3" />
              All Models Healthy
            </Badge>
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              System Config
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 space-y-6">
        {/* System Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Monitor className="mr-2 h-5 w-5" />
              System Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{performanceMetrics.overallUptime}%</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{performanceMetrics.avgLatency}s</div>
                <div className="text-sm text-muted-foreground">Avg Latency</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{performanceMetrics.requestsToday.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Requests Today</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{performanceMetrics.errorsToday}</div>
                <div className="text-sm text-muted-foreground">Errors Today</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{performanceMetrics.modelsActive}</div>
                <div className="text-sm text-muted-foreground">Active Models</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">{performanceMetrics.accuracyTrend}</div>
                <div className="text-sm text-muted-foreground">Accuracy Trend</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="versions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="versions">Model Versions</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="drift">Drift Monitoring</TabsTrigger>
            <TabsTrigger value="feedback">Feedback Queue</TabsTrigger>
          </TabsList>

          {/* Model Versions Tab */}
          <TabsContent value="versions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <GitBranch className="mr-2 h-5 w-5" />
                  Model Version Management
                </CardTitle>
                <CardDescription>
                  Track deployed models, performance metrics, and rollback capabilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {modelVersions.map((model) => (
                    <Card key={model.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold text-lg">{model.name}</h3>
                              <Badge variant={model.status === 'production' ? 'default' : 'secondary'}>
                                {model.status}
                              </Badge>
                              <Badge variant="outline">{model.id}</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Deployed: {model.deployedAt} • Training: {model.trainingData}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-sm text-muted-foreground">Accuracy</div>
                            <div className="text-xl font-bold text-primary">{model.accuracy}%</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <div className="text-lg font-semibold">{model.performance.avgResponseTime}</div>
                            <div className="text-sm text-muted-foreground">Avg Response</div>
                          </div>
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <div className="text-lg font-semibold">{model.performance.throughput}</div>
                            <div className="text-sm text-muted-foreground">Throughput</div>
                          </div>
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <div className="text-lg font-semibold">{model.performance.errorRate}</div>
                            <div className="text-sm text-muted-foreground">Error Rate</div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline">
                            <LineChart className="mr-2 h-4 w-4" />
                            View Metrics
                          </Button>
                          <Button size="sm" variant="outline">
                            <Settings className="mr-2 h-4 w-4" />
                            Configure
                          </Button>
                          {model.status === 'staging' && (
                            <Button size="sm">
                              <Zap className="mr-2 h-4 w-4" />
                              Deploy to Prod
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="mr-2 h-5 w-5" />
                    Calibration Analysis
                  </CardTitle>
                  <CardDescription>
                    How well model confidence matches actual accuracy
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {calibrationData.map((item) => (
                      <div key={item.specialist} className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium">{item.specialist}</span>
                          <span className="text-muted-foreground">{item.cases} cases</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Predicted</div>
                            <div className="flex items-center space-x-2">
                              <Progress value={item.predicted} className="flex-1 h-2" />
                              <span className="text-xs font-medium w-10">{item.predicted}%</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Actual</div>
                            <div className="flex items-center space-x-2">
                              <Progress value={item.actual} className="flex-1 h-2" />
                              <span className="text-xs font-medium w-10">{item.actual}%</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-center">
                          <span className={`font-medium ${
                            Math.abs(item.predicted - item.actual) < 5 ? 'text-success' :
                            Math.abs(item.predicted - item.actual) < 10 ? 'text-warning' :
                            'text-destructive'
                          }`}>
                            Δ {Math.abs(item.predicted - item.actual)}% 
                            {Math.abs(item.predicted - item.actual) < 5 ? ' (Well Calibrated)' :
                             Math.abs(item.predicted - item.actual) < 10 ? ' (Moderate Drift)' :
                             ' (Needs Recalibration)'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5" />
                    Feature Importance Analysis
                  </CardTitle>
                  <CardDescription>
                    Most influential features in current model predictions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { feature: "ANA Titer", importance: 0.87, change: "+0.05" },
                      { feature: "Anti-dsDNA", importance: 0.79, change: "+0.12" },
                      { feature: "Complement C3", importance: 0.73, change: "-0.02" },
                      { feature: "ESR Level", importance: 0.68, change: "+0.08" },
                      { feature: "Joint Count", importance: 0.61, change: "-0.04" },
                      { feature: "Skin Manifestations", importance: 0.55, change: "+0.03" }
                    ].map((item) => (
                      <div key={item.feature} className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium">{item.feature}</span>
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs ${
                              item.change.startsWith('+') ? 'text-success' : 'text-destructive'
                            }`}>
                              {item.change}
                            </span>
                            <span className="text-muted-foreground">{Math.round(item.importance * 100)}%</span>
                          </div>
                        </div>
                        <Progress value={item.importance * 100} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Drift Monitoring Tab */}
          <TabsContent value="drift" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  Model Drift Alerts
                </CardTitle>
                <CardDescription>
                  Detected performance degradation and distribution shifts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {driftAlerts.map((alert) => (
                    <Card key={alert.id} className={`border-l-4 ${
                      alert.severity === 'high' ? 'border-l-destructive' :
                      alert.severity === 'medium' ? 'border-l-warning' :
                      'border-l-info'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold">{alert.specialist} Model</h3>
                              <Badge variant={
                                alert.severity === 'high' ? 'destructive' :
                                alert.severity === 'medium' ? 'default' :
                                'secondary'
                              }>
                                {alert.severity}
                              </Badge>
                              <Badge variant="outline">{alert.modelId}</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center">
                              <Clock className="mr-1 h-3 w-3" />
                              Detected: {alert.detectedAt}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <div className="font-medium text-sm">Drift Type: {alert.metric}</div>
                            <p className="text-sm text-muted-foreground">{alert.description}</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-3 bg-muted rounded-lg">
                              <div className="text-sm text-muted-foreground">Affected Cases</div>
                              <div className="text-lg font-semibold">{alert.affectedCases}</div>
                            </div>
                            <div className="p-3 bg-muted rounded-lg">
                              <div className="text-sm text-muted-foreground">Recommendation</div>
                              <div className="text-sm font-medium">{alert.recommendation}</div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 pt-2">
                            <Button size="sm">
                              <Brain className="mr-2 h-4 w-4" />
                              Investigate
                            </Button>
                            <Button size="sm" variant="outline">
                              <Settings className="mr-2 h-4 w-4" />
                              Retrain Model
                            </Button>
                            <Button size="sm" variant="outline">
                              Mark Resolved
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feedback Queue Tab */}
          <TabsContent value="feedback" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Human-in-the-Loop Feedback Queue
                </CardTitle>
                <CardDescription>
                  Clinician corrections and feedback to improve model performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {feedbackQueue.map((feedback) => (
                    <Card key={feedback.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold">{feedback.caseId}</h3>
                              <Badge variant={
                                feedback.priority === 'high' ? 'destructive' :
                                feedback.priority === 'medium' ? 'default' :
                                'secondary'
                              }>
                                {feedback.priority}
                              </Badge>
                              {feedback.processed ? (
                                <Badge variant="outline" className="bg-success text-success-foreground">
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  Processed
                                </Badge>
                              ) : (
                                <Badge variant="outline">
                                  Pending Review
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {feedback.clinician} • {feedback.timestamp}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div className="p-3 bg-muted rounded-lg">
                            <div className="text-sm font-medium text-muted-foreground">Model Prediction</div>
                            <div className="font-semibold">{feedback.modelPrediction}</div>
                          </div>
                          <div className="p-3 bg-accent-muted rounded-lg">
                            <div className="text-sm font-medium text-muted-foreground">Clinician Diagnosis</div>
                            <div className="font-semibold">{feedback.clinicianDx}</div>
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="text-sm font-medium text-muted-foreground mb-1">Clinical Feedback</div>
                          <p className="text-sm">{feedback.feedback}</p>
                        </div>

                        {!feedback.processed && (
                          <div className="flex items-center space-x-2">
                            <Button size="sm">
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Accept & Retrain
                            </Button>
                            <Button size="sm" variant="outline">
                              <Brain className="mr-2 h-4 w-4" />
                              Analyze Impact
                            </Button>
                            <Button size="sm" variant="outline">
                              Request More Info
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ModelOperations;