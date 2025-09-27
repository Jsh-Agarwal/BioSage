import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Activity, 
  AlertTriangle, 
  Brain, 
  Clock, 
  Heart, 
  Stethoscope,
  TrendingUp,
  Users,
  Zap,
  Loader2,
  Eye
} from "lucide-react";
import { 
  fetchUndiagnosedPatients, 
  fetchDiagnosedPatients, 
  UndiagnosedPatient, 
  DiagnosedPatient,
  fetchDiagnosedResults,
  fetchPatientDataByMRN
} from "@/services/api";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  // State for API data
  const [undiagnosedPatients, setUndiagnosedPatients] = useState<UndiagnosedPatient[]>([]);
  const [diagnosedPatients, setDiagnosedPatients] = useState<DiagnosedPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingDiagnosis, setLoadingDiagnosis] = useState<string | null>(null);

  // Fetch data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch both undiagnosed and diagnosed patients
        const [undiagnosedData, diagnosedData] = await Promise.all([
          fetchUndiagnosedPatients(0, 50),
          fetchDiagnosedPatients()
        ]);
        
        setUndiagnosedPatients(undiagnosedData);
        setDiagnosedPatients(diagnosedData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch patient data';
        setError(errorMessage);
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const agentStatus = [
    { name: "Infectious Disease", status: "online", confidence: 87, cases: 12 },
    { name: "Cardiology", status: "online", confidence: 94, cases: 8 },
    { name: "Neurology", status: "online", confidence: 76, cases: 5 },
    { name: "Oncology", status: "degraded", confidence: 82, cases: 3 },
    { name: "Autoimmune", status: "online", confidence: 69, cases: 15 },
    { name: "Toxicology", status: "online", confidence: 91, cases: 2 }
  ];

  const systemMetrics = {
    avgTimeToTopDx: "4.2 min",
    modelAccuracy: "94.7%", 
    casesProcessed: "2,847",
    clinicianSatisfaction: "96%"
  };

  const handleStartDiagnosis = (mrn: string) => {
    navigate(`/diagnosis-progress/${mrn}`);
  };

  const handleViewAIDiagnosis = async (mrn: string, patientName: string) => {
    setLoadingDiagnosis(mrn);
    try {
      toast({
        title: "Fetching AI Diagnosis",
        description: `Loading diagnosis results and patient data for ${patientName}...`,
      });
      
      // Fetch both diagnosis results and patient data in parallel
      const [diagnosedResults, patientData] = await Promise.all([
        fetchDiagnosedResults(mrn),
        fetchPatientDataByMRN(mrn)
      ]);
      console.log('Fetched diagnosed results:', diagnosedResults);
      console.log('Fetched patient data:', patientData);
      
      toast({
        title: "Success",
        description: "AI diagnosis results and patient data loaded successfully!",
      });
      
      // Navigate to CaseView with both diagnosis results and patient data
      navigate(`/case/${mrn}`, { 
        state: { 
          diagnosisData: diagnosedResults,
          requestData: patientData,
          isFromDiagnosedResults: true,
          patientName: patientName
        }
      });
    } catch (error) {
      console.error('Error fetching AI diagnosis:', error);
      
      let errorMessage = "Unknown error occurred";
      if (error instanceof Error) {
        if (error.message.includes('JSON')) {
          errorMessage = "The server returned an invalid response. The ngrok tunnel might be down or there might be a CORS issue.";
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = "Network error. Please check your internet connection and ensure the API server is running.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error",
        description: `Failed to fetch AI diagnosis for ${patientName}. ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setLoadingDiagnosis(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center space-x-4">
            <Brain className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-semibold">BioSage — Super-Diagnostician</h1>
              <p className="text-sm text-muted-foreground">AI-Powered Clinical Decision Support</p>
            </div>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <Badge variant="outline" className="bg-success text-success-foreground">
              <Zap className="mr-1 h-3 w-3" />
              All Systems Online
            </Badge>
            <Link to="/onboarding">
              <Button>New Case Analysis</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 space-y-6">
        {/* System Status Banner */}
        <Card className="border-accent/20 bg-accent-muted">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Activity className="mr-2 h-5 w-5" />
              System Status & Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.entries(systemMetrics).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div className="text-2xl font-bold text-primary">{value}</div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Cases */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Active Cases</h2>
              <div className="text-sm text-muted-foreground">
                {undiagnosedPatients.length} undiagnosed • {diagnosedPatients.length} diagnosed
              </div>
            </div>
            
            {loading ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Loading patient data...</p>
                </CardContent>
              </Card>
            ) : error ? (
              <Card className="border-destructive">
                <CardContent className="p-6 text-center">
                  <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
                  <p className="text-destructive font-medium">Error loading data</p>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {/* Undiagnosed Patients */}
                {undiagnosedPatients.map((patient) => (
                  <Card key={patient.case_id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">{patient.patient_name}</h3>
                            <Badge variant="destructive">Undiagnosed</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {patient.case_id} • Age {patient.patient_age} • MRN: {patient.patient_mrn}
                          </p>
                          <p className="text-sm font-medium text-orange-600">Awaiting Diagnosis</p>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>Pending Analysis</span>
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <div className="flex flex-col space-y-1">
                            <Link to={`/patient-summary/${patient.patient_mrn}`}>
                              <Button size="sm" variant="outline" className="w-full">
                                Patient Summary
                              </Button>
                            </Link>
                              <Button size="sm" className="w-full" onClick={() => handleStartDiagnosis(patient.patient_mrn)}>
                                Start Diagnosis
                              </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Diagnosed Patients */}
                {diagnosedPatients.map((patient) => (
                  <Card key={patient.patient_mrn} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">{patient.patient_name}</h3>
                            <Badge variant="default" className="bg-success text-success-foreground">
                              {patient.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            MRN: {patient.patient_mrn} • Age {patient.patient_age}
                          </p>
                          <p className="text-sm font-medium text-green-700">{patient.current_diagnosis}</p>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <Heart className="h-3 w-3" />
                            <span>Diagnosed</span>
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <div className="flex flex-col space-y-1">
                            <Link to={`/patient-summary/${patient.patient_mrn}`}>
                              <Button size="sm" variant="outline" className="w-full">
                                Patient Summary
                              </Button>
                            </Link>
                            <Button 
                              size="sm" 
                              className="w-full"
                              onClick={() => handleViewAIDiagnosis(patient.patient_mrn, patient.patient_name)}
                              disabled={loadingDiagnosis === patient.patient_mrn}
                            >
                              {loadingDiagnosis === patient.patient_mrn ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Loading...
                                </>
                              ) : (
                                <>
                                  <Brain className="mr-2 h-4 w-4" />
                                  View AI Diagnosis
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {undiagnosedPatients.length === 0 && diagnosedPatients.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No active cases at the moment</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* AI Specialist Agent Status */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">AI Specialist Agents</h2>
            
            <div className="space-y-3">
              {agentStatus.map((agent) => (
                <Card key={agent.name}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-sm">{agent.name}</h3>
                      <Badge 
                        variant={agent.status === 'online' ? 'default' : 'destructive'}
                        className={agent.status === 'online' ? 'bg-success' : ''}
                      >
                        {agent.status}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Confidence</span>
                        <span>{agent.confidence}%</span>
                      </div>
                      <Progress value={agent.confidence} className="h-1" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Active Cases</span>
                        <span>{agent.cases}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Link to="/specialists">
              <Button variant="outline" className="w-full">
                <Stethoscope className="mr-2 h-4 w-4" />
                View Specialist Grid
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and system controls</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link to="/evidence">
                <Button variant="outline" className="w-full h-20 flex-col">
                  <TrendingUp className="h-6 w-6 mb-2" />
                  Evidence Explorer
                </Button>
              </Link>
              <Link to="/research">
                <Button variant="outline" className="w-full h-20 flex-col">
                  <Brain className="h-6 w-6 mb-2" />
                  Research Hub
                </Button>
              </Link>
              <Link to="/model-ops">
                <Button variant="outline" className="w-full h-20 flex-col">
                  <Activity className="h-6 w-6 mb-2" />
                  Model Operations
                </Button>
              </Link>
              <Link to="/visual-diagnosis">
                <Button variant="outline" className="w-full h-20 flex-col">
                  <Eye className="h-6 w-6 mb-2" />
                  Visual Diagnosis
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;