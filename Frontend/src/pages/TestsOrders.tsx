import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { DiagnosisResponse, PatientDataResponse } from "@/services/api";
import { 
  ArrowLeft,
  TestTube,
  Search,
  Plus,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Activity,
  Zap,
  Calendar,
  FileText
} from "lucide-react";

const TestsOrders = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const location = useLocation();
  
  // Get diagnosis data from navigation state
  const { diagnosisData, requestData, patientData } = (location.state || {}) as { 
    diagnosisData?: DiagnosisResponse; 
    requestData?: PatientDataResponse;
    patientData?: { name: string; age: number; mrn: string; caseId: string; };
  };

  // Debug logging
  console.log('TestsOrders Debug Info:', {
    hasDiagnosisData: !!diagnosisData,
    hasRequestData: !!requestData,
    hasPatientData: !!patientData,
    testPlansLength: diagnosisData?.fused?.test_plans?.length || 0,
    recommendationsLength: diagnosisData?.recommendations?.length || 0,
    diagnosisData: diagnosisData,
    testPlans: diagnosisData?.fused?.test_plans,
    recommendations: diagnosisData?.recommendations
  });

  // Generate test recommendations from API data
  const getRecommendedTestsFromAPI = () => {
    if (!diagnosisData?.recommendations?.length) return [];
    
    return diagnosisData.recommendations.map((rec, index) => ({
      id: `api-rec-${index}`,
      name: rec.title,
      category: "Clinical Recommendation",
      cost: 200, // Default cost - could be enhanced
      turnaroundTime: "1-2 days",
      invasiveness: "Low",
      informationGain: rec.priority === "high" ? "High" : rec.priority === "medium" ? "Medium" : "Low",
      confidence: rec.priority === "high" ? 0.9 : rec.priority === "medium" ? 0.7 : 0.5,
      rationale: rec.rationale,
      clinicalUtility: "Diagnostic confirmation",
      priority: rec.priority,
      aiRecommendation: true
    }));
  };

  // Generate test plans from API data  
  const getTestPlansFromAPI = () => {
    if (!diagnosisData || !diagnosisData.fused?.test_plans?.length) return [];
    
    return diagnosisData.fused.test_plans.map((plan, index) => ({
      id: `test-plan-${index}`,
      name: `${diagnosisData.fused?.next_best_test?.name || 'Additional Test'} for ${plan.diagnosis}`,
      category: "Test Plan",
      cost: 300,
      turnaroundTime: "2-3 days", 
      invasiveness: "Medium",
      informationGain: "High",
      confidence: 0.8, // Default confidence for test plans
      rationale: plan.plan,
      clinicalUtility: "Differential diagnosis",
      priority: "high", // Default priority for test plans
      aiRecommendation: true,
      diagnosis: plan.diagnosis
    }));
  };

  // Combine all available test recommendations
  const getRecommendedTests = () => {
    const apiRecommendations = getRecommendedTestsFromAPI();
    const testPlans = getTestPlansFromAPI();
    
    // If we have API data, use it
    if (apiRecommendations.length > 0 || testPlans.length > 0) {
      return [...apiRecommendations, ...testPlans];
    }
    
    // Fallback to default recommendations if no API data
    return [
      {
        id: "anti-sm",
        name: "Anti-Sm Antibodies",
        category: "Immunology",
        cost: 180,
        turnaroundTime: "2-3 days",
        invasiveness: "Low",
        informationGain: "High",
        confidence: 0.89,
        rationale: "High specificity for SLE diagnosis. Current ANA pattern suggests anti-Sm positivity.",
        clinicalUtility: "Diagnostic confirmation",
        priority: "high",
        aiRecommendation: true
      },
      {
        id: "anti-rnp",
        name: "Anti-RNP Antibodies", 
        category: "Immunology",
        cost: 160,
        turnaroundTime: "2-3 days",
        invasiveness: "Low", 
        informationGain: "Medium",
        confidence: 0.67,
        rationale: "Helps differentiate between SLE and MCTD. Patient symptoms could fit MCTD pattern.",
        clinicalUtility: "Differential diagnosis",
        priority: "medium",
        aiRecommendation: true
      },
      {
        id: "complement-c1q",
        name: "Complement C1q",
        category: "Immunology",
        cost: 120,
        turnaroundTime: "1-2 days",
        invasiveness: "Low",
        informationGain: "Medium", 
        confidence: 0.73,
        rationale: "Low C3/C4 suggest complement consumption. C1q deficiency can mimic lupus.",
        clinicalUtility: "Mechanistic understanding",
        priority: "medium",
        aiRecommendation: true
      },
      {
        id: "anti-ssa-ssb",
        name: "Anti-SSA/SSB Antibodies",
        category: "Immunology", 
        cost: 200,
        turnaroundTime: "2-3 days",
        invasiveness: "Low",
        informationGain: "Medium",
        confidence: 0.54,
        rationale: "Associated with sicca symptoms and neonatal lupus risk assessment.",
        clinicalUtility: "Risk stratification",
        priority: "low",
        aiRecommendation: false
      }
    ];
  };

  const recommendedTests = getRecommendedTests();

  const additionalTests = [
    {
      id: "echo",
      name: "Echocardiogram",
      category: "Cardiology",
      cost: 450,
      turnaroundTime: "Same day",
      invasiveness: "Low",
      informationGain: "Medium",
      rationale: "Evaluate for pericarditis given chest symptoms and elevated troponins.",
      clinicalUtility: "Cardiac assessment"
    },
    {
      id: "mri-brain", 
      name: "Brain MRI with Contrast",
      category: "Neurology",
      cost: 1200,
      turnaroundTime: "1-2 days", 
      invasiveness: "Medium",
      informationGain: "High",
      rationale: "Rule out CNS lupus given neurological symptoms and headaches.",
      clinicalUtility: "CNS evaluation"
    },
    {
      id: "urinalysis",
      name: "Urinalysis with Microscopy",
      category: "Nephrology",
      cost: 45,
      turnaroundTime: "2-4 hours",
      invasiveness: "Low", 
      informationGain: "High",
      rationale: "Screen for lupus nephritis - essential given positive anti-dsDNA.",
      clinicalUtility: "Renal assessment"
    },
    {
      id: "chest-ct",
      name: "Chest CT with Contrast",
      category: "Pulmonology", 
      cost: 650,
      turnaroundTime: "Same day",
      invasiveness: "Medium",
      informationGain: "Medium",
      rationale: "Evaluate pulmonary manifestations and rule out serositis.",
      clinicalUtility: "Pulmonary assessment"
    }
  ];

  const currentOrders = [
    {
      id: "ord-001",
      testName: "Complete Blood Count",
      orderedBy: "Dr. Sarah Chen", 
      orderTime: "2024-01-16 14:30",
      status: "completed",
      results: "Available",
      priority: "routine"
    },
    {
      id: "ord-002",
      testName: "Comprehensive Metabolic Panel",
      orderedBy: "Dr. Sarah Chen",
      orderTime: "2024-01-16 14:30", 
      status: "completed",
      results: "Available",
      priority: "routine"
    },
    {
      id: "ord-003",
      testName: "ANA with Reflex",
      orderedBy: "Dr. Michael Kim",
      orderTime: "2024-01-15 16:45",
      status: "completed",
      results: "1:640 Speckled",
      priority: "stat"
    },
    {
      id: "ord-004",
      testName: "Anti-dsDNA",
      orderedBy: "Dr. Michael Kim",
      orderTime: "2024-01-15 16:45", 
      status: "completed",
      results: "87 IU/mL (High)",
      priority: "stat"
    },
    {
      id: "ord-005",
      testName: "Troponin I",
      orderedBy: "Dr. Lisa Wang",
      orderTime: "2024-01-16 08:15",
      status: "pending",
      results: "In progress",
      priority: "urgent"
    }
  ];

  const handleTestSelection = (testId: string, checked: boolean) => {
    if (checked) {
      setSelectedTests([...selectedTests, testId]);
    } else {
      setSelectedTests(selectedTests.filter(id => id !== testId));
    }
  };

  const totalCost = selectedTests.reduce((sum, testId) => {
    const test = [...recommendedTests, ...additionalTests].find(t => t.id === testId);
    return sum + (test?.cost || 0);
  }, 0);

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
            <h1 className="text-xl font-semibold">
              Tests & Orders Planner
              {patientData && ` - ${patientData.name}`}
            </h1>
            <p className="text-sm text-muted-foreground">
              {patientData 
                ? `AI-guided diagnostic test recommendations for ${patientData.mrn} • Case ${patientData.caseId}`
                : "AI-guided diagnostic test recommendations with cost-benefit analysis"
              }
            </p>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Custom Order
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 space-y-6">
        
        {/* Order Summary */}
        {selectedTests.length > 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TestTube className="mr-2 h-5 w-5" />
                Selected Tests ({selectedTests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">
                    {selectedTests.map(testId => {
                      const test = [...recommendedTests, ...additionalTests].find(t => t.id === testId);
                      return test?.name;
                    }).join(', ')}
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <DollarSign className="mr-1 h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">${totalCost}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
                      <span>2-3 days max</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" onClick={() => setSelectedTests([])}>
                    Clear All
                  </Button>
                  <Button>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Submit Orders
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* AI Recommendations */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center">
                <Zap className="mr-2 h-5 w-5 text-primary" />
                AI Recommendations
              </h2>
              <Badge variant="outline" className="bg-primary text-primary-foreground">
                <Activity className="mr-1 h-3 w-3" />
                High Confidence
              </Badge>
            </div>

            <div className="space-y-4">
              {recommendedTests.map((test) => (
                <Card key={test.id} className={`hover:shadow-md transition-shadow ${
                  test.aiRecommendation ? 'border-primary/30' : ''
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Checkbox
                        id={test.id}
                        checked={selectedTests.includes(test.id)}
                        onCheckedChange={(checked) => handleTestSelection(test.id, !!checked)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg flex items-center">
                              {test.name}
                              {test.aiRecommendation && (
                                <Badge className="ml-2 bg-primary text-primary-foreground">
                                  <Zap className="mr-1 h-3 w-3" />
                                  AI Recommended
                                </Badge>
                              )}
                            </h3>
                            <Badge variant="outline" className="mt-1">{test.category}</Badge>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">Confidence</div>
                            <div className="text-lg font-bold">{Math.round(test.confidence * 100)}%</div>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground">{test.rationale}</p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <div className="text-lg font-semibold">${test.cost}</div>
                            <div className="text-sm text-muted-foreground">Cost</div>
                          </div>
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <div className="text-lg font-semibold">{test.turnaroundTime}</div>
                            <div className="text-sm text-muted-foreground">Time</div>
                          </div>
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <div className="text-lg font-semibold">{test.invasiveness}</div>
                            <div className="text-sm text-muted-foreground">Invasiveness</div>
                          </div>
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <div className={`text-lg font-semibold ${
                              test.informationGain === 'High' ? 'text-success' :
                              test.informationGain === 'Medium' ? 'text-warning' :
                              'text-muted-foreground'
                            }`}>
                              {test.informationGain}
                            </div>
                            <div className="text-sm text-muted-foreground">Info Gain</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Clinical Utility: </span>
                            <span className="font-medium">{test.clinicalUtility}</span>
                          </div>
                          <Badge variant={
                            test.priority === 'high' ? 'destructive' :
                            test.priority === 'medium' ? 'default' :
                            'secondary'
                          }>
                            {test.priority} priority
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Test Plans from Diagnosis */}
            {diagnosisData && getTestPlansFromAPI().length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <TestTube className="mr-2 h-5 w-5 text-secondary" />
                  Diagnostic Test Plans
                </h2>
                
                <div className="space-y-4">
                  {getTestPlansFromAPI().map((testPlan) => (
                    <Card key={testPlan.id} className="hover:shadow-md transition-shadow border-secondary/30">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={testPlan.id}
                                checked={selectedTests.includes(testPlan.id)}
                                onCheckedChange={(checked) => handleTestSelection(testPlan.id, checked as boolean)}
                              />
                              <label htmlFor={testPlan.id} className="font-semibold cursor-pointer">
                                {testPlan.name}
                              </label>
                              <Badge variant="secondary">{testPlan.category}</Badge>
                            </div>
                            
                            <div className="ml-6 space-y-2">
                              <p className="text-sm text-muted-foreground">{testPlan.rationale}</p>
                              
                              <div className="flex items-center space-x-6 text-sm">
                                <div className="flex items-center">
                                  <DollarSign className="h-4 w-4 mr-1" />
                                  <span>${testPlan.cost}</span>
                                </div>
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  <span>{testPlan.turnaroundTime}</span>
                                </div>
                                <div className="flex items-center">
                                  <AlertTriangle className="h-4 w-4 mr-1" />
                                  <span>{testPlan.invasiveness}</span>
                                </div>
                                <div className="flex items-center">
                                  <TrendingUp className="h-4 w-4 mr-1" />
                                  <span>{testPlan.informationGain}</span>
                                </div>
                              </div>

                              <div className="text-xs text-muted-foreground mt-2">
                                <span className="font-medium">For diagnosis:</span> {testPlan.diagnosis}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Test Options */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Additional Test Options</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {additionalTests.map((test) => (
                  <Card key={test.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id={test.id}
                          checked={selectedTests.includes(test.id)}
                          onCheckedChange={(checked) => handleTestSelection(test.id, !!checked)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <div>
                            <h3 className="font-semibold">{test.name}</h3>
                            <Badge variant="outline">{test.category}</Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground">{test.rationale}</p>
                          
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-3">
                              <span>${test.cost}</span>
                              <span className="text-muted-foreground">•</span>
                              <span>{test.turnaroundTime}</span>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {test.invasiveness} risk
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Current Orders & Quick Actions */}
          <div className="space-y-6">
            
            {/* Current Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Current Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentOrders.map((order) => (
                    <div key={order.id} className="p-3 bg-muted rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{order.testName}</h4>
                          <Badge variant={
                            order.status === 'completed' ? 'secondary' :
                            order.status === 'pending' ? 'default' :
                            'outline'
                          }>
                            {order.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {order.orderedBy} • {order.orderTime}
                        </div>
                        <div className="text-xs">
                          <span className="text-muted-foreground">Results: </span>
                          <span className={order.status === 'completed' ? 'font-medium' : 'text-muted-foreground'}>
                            {order.results}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Cost Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Cost-Benefit Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">${totalCost}</div>
                    <div className="text-sm text-muted-foreground">Total Estimated Cost</div>
                  </div>
                  
                  {selectedTests.length > 0 && (
                    <div className="space-y-3">
                      <div className="text-sm font-medium">Expected Information Gain</div>
                      <div className="w-full bg-muted rounded-full h-3">
                        <div className="bg-success h-3 rounded-full" style={{width: '85%'}}></div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        High confidence that selected tests will provide diagnostic clarity
                      </div>
                    </div>
                  )}

                  <div className="text-sm">
                    <div className="font-medium mb-2">Coverage Information</div>
                    <div className="text-muted-foreground">
                      Most immunology tests covered under current insurance with $25 copay per test.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule Follow-up
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Lab Requisition
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Set Result Alerts
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestsOrders;