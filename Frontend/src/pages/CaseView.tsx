import { useParams, Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  ArrowLeft,
  Activity,
  Brain,
  Heart,
  Eye,
  Zap,
  TrendingUp,
  FileText,
  TestTube,
  Clock,
  ExternalLink
} from "lucide-react";
import { DiagnosisResponse, PatientDataResponse } from "@/services/api";

const CaseView = () => {
  const { caseId } = useParams();
  const location = useLocation();
  const { diagnosisData, requestData, isFromDiagnosedResults, patientName } = (location.state || {}) as { 
    diagnosisData?: DiagnosisResponse, 
    requestData?: PatientDataResponse,
    isFromDiagnosedResults?: boolean,
    patientName?: string
  };
  
  // Debug logging
  console.log('CaseView Debug Info:', {
    caseId,
    hasState: !!location.state,
    hasDiagnosisData: !!diagnosisData,
    hasRequestData: !!requestData,
    isFromDiagnosedResults,
    patientName,
    diagnosisDataAgents: diagnosisData?.agents?.length || 0,
    diagnosisDataFused: !!diagnosisData?.fused,
    testPlansLength: diagnosisData?.fused?.test_plans?.length || 0,
    testPlans: diagnosisData?.fused?.test_plans,
    nextBestTest: diagnosisData?.fused?.next_best_test,
    recommendationsLength: diagnosisData?.recommendations?.length || 0,
    recommendations: diagnosisData?.recommendations
  });
  
  // State for evidence modal
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<{
    specialty: string;
    citations: { doc_id: string; span: string; }[];
    diagnosis: string;
    rationale: string;
  } | null>(null);

  const getSpecialistIcon = (specialty: string) => {
    switch (specialty.toLowerCase()) {
      case 'autoimmune':
        return Zap;
      case 'infectious':
      case 'infectious disease':
        return Activity;
      case 'cardiology':
        return Heart;
      case 'dermatology':
        return Eye;
      case 'oncology':
        return Brain; // Or another icon
      default:
        return Activity;
    }
  };

  const patientData = requestData ? {
    name: requestData.patient.name,
    age: requestData.patient.age,
    gender: requestData.patient.gender,
    mrn: requestData.patient.mrn,
    caseId: requestData.case.case_id,
    chiefComplaint: requestData.case.chief_complaint,
    vitals: {
      temp: requestData.vitals.temperature,
      bp: requestData.vitals.bp,
      hr: requestData.vitals.hr,
      rr: requestData.vitals.rr,
      o2sat: requestData.vitals.o2sat
    },
    lastUpdate: "Just now"
  } : isFromDiagnosedResults && patientName ? {
    name: patientName,
    age: "N/A",
    gender: "N/A", 
    mrn: caseId || "Unknown",
    caseId: "Diagnosed Case",
    chiefComplaint: "AI Diagnosis Results",
    vitals: {
      temp: "N/A",
      bp: "N/A",
      hr: "N/A",
      rr: "N/A",
      o2sat: "N/A"
    },
    lastUpdate: "N/A"
  } : {
    name: "Sarah Chen",
    age: 34,
    gender: "Female",
    mrn: "MRN-789123",
    caseId: "BSG-2024-001",
    chiefComplaint: "Fever, joint pain, and skin rash for 3 weeks",
    vitals: {
      temp: "101.2°F",
      bp: "142/89",
      hr: "98",
      rr: "18",
      o2sat: "97%"
    },
    lastUpdate: "12 minutes ago"
  };

  const specialistResults = diagnosisData?.agents?.filter(agent => agent.candidates && agent.candidates.length > 0)?.map(agent => {
    const Icon = getSpecialistIcon(agent.agent);
    const topCandidate = agent.candidates.reduce((prev, current) => (prev.score_local > current.score_local) ? prev : current);
    const secondCandidate = agent.candidates.filter(c => c.diagnosis !== topCandidate.diagnosis).reduce((prev, current) => (prev.score_local > current.score_local) ? prev : current, { diagnosis: 'N/A', score_local: 0 });

    return {
      specialty: agent.agent.charAt(0).toUpperCase() + agent.agent.slice(1),
      icon: Icon,
      confidence: Math.round(topCandidate.score_local * 100),
      topDx: topCandidate.diagnosis,
      secondDx: secondCandidate.diagnosis,
      rationale: topCandidate.rationale,
      status: topCandidate.confidence_qual
    }
  }) || [
    {
      specialty: "Autoimmune",
      icon: Zap,
      confidence: 89,
      topDx: "Systemic Lupus Erythematosus",
      secondDx: "Mixed Connective Tissue Disease",
      rationale: "ANA 1:640 speckled pattern, anti-dsDNA positive, complement low, malar rash present",
      status: "high-confidence"
    },
    {
      specialty: "Infectious Disease", 
      icon: Activity,
      confidence: 34,
      topDx: "Viral Arthritis",
      secondDx: "Post-infectious Arthritis",
      rationale: "Recent viral prodrome, symmetric joint involvement, no response to antibiotics",
      status: "low-confidence"
    },
    {
      specialty: "Cardiology",
      icon: Heart,
      confidence: 67,
      topDx: "Pericarditis",
      secondDx: "Myocarditis",
      rationale: "Chest pain, elevated troponins, ECG changes suggestive of pericardial involvement",
      status: "medium-confidence"
    },
    {
      specialty: "Dermatology",
      icon: Eye,
      confidence: 78,
      topDx: "Lupus-related Skin Manifestations",
      secondDx: "Photodermatitis",
      rationale: "Characteristic malar rash, photosensitive distribution, biopsy consistent with lupus",
      status: "high-confidence"
    }
  ];

  // Handler to open evidence modal
  const handleViewEvidence = (specialist: { specialty: string; topDx: string; rationale: string; }, candidateIndex: number = 0) => {
    if (!diagnosisData?.agents) return;
    
    const agent = diagnosisData.agents.find(a => a.agent.toLowerCase() === specialist.specialty.toLowerCase());
    if (agent && agent.candidates && agent.candidates.length > 0) {
      const candidate = agent.candidates[candidateIndex];
      if (candidate) {
        setSelectedEvidence({
          specialty: specialist.specialty,
          citations: candidate.citations || [],
          diagnosis: candidate.diagnosis || '',
          rationale: candidate.rationale || ''
        });
        setEvidenceModalOpen(true);
      }
    }
  };

  const integratedResults = diagnosisData?.fused?.differential?.map((diag, index) => ({
    rank: index + 1,
    diagnosis: diag.diagnosis,
    probability: diag.score_global,
    delta: "+0%", // This data is not in the new payload
    nextTest: diagnosisData.fused?.next_best_test?.name || "N/A",
    cost: "N/A", // This data is not in the new payload
    timeToResult: "N/A", // This data is not in the new payload
    infoGain: "High", // This data is not in the new payload
    evidenceCount: diag.citations?.length || 0
  })) || [
    {
      rank: 1,
      diagnosis: "Systemic Lupus Erythematosus",
      probability: 0.87,
      delta: "+12%",
      nextTest: "Anti-Sm antibodies, C3/C4 complement",
      cost: "$340",
      timeToResult: "2-3 days",
      infoGain: "High",
      evidenceCount: 23
    },
    {
      rank: 2,
      diagnosis: "Mixed Connective Tissue Disease", 
      probability: 0.31,
      delta: "-5%",
      nextTest: "Anti-RNP antibodies",
      cost: "$180",
      timeToResult: "1-2 days", 
      infoGain: "Medium",
      evidenceCount: 15
    },
    {
      rank: 3,
      diagnosis: "Undifferentiated Connective Tissue Disease",
      probability: 0.28,
      delta: "+8%", 
      nextTest: "Anti-SSA/SSB antibodies",
      cost: "$220",
      timeToResult: "2 days",
      infoGain: "Medium",
      evidenceCount: 11
    }
  ];

  const labResults = requestData?.labs?.map((lab) => ({
    test: lab.test,
    value: lab.value,
    reference: lab.reference,
    status: lab.status === 'completed' ? 'stable' : 'pending'
  })) || (isFromDiagnosedResults ? [
    { test: "Lab Data", value: "Not Available", reference: "N/A", status: "stable" },
    { test: "Note", value: "Viewing AI Diagnosis Results", reference: "N/A", status: "stable" }
  ] : [
    { test: "ANA", value: "1:640", reference: "<1:80", status: "high" },
    { test: "Anti-dsDNA", value: "87 IU/mL", reference: "<30", status: "high" },
    { test: "C3 Complement", value: "65 mg/dL", reference: "90-180", status: "low" },
    { test: "C4 Complement", value: "8 mg/dL", reference: "10-40", status: "low" },
    { test: "ESR", value: "78 mm/hr", reference: "<30", status: "high" },
    { test: "CRP", value: "24 mg/L", reference: "<3", status: "high" }
  ]);

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
            <h1 className="text-xl font-semibold">{patientData.name}</h1>
            <p className="text-sm text-muted-foreground">
              {patientData.caseId} • Age {patientData.age} • {patientData.gender}
            </p>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <Badge variant="outline" className={diagnosisData?.fused?.disagreement_score && diagnosisData.fused.disagreement_score > 0.05 ? "bg-warning text-warning-foreground" : "bg-success text-success-foreground"}>
              {diagnosisData?.fused?.disagreement_score && diagnosisData.fused.disagreement_score > 0.05 ? 'High diagnostic uncertainty' : 'Low diagnostic uncertainty'}
            </Badge>
            {isFromDiagnosedResults && (
              <Badge variant="default" className="bg-green-600 text-white">
                Tests Recommended
              </Badge>
            )}
            <Button variant="outline">
              <TestTube className="mr-2 h-4 w-4" />
              Order Tests
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 space-y-6">
        {/* Patient Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              {isFromDiagnosedResults ? "AI Diagnosis Summary" : "Patient Summary"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold mb-2 text-blue-600">
                  {isFromDiagnosedResults ? "🧪 Recommended Tests" : "Chief Complaint"}
                </h3>
                {isFromDiagnosedResults ? (
                  <div className="space-y-2">
                    {/* Check test_plans first, then fallback to recommendations */}
                    {(diagnosisData?.fused?.test_plans?.length > 0 || diagnosisData?.recommendations?.length > 0) ? (
                      <>
                        {/* Show test_plans if available */}
                        {diagnosisData?.fused?.test_plans?.length > 0 ? (
                          <>
                            <p className="text-sm text-muted-foreground mb-2">
                              {diagnosisData.fused.test_plans.length} specific test plan{diagnosisData.fused.test_plans.length > 1 ? 's' : ''} recommended:
                            </p>
                            <div className="space-y-1">
                              {diagnosisData.fused.test_plans.slice(0, 2).map((testPlan, index) => (
                                <div key={index} className="text-sm p-2 bg-blue-50 rounded border-l-2 border-blue-200">
                                  <div className="font-medium text-blue-900">{diagnosisData?.fused?.next_best_test?.name || 'Additional Tests'}</div>
                                  <div className="text-blue-700 text-xs">For {testPlan.diagnosis}</div>
                                </div>
                              ))}
                              {diagnosisData.fused.test_plans.length > 2 && (
                                <div className="text-xs text-muted-foreground">
                                  +{diagnosisData.fused.test_plans.length - 2} more test plan{diagnosisData.fused.test_plans.length - 2 > 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          /* Show general recommendations if test_plans not available */
                          diagnosisData?.recommendations?.length > 0 && (
                            <>
                              <p className="text-sm text-muted-foreground mb-2">
                                {diagnosisData.recommendations.length} clinical recommendation{diagnosisData.recommendations.length > 1 ? 's' : ''} available:
                              </p>
                              <div className="space-y-1">
                                {diagnosisData.recommendations.slice(0, 3).map((rec, index) => (
                                  <div key={index} className="text-sm p-2 bg-green-50 rounded border-l-2 border-green-200">
                                    <div className="font-medium text-green-900">{rec.title}</div>
                                    <div className="text-green-700 text-xs">Priority: {rec.priority}</div>
                                  </div>
                                ))}
                                {diagnosisData.recommendations.length > 3 && (
                                  <div className="text-xs text-muted-foreground">
                                    +{diagnosisData.recommendations.length - 3} more recommendation{diagnosisData.recommendations.length - 3 > 1 ? 's' : ''}
                                  </div>
                                )}
                              </div>
                            </>
                          )
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No additional tests recommended at this time.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {patientData.chiefComplaint}
                  </p>
                )}
              </div>
              <div>
                <h3 className="font-semibold mb-2">Current Vitals</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(patientData.vitals).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground capitalize">{key}:</span>
                      <span className={
                        key === 'temp' && value !== 'N/A' && parseFloat(value) > 100.4 ? 'text-critical' :
                        key === 'bp' && value !== 'N/A' && parseInt(value.split('/')[0]) > 140 ? 'text-urgent' :
                        ''
                      }>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Case Details</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">MRN:</span>
                    <span>{patientData.mrn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Update:</span>
                    <span className="flex items-center">
                      <Clock className="mr-1 h-3 w-3" />
                      {patientData.lastUpdate}
                    </span>
                  </div>
                  {isFromDiagnosedResults && (diagnosisData?.fused?.test_plans?.length > 0 || diagnosisData?.recommendations?.length > 0) && (
                    <div className="pt-3">
                      <Link 
                        to="/tests-orders" 
                        state={{ 
                          diagnosisData, 
                          requestData, 
                          patientData: {
                            name: patientName || patientData.name,
                            age: patientData.age || 32,
                            mrn: patientData.mrn,
                            caseId: patientData.caseId
                          }
                        }}
                      >
                        <Button size="sm" className="w-full">
                          <TestTube className="mr-2 h-4 w-4" />
                          Order Tests
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Specialist Results */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold">AI Specialist Analysis</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {specialistResults.map((specialist) => (
                <Card key={specialist.specialty} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center text-lg">
                        <specialist.icon className="mr-2 h-5 w-5" />
                        {specialist.specialty}
                      </CardTitle>
                      <Badge
                        variant={
                          specialist.status === 'high' ? 'default' :
                          specialist.status === 'medium' ? 'secondary' :
                          'outline'
                        }
                        className={
                          specialist.status === 'high' ? 'bg-success text-success-foreground' :
                          specialist.status === 'medium' ? 'bg-warning text-warning-foreground' :
                          ''
                        }
                      >
                        {specialist.confidence}%
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="font-medium">{specialist.topDx}</div>
                        <div className="text-sm text-muted-foreground">{specialist.secondDx}</div>
                      </div>
                      <Progress value={specialist.confidence} className="h-2" />
                      <p className="text-sm text-muted-foreground">{specialist.rationale}</p>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full"
                        onClick={() => handleViewEvidence(specialist)}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Evidence Trail
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Lab Results */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Recent Lab Results</h2>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Key Laboratory Values</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {labResults.map((lab) => (
                    <div key={lab.test} className="flex items-center justify-between py-1">
                      <div>
                        <div className="font-medium text-sm">{lab.test}</div>
                        <div className="text-xs text-muted-foreground">{lab.reference}</div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium text-sm ${
                          lab.status === 'high' ? 'text-critical' :
                          lab.status === 'low' ? 'text-urgent' :
                          'text-stable'
                        }`}>
                          {lab.value}
                        </div>
                        <Badge 
                          variant="outline" 
                          className={
                            lab.status === 'high' ? 'border-critical text-critical' :
                            lab.status === 'low' ? 'border-urgent text-urgent' :
                            'border-stable text-stable'
                          }
                        >
                          {lab.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {!isFromDiagnosedResults ? (
              <Link 
                to="/tests-orders" 
                state={{ 
                  diagnosisData, 
                  requestData, 
                  patientData 
                }}
              >
                <Button className="w-full">
                  <TestTube className="mr-2 h-4 w-4" />
                  Plan Additional Tests
                </Button>
              </Link>
            ) : (
              <Button className="w-full" variant="outline" disabled>
                <TestTube className="mr-2 h-4 w-4" />
                No Tests Available
              </Button>
            )}
          </div>
        </div>

        {/* Integrated Differential Diagnosis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="mr-2 h-5 w-5" />
              Ranked Differential — Evidence Linked and Probability Calibrated
            </CardTitle>
            <CardDescription>
              Integrated analysis from all specialist agents with mechanistic rationale
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {integratedResults.map((result) => (
                <div key={result.rank} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                          {result.rank}
                        </Badge>
                        <h3 className="font-semibold">{result.diagnosis}</h3>
                        {result.delta && <Badge variant={result.delta.startsWith('+') ? 'default' : 'secondary'}>
                          {result.delta}
                        </Badge>}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Next Test: </span>
                          <span className="font-medium">{result.nextTest}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Cost: </span>
                          <span>{result.cost}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Time: </span>
                          <span>{result.timeToResult}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Evidence: </span>
                          <span className="font-medium">{result.evidenceCount} sources</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-2 ml-6">
                      <div className="text-2xl font-bold">{Math.round(result.probability * 100)}%</div>
                      <Progress value={result.probability * 100} className="w-20 h-2" />
                      <Button size="sm" variant="outline">
                        Accept & Order
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evidence Trail Modal */}
      <Dialog open={evidenceModalOpen} onOpenChange={setEvidenceModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <ExternalLink className="mr-2 h-5 w-5" />
              Evidence Trail - {selectedEvidence?.specialty}
            </DialogTitle>
            <DialogDescription>
              Supporting citations and evidence for {selectedEvidence?.diagnosis}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvidence && (
            <div className="space-y-6">
              {/* Diagnosis & Rationale */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Diagnostic Reasoning</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-primary">{selectedEvidence.diagnosis}</h4>
                    </div>
                    <div>
                      <h5 className="font-medium mb-2">Clinical Rationale:</h5>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {selectedEvidence.rationale}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Citations */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Supporting Evidence</CardTitle>
                  <CardDescription>
                    {selectedEvidence.citations.length} citation(s) from medical literature and case studies
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedEvidence.citations.map((citation, index) => (
                      <div key={index} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              Citation {index + 1}
                            </Badge>
                            <code className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                              {citation.doc_id}
                            </code>
                          </div>
                          <blockquote className="border-l-4 border-primary pl-4 text-sm leading-relaxed">
                            "{citation.span}"
                          </blockquote>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CaseView;