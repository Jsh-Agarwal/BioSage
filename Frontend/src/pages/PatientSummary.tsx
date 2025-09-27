import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  AlertCircle,
  Activity,
  FileText,
  TestTube,
  Stethoscope,
  Heart,
  TrendingUp,
  Clock,
  Download,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { fetchPatientDataByMRN, PatientDataResponse } from "@/services/api";

const PatientSummary = () => {
  const { id } = useParams();

  // State for API data
  const [patientData, setPatientData] = useState<PatientDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch patient data on component mount
  useEffect(() => {
    console.log('PatientSummary component mounted with ID:', id);
    
    const loadPatientData = async () => {
      if (!id) {
        console.log('No patient MRN provided');
        setError('No patient MRN provided');
        setLoading(false);
        return;
      }

      try {
        console.log('Starting API call for MRN:', id);
        setLoading(true);
        setError(null);
        const data = await fetchPatientDataByMRN(id);
        console.log('API response received:', data);
        setPatientData(data);
      } catch (err) {
        console.error('API call failed:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch patient data';
        setError(errorMessage);
        console.error('Error loading patient data:', err);
      } finally {
        console.log('API call completed, setting loading to false');
        setLoading(false);
      }
    };

    loadPatientData();
  }, [id]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="flex h-16 items-center px-6">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="ml-6">
              <h1 className="text-xl font-semibold">Loading Patient Summary...</h1>
            </div>
          </div>
        </header>
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading patient data...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !patientData) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="flex h-16 items-center px-6">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="ml-6">
              <h1 className="text-xl font-semibold">Patient Summary - Error</h1>
            </div>
          </div>
        </header>
        <div className="container mx-auto p-6">
          <Card className="border-destructive">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-4" />
              <p className="text-destructive font-medium">Error loading patient data</p>
              <p className="text-sm text-muted-foreground mt-2">{error || 'Unknown error occurred'}</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Extract data from API response
  const { patient, case: patientCase, vitals, labs, medical_history, social_history } = patientData;

  const patientInfo = {
    name: patient.name,
    age: patient.age,
    gender: patient.gender,
    dob: new Date(patient.created_at).toISOString().split('T')[0], // Using created_at as fallback
    mrn: patient.mrn,
    address: patient.address,
    phone: patient.contact,
    email: patient.email,
    emergencyContact: "N/A", // Not provided in API
    insurance: "N/A", // Not provided in API
    primaryCare: "N/A" // Not provided in API
  };

  const currentCase = {
    caseId: patientCase.case_id,
    chiefComplaint: patientCase.chief_complaint,
    admissionDate: patientCase.admission_date,
    status: patientCase.status,
    currentDx: patientCase.current_dx,
    assignedTeam: patientCase.assigned_team.length > 0 ? patientCase.assigned_team : ["No team assigned"]
  };

  // Helper function to extract numeric value and determine status
  const parseVitalValue = (value: string, normalRange: string): { numericValue: number, status: string } => {
    const numericValue = parseFloat(value.replace(/[^\d.]/g, ''));
    // Simple logic - you can enhance this based on your requirements
    let status = "normal";
    if (value.includes("°F") && numericValue > 100) status = "high";
    else if (value.includes("bpm") && (numericValue > 100 || numericValue < 60)) status = numericValue > 100 ? "high" : "low";
    else if (value.includes("%") && numericValue < 95) status = "low";
    return { numericValue, status };
  };

  const vitalSigns = [
    { parameter: "Temperature", value: vitals.temperature, normal: "98.6°F", status: parseVitalValue(vitals.temperature, "98.6°F").status, trend: "stable" },
    { parameter: "Blood Pressure", value: vitals.bp, normal: "120/80", status: "normal", trend: "stable" },
    { parameter: "Heart Rate", value: vitals.hr, normal: "60-100", status: parseVitalValue(vitals.hr, "60-100").status, trend: "stable" },
    { parameter: "Respiratory Rate", value: vitals.rr, normal: "12-20", status: "normal", trend: "stable" },
    { parameter: "O2 Saturation", value: vitals.o2sat, normal: ">95%", status: parseVitalValue(vitals.o2sat, ">95%").status, trend: "stable" },
    { parameter: "Weight", value: vitals.weight, normal: "Variable", status: "normal", trend: "stable" }
  ];

  // Helper function to determine lab status based on value vs reference
  const determineLabStatus = (test: string, value: string, reference: string): string => {
    // For specific tests, determine if abnormal
    if (test.includes("C-Reactive Protein") || test.includes("CRP")) {
      const numValue = parseFloat(value);
      const refValue = parseFloat(reference.replace(/[^\d.]/g, ''));
      return numValue > refValue ? 'high' : 'normal';
    }
    
    if (test.includes("ANA")) {
      // ANA titers - 1:320 vs < 1:80
      const valueMatch = value.match(/1:(\d+)/);
      const refMatch = reference.match(/1:(\d+)/);
      if (valueMatch && refMatch) {
        return parseInt(valueMatch[1]) > parseInt(refMatch[1]) ? 'critical' : 'normal';
      }
    }
    
    if (test.includes("Fungal") && value.toLowerCase().includes("positive")) {
      return 'critical';
    }
    
    // Default logic - if reference contains "negative" and value doesn't, it's abnormal
    if (reference.toLowerCase().includes("negative") && !value.toLowerCase().includes("negative")) {
      return 'critical';
    }
    
    return 'normal';
  };

  // Handle labs array - now it's always an array
  const labResults = labs.map(lab => ({
    test: lab.test,
    value: lab.value,
    reference: lab.reference,
    status: determineLabStatus(lab.test, lab.value, lab.reference),
    date: lab.date
  }));

  const medicalHistory = {
    allergies: medical_history.allergies.map(allergy => ({
      allergen: allergy,
      reaction: "See medical records",
      severity: "Moderate"
    })),
    medications: medical_history.medications.map(med => ({
      name: med,
      dose: "See medical records",
      indication: "As prescribed",
      started: "N/A"
    })),
    conditions: medical_history.conditions.length > 0 
      ? medical_history.conditions.map(condition => ({
          condition: condition,
          diagnosed: "N/A",
          status: "Active"
        }))
      : [{ condition: "No significant past medical history", diagnosed: "N/A", status: "N/A" }],
    surgeries: [] // Not provided in API
  };

  const socialHistoryData = {
    occupation: social_history.occupation,
    smoking: social_history.smoking,
    alcohol: social_history.alcohol,
    drugs: "N/A",
    exercise: "N/A",
    diet: "N/A",
    travel: "N/A",
    exposure: "N/A"
  };

  const familyHistory = [
    { relation: "Family History", condition: "Not provided in current data", age: "N/A" }
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
            <h1 className="text-xl font-semibold">{patientInfo.name} - Patient Summary</h1>
            <p className="text-sm text-muted-foreground">
              {patientInfo.mrn} • Age {patientInfo.age} • {patientInfo.gender}
            </p>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <Badge variant="outline" className="bg-warning text-warning-foreground">
              <AlertCircle className="mr-1 h-3 w-3" />
              Active Case
            </Badge>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Summary
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 space-y-6">
        {/* Patient Demographics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Patient Demographics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold">Contact Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>DOB: {patientInfo.dob}</span>
                  </div>
                  <div className="flex items-start">
                    <MapPin className="mr-2 h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>{patientInfo.address}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{patientInfo.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{patientInfo.email}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-semibold">Emergency Contact</h3>
                <div className="text-sm">
                  <p>{patientInfo.emergencyContact}</p>
                </div>
                
                <h3 className="font-semibold">Insurance</h3>
                <div className="text-sm">
                  <p>{patientInfo.insurance}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-semibold">Care Team</h3>
                <div className="text-sm">
                  <p><strong>Primary Care:</strong> {patientInfo.primaryCare}</p>
                </div>
                
                <h3 className="font-semibold">Current Case</h3>
                <div className="text-sm space-y-1">
                  <p><strong>Case ID:</strong> {currentCase.caseId}</p>
                  <p><strong>Status:</strong> {currentCase.status}</p>
                  <p><strong>Admission:</strong> {currentCase.admissionDate}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="vitals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="vitals">Vitals & Labs</TabsTrigger>
            <TabsTrigger value="history">Medical History</TabsTrigger>
            <TabsTrigger value="social">Social History</TabsTrigger>
            <TabsTrigger value="family">Family History</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          {/* Vitals & Labs Tab */}
          <TabsContent value="vitals" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Current Vital Signs */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="mr-2 h-5 w-5" />
                    Current Vital Signs
                  </CardTitle>
                  <CardDescription>Most recent measurements</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {vitalSigns.map((vital) => (
                      <div key={vital.parameter} className="flex items-center justify-between py-2 border-b border-muted">
                        <div>
                          <div className="font-medium text-sm">{vital.parameter}</div>
                          <div className="text-xs text-muted-foreground">Normal: {vital.normal}</div>
                        </div>
                        <div className="text-right">
                          <div className={`font-medium ${
                            vital.status === 'high' ? 'text-destructive' :
                            vital.status === 'low' ? 'text-warning' :
                            'text-success'
                          }`}>
                            {vital.value}
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <TrendingUp className={`mr-1 h-3 w-3 ${
                              vital.trend === 'up' ? 'text-destructive' :
                              vital.trend === 'down' ? 'text-warning' :
                              'text-muted-foreground'
                            }`} />
                            {vital.trend}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Lab Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TestTube className="mr-2 h-5 w-5" />
                    Recent Laboratory Results
                  </CardTitle>
                  <CardDescription>Key diagnostic markers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {labResults.map((lab) => (
                      <div key={lab.test} className="flex items-center justify-between py-2 border-b border-muted">
                        <div>
                          <div className="font-medium text-sm">{lab.test}</div>
                          <div className="text-xs text-muted-foreground">{lab.reference}</div>
                        </div>
                        <div className="text-right">
                          <div className={`font-medium text-sm ${
                            lab.status === 'critical' ? 'text-destructive' :
                            lab.status === 'high' || lab.status === 'low' ? 'text-warning' :
                            'text-success'
                          }`}>
                            {lab.value}
                          </div>
                          <div className="text-xs text-muted-foreground">{lab.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Medical History Tab */}
          <TabsContent value="history" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Current Medications */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Medications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {medicalHistory.medications.map((med, index) => (
                      <div key={index} className="p-3 bg-muted rounded-lg">
                        <div className="font-medium">{med.name}</div>
                        <div className="text-sm text-muted-foreground">{med.dose}</div>
                        <div className="text-xs text-muted-foreground">
                          For: {med.indication} • Started: {med.started}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Allergies */}
              <Card>
                <CardHeader>
                  <CardTitle>Allergies</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {medicalHistory.allergies.map((allergy, index) => (
                      <div key={index} className="p-3 bg-destructive-muted rounded-lg border border-destructive/20">
                        <div className="font-medium text-destructive">{allergy.allergen}</div>
                        <div className="text-sm">{allergy.reaction}</div>
                        <Badge variant={allergy.severity === 'Severe' ? 'destructive' : 'secondary'} className="mt-1">
                          {allergy.severity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Medical Conditions */}
              <Card>
                <CardHeader>
                  <CardTitle>Past Medical History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {medicalHistory.conditions.map((condition, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-muted">
                        <div>
                          <div className="font-medium text-sm">{condition.condition}</div>
                          <div className="text-xs text-muted-foreground">Diagnosed: {condition.diagnosed}</div>
                        </div>
                        <Badge variant={condition.status === 'Controlled' ? 'secondary' : 'outline'}>
                          {condition.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Surgical History */}
              <Card>
                <CardHeader>
                  <CardTitle>Surgical History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {medicalHistory.surgeries.map((surgery, index) => (
                      <div key={index} className="p-3 bg-muted rounded-lg">
                        <div className="font-medium">{surgery.procedure}</div>
                        <div className="text-sm text-muted-foreground">{surgery.date}</div>
                        <div className="text-xs text-muted-foreground">
                          Complications: {surgery.complications}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Social History Tab */}
          <TabsContent value="social" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Social History</CardTitle>
                <CardDescription>Lifestyle and social determinants of health</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {Object.entries(socialHistoryData).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <div className="font-medium text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                      <div className="text-sm text-muted-foreground">{String(value)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Family History Tab */}
          <TabsContent value="family" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Family History</CardTitle>
                <CardDescription>Relevant family medical conditions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {familyHistory.map((family, index) => (
                    <div key={index} className="flex justify-between items-center py-3 border-b border-muted">
                      <div>
                        <div className="font-medium">{family.relation}</div>
                        <div className="text-sm text-muted-foreground">{family.condition}</div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {family.age}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  Patient Timeline
                </CardTitle>
                <CardDescription>Chronological view of patient care</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Generate timeline from lab results and case data */}
                  {[
                    ...labs.map(lab => ({
                      date: lab.date,
                      time: "Various",
                      event: `Lab Result: ${lab.test}`,
                      type: "lab",
                      details: `${lab.value} (Ref: ${lab.reference})`
                    })),
                    {
                      date: patientCase.admission_date,
                      time: new Date(patientCase.last_update).toLocaleTimeString(),
                      event: "Case Created",
                      type: "admission",
                      details: `Chief complaint: ${patientCase.chief_complaint}`
                    },
                    {
                      date: new Date(patient.created_at).toISOString().split('T')[0],
                      time: new Date(patient.created_at).toLocaleTimeString(),
                      event: "Patient Registration",
                      type: "visit",
                      details: "Patient registered in system"
                    }
                  ]
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((item, index) => (
                    <div key={index} className="flex items-start space-x-4 pb-4 border-b border-muted last:border-0">
                      <div className={`w-3 h-3 rounded-full mt-2 ${
                        item.type === 'lab' ? 'bg-info' :
                        item.type === 'treatment' ? 'bg-success' :
                        item.type === 'consult' ? 'bg-warning' :
                        item.type === 'admission' ? 'bg-destructive' :
                        'bg-primary'
                      }`}></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{item.event}</h4>
                          <Badge variant="outline" className="ml-2">
                            {item.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{item.details}</p>
                        <div className="text-xs text-muted-foreground mt-2 flex items-center">
                          <Clock className="mr-1 h-3 w-3" />
                          {item.date} at {item.time}
                        </div>
                      </div>
                    </div>
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

export default PatientSummary;