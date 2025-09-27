import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import {
  CalendarIcon, ChevronLeft, ChevronRight, Plus, Trash2,
  User, FileText, Activity, FlaskConical, History, Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';

/* --- PDF.js + Gemini imports --- */
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import * as pdfjsLib from 'pdfjs-dist';
import { GoogleGenerativeAI } from '@google/generative-ai';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/* Types */
interface PatientData {
  // Demographics
  name: string;
  dob: Date | undefined;
  gender: string;
  mrn: string;
  address: string;
  phone: string;
  email: string;
  emergency_contact: string;
  insurance: string;
  primary_care: string;

  // Case Info
  chief_complaint: string;
  admission_date: Date | undefined;
  status: string;
  current_dx: string;
  assigned_team: string[];
  diagnose: number;

  // Vitals
  temperature: string;
  bp: string;
  hr: string;
  rr: string;
  o2sat: string;
  weight: string;

  // Medical History
  allergies: Array<{
    allergen: string;
    reaction: string;
    severity: string;
  }>;
  medications: Array<{
    name: string;
    dose: string;
    indication: string;
    started: Date | undefined;
    status: string;
  }>;
  conditions: Array<{
    condition: string;
    diagnosed: Date | undefined;
    status: string;
  }>;
  surgeries: Array<{
    procedure: string;
    date: Date | undefined;
    complications: string;
  }>;

  // Social History
  occupation: string;
  smoking: string;
  alcohol: string;
  drugs: string;
  exercise: string;
  diet: string;
  travel: string;
  exposure: string;
}

interface ApiPayload {
  patient: {
    name: string;
    age: number | null;
    gender: string;
    mrn: string;
    contact: string;
    address: string;
    email: string;
  };
  case: {
    case_id: string;
    chief_complaint: string;
    admission_date: string;
    status: string;
    current_dx: string;
    assigned_team: string[];
    diagnosed: boolean;
  };
  vitals: {
    temperature: string;
    bp: string;
    hr: string;
    rr: string;
    o2sat: string;
    weight: string;
  };
  labs: LabData | LabData[];
  medical_history: {
    conditions: string[];
    medications: string[];
    allergies: string[];
  };
  social_history: {
    smoking: string;
    alcohol: string;
    occupation: string;
  };
}

interface LabData {
  test: string;
  value: string;
  reference: string;
  status: string;
  date: string;
}

/* Strict labs shape */
type LabItem = {
  test: string;
  value: string;
  reference: string;
  status: string;   // UI: "Pending" | "Normal" | "Abnormal" | "Critical" | "Completed"
  pending: boolean;
};
type LabsPayload = { labs: LabItem[] };

const steps = [
  { id: 1, title: 'Demographics', icon: User, description: 'Basic patient information' },
  { id: 2, title: 'Case Details', icon: FileText, description: 'Current presentation and status' },
  { id: 3, title: 'Vital Signs', icon: Activity, description: 'Current vital measurements' },
  { id: 4, title: 'Lab Results', icon: FlaskConical, description: 'Laboratory findings' },
  { id: 5, title: 'Medical History', icon: History, description: 'Past medical information' },
  { id: 6, title: 'Social History', icon: Users, description: 'Lifestyle and social factors' }
];

const PatientOnboarding = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  const [labPdf, setLabPdf] = useState<File | null>(null);
  const [labsJson, setLabsJson] = useState<LabsPayload | null>(null); // keep internally if needed
  const [labParseLoading, setLabParseLoading] = useState(false);
  const [labParseError, setLabParseError] = useState<string | null>(null);

  // UI-facing labs list (what we render & edit)
  const [labsUI, setLabsUI] = useState<LabItem[]>([]);

  const [formData, setFormData] = useState<PatientData>({
    name: '',
    dob: undefined,
    gender: '',
    mrn: '',
    address: '',
    phone: '',
    email: '',
    emergency_contact: '',
    insurance: '',
    primary_care: '',
    chief_complaint: '',
    admission_date: undefined,
    status: 'active',
    current_dx: '',
    assigned_team: [],
    diagnose: 0,
    temperature: '',
    bp: '',
    hr: '',
    rr: '',
    o2sat: '',
    weight: '',
    allergies: [{ allergen: '', reaction: '', severity: 'mild' }],
    medications: [{ name: '', dose: '', indication: '', started: undefined, status: 'active' }],
    conditions: [{ condition: '', diagnosed: undefined, status: 'active' }],
    surgeries: [{ procedure: '', date: undefined, complications: '' }],
    occupation: '',
    smoking: '',
    alcohol: '',
    drugs: '',
    exercise: '',
    diet: '',
    travel: '',
    exposure: ''
  });

  const mutation = useMutation({
    mutationFn: (newPatientData: unknown) => {
      return fetch('http://127.0.0.1:8000/api/v1/onboarding/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify(newPatientData),
      }).then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      });
    },
    onSuccess: () => {
      toast({
        title: "Patient Onboarded Successfully",
        description: `${formData.name} has been added to the system.`,
      });
      navigate('/dashboard');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to onboard patient. Please try again.",
        variant: "destructive",
      });
      console.error('Error submitting patient data:', error);
    },
  });

  const updateFormData = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addArrayItem = (field: keyof PatientData, defaultItem: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] as unknown[]), defaultItem]
    }));
  };

  const removeArrayItem = (field: keyof PatientData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as unknown[]).filter((_, i) => i !== index)
    }));
  };

  const updateArrayItem = (field: keyof PatientData, index: number, itemField: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as Record<string, unknown>[]).map((item, i) => 
        i === index ? { ...item, [itemField]: value } : item
      )
    }));
  };

  const handleNext = () => setCurrentStep(s => Math.min(s + 1, steps.length));
  const handlePrevious = () => setCurrentStep(s => Math.max(s - 1, 1));

  /* ===== Utilities ===== */
  // Map model statuses to UI dropdown values
  const statusToUI = (status: string, pending: boolean, value: string) => {
    if (pending) return "Pending";
    const s = (status || "").toLowerCase().trim();
    if (s.includes("critical")) return "Critical";
    if (s === "high" || s === "low" || s === "abnormal") return "Abnormal";
    if (s === "normal") return "Normal";
    if (value && !s) return "Completed"; // concrete value without explicit flag
    return "Normal";
  };

  // Normalize UI status back to DB-safe keywords
  const statusForDB = (s: string) => {
    const k = (s || "").toLowerCase();
    if (k.startsWith("pend")) return "pending";
    if (k.startsWith("crit")) return "critical";
    if (k.startsWith("abn")) return "abnormal";
    if (k.startsWith("comp")) return "completed";
    return "normal";
  };

  // Age calculator with edge-guards
  const calcAge = (dob?: Date) => {
    if (!dob) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age < 0 || age > 120 ? null : age;
  };

  /* ===== PDF → Text (frontend) ===== */
  const extractTextFromPdf = async (file: File): Promise<string> => {
    const data = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const pageText = (content.items as { str?: string }[])
        .map((it) => (typeof it.str === 'string' ? it.str : ''))
        .join(' ');
      fullText += `\n\n----- PAGE ${pageNum} -----\n${pageText}`;
    }
    return fullText.trim();
  };

  /* ===== Gemini call (browser demo) ===== */
  const normalizeLabsJson = (data: unknown): LabsPayload => {
    const out: LabsPayload = { labs: [] };
    if (!data || typeof data !== 'object' || !('labs' in data) || !Array.isArray((data as { labs: unknown }).labs)) return out;

    out.labs = ((data as { labs: unknown[] }).labs).map((row: unknown): LabItem => {
      const rowObj = row && typeof row === 'object' ? row as Record<string, unknown> : {};
      return {
        test: typeof rowObj.test === 'string' ? rowObj.test : '',
        value: typeof rowObj.value === 'string' ? rowObj.value : '',
        reference: typeof rowObj.reference === 'string' ? rowObj.reference : '',
        status: typeof rowObj.status === 'string' ? rowObj.status : (rowObj.pending ? 'pending' : ''),
        pending: typeof rowObj.pending === 'boolean' ? rowObj.pending : false,
      };
    }).filter((r: LabItem) => r.test);

    return out;
  };

  const callGeminiForLabs = async (rawText: string): Promise<LabsPayload> => {
    const apiKey = "AIzaSyDzJNqdKBSpanA0YAoxstDJjiUScy8knwQ";
    if (!apiKey) {
      throw new Error('Missing VITE_GEMINI_API_KEY. (For production, proxy this via backend.)');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-pro',
      generationConfig: {
        temperature: 0,
        responseMimeType: 'application/json'
      }
    });

    const clippedText = rawText.length > 180_000 ? rawText.slice(0, 180_000) : rawText;

    const prompt = `
You are given OCR-like text extracted from a lab results PDF.
Return ONLY a strict JSON object with the following shape:

{
  "labs": [
    { "test": string, "value": string, "reference": string, "status": string, "pending": boolean }
  ]
}

Rules:
- "test": lab test name (e.g., "Hemoglobin", "WBC", "Creatinine").
- "value": the reported numeric or qualitative result exactly as shown (e.g., "13.5 g/dL", "Positive", "—" if missing).
- "reference": the reference/normal range as printed, or "" if not present.
- "status": derive using the reference when possible: "pending", "normal", "abnormal", or "critical".
- "pending": true if the report marks it pending or the value is missing; otherwise false.
- Do not include any other keys.
- If nothing can be parsed, return {"labs": []} only.

Text begins:
"""${clippedText}"""
    `.trim();

    const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }] });
    const text = result.response.text();
    let parsed: unknown;

    try {
      parsed = JSON.parse(text);
    } catch {
      const cleaned = text.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }
    return normalizeLabsJson(parsed);
  };

  const handleProcessLabs = async () => {
    setLabParseError(null);
    if (!labPdf) {
      setLabsUI([]);
      setLabsJson({ labs: [] });
      toast({ title: "No PDF selected", description: "Please upload a Lab Results PDF first." });
      return;
    }

    setLabParseLoading(true);
    try {
      const text = await extractTextFromPdf(labPdf);
      const labs = await callGeminiForLabs(text);
      setLabsJson(labs); // kept internally if needed

      const uiRows: LabItem[] = (labs?.labs ?? []).map((r) => ({
        test: r.test || "",
        value: r.value || "",
        reference: r.reference || "",
        status: statusToUI(r.status, r.pending, r.value), // -> "Pending" | "Normal" | "Abnormal" | "Critical" | "Completed"
        pending: !!r.pending
      }));

      setLabsUI(uiRows);
      toast({ title: "Labs extracted", description: `Found ${uiRows.length} lab item(s).` });
    } catch (err: unknown) {
      console.error(err);
      setLabParseError(err instanceof Error ? err.message : 'Failed to parse labs');
      toast({ title: "Lab extraction failed", description: "Check the PDF and try again.", variant: "destructive" });
    } finally {
      setLabParseLoading(false);
    }
  };

  /* ===== Submit in requested shape ===== */
  const handleSubmit = () => {
    const todayStr = format(new Date(), "yyyy-MM-dd");

    // Labs to DB shape
    const labsArray = (labsUI && labsUI.length ? labsUI : [])
      .filter(r => r.test || r.value || r.reference)
      .map(r => ({
        test: r.test,
        value: r.value,
        reference: r.reference,
        status: statusForDB(r.status), // "pending" | "normal" | "abnormal" | "critical" | "completed"
        date: todayStr
      }));

    // Use single object when exactly one lab, otherwise a list (edge-case friendly)
    const labsOut: LabData | LabData[] = labsArray.length === 1 ? labsArray[0] : labsArray;

    const finalPayload: ApiPayload = {
      patient: {
        name: formData.name || "",
        age: calcAge(formData.dob), // null if unknown/out of bounds
        gender: formData.gender ? formData.gender[0].toUpperCase() + formData.gender.slice(1) : "",
        mrn: formData.mrn || "",
        contact: formData.phone || "",
        address: formData.address || "",
        email: formData.email || ""
      },
      case: {
        case_id: `CASE-${format(new Date(), "yyyy")}-${String(Date.now()).slice(-3)}`,
        chief_complaint: formData.chief_complaint || "",
        admission_date: formData.admission_date ? format(formData.admission_date, "yyyy-MM-dd") : todayStr,
        status: formData.status || "active",
        current_dx: formData.current_dx || "",
        assigned_team: formData.assigned_team ?? [],
        diagnosed: Boolean(formData.diagnose) // treat non-zero as true
      },
      vitals: {
        temperature: formData.temperature || "",
        bp: formData.bp || "",
        hr: formData.hr || "",
        rr: formData.rr || "",
        o2sat: formData.o2sat || "",
        weight: formData.weight || ""
      },
      labs: labsOut,
      medical_history: {
        // reduce to string lists like your example
        conditions: (formData.conditions ?? [])
          .map(c => (c?.condition || "").trim())
          .filter(Boolean),
        medications: (formData.medications ?? [])
          .map(m => (m?.name || "").trim())
          .filter(Boolean),
        allergies: (formData.allergies ?? [])
          .map(a => (a?.allergen || "").trim())
          .filter(Boolean)
      },
      social_history: {
        smoking: formData.smoking || "",
        alcohol: formData.alcohol || "",
        occupation: formData.occupation || ""
      }
    };

    mutation.mutate(finalPayload);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  placeholder="Patient full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mrn">Medical Record Number *</Label>
                <Input
                  id="mrn"
                  value={formData.mrn}
                  onChange={(e) => updateFormData('mrn', e.target.value)}
                  placeholder="MRN-000000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date of Birth *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.dob && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.dob ? format(formData.dob, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.dob}
                      onSelect={(date) => updateFormData('dob', date)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Gender *</Label>
                <Select value={formData.gender} onValueChange={(value) => updateFormData('gender', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => updateFormData('address', e.target.value)}
                placeholder="Patient address"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                  placeholder="Phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  placeholder="Email address"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact">Emergency Contact</Label>
                <Input
                  id="emergency_contact"
                  value={formData.emergency_contact}
                  onChange={(e) => updateFormData('emergency_contact', e.target.value)}
                  placeholder="Name and phone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="insurance">Insurance</Label>
                <Input
                  id="insurance"
                  value={formData.insurance}
                  onChange={(e) => updateFormData('insurance', e.target.value)}
                  placeholder="Insurance provider"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="primary_care">Primary Care Physician</Label>
              <Input
                id="primary_care"
                value={formData.primary_care}
                onChange={(e) => updateFormData('primary_care', e.target.value)}
                placeholder="Primary care doctor"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="chief_complaint">Chief Complaint *</Label>
              <Textarea
                id="chief_complaint"
                value={formData.chief_complaint}
                onChange={(e) => updateFormData('chief_complaint', e.target.value)}
                placeholder="Primary reason for visit"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Admission Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.admission_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.admission_date ? format(formData.admission_date, "PPP") : <span>Select date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.admission_date}
                      onSelect={(date) => updateFormData('admission_date', date)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value) => updateFormData('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="stable">Stable</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="discharged">Discharged</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_dx">Current Diagnosis</Label>
              <Input
                id="current_dx"
                value={formData.current_dx}
                onChange={(e) => updateFormData('current_dx', e.target.value)}
                placeholder="Working diagnosis"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature (°F)</Label>
                <Input
                  id="temperature"
                  value={formData.temperature}
                  onChange={(e) => updateFormData('temperature', e.target.value)}
                  placeholder="98.6"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bp">Blood Pressure</Label>
                <Input
                  id="bp"
                  value={formData.bp}
                  onChange={(e) => updateFormData('bp', e.target.value)}
                  placeholder="120/80"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hr">Heart Rate (bpm)</Label>
                <Input
                  id="hr"
                  value={formData.hr}
                  onChange={(e) => updateFormData('hr', e.target.value)}
                  placeholder="72"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rr">Respiratory Rate</Label>
                <Input
                  id="rr"
                  value={formData.rr}
                  onChange={(e) => updateFormData('rr', e.target.value)}
                  placeholder="16"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="o2sat">O2 Saturation (%)</Label>
                <Input
                  id="o2sat"
                  value={formData.o2sat}
                  onChange={(e) => updateFormData('o2sat', e.target.value)}
                  placeholder="98"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (lbs)</Label>
                <Input
                  id="weight"
                  value={formData.weight}
                  onChange={(e) => updateFormData('weight', e.target.value)}
                  placeholder="150"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="lab-pdf-upload">Upload Lab Results PDF</Label>
              <Input
                id="lab-pdf-upload"
                type="file"
                accept="application/pdf"
                onChange={(e) => setLabPdf(e.target.files ? e.target.files[0] : null)}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={handleProcessLabs} disabled={labParseLoading || !labPdf}>
                {labParseLoading ? 'Processing…' : 'Extract & Structure Labs'}
              </Button>
              {labParseError && <span className="text-sm text-destructive">{labParseError}</span>}
              {!!labsUI.length && !labParseError && (
                <Badge variant="secondary">{labsUI.length} item(s) parsed</Badge>
              )}
              <div className="ml-auto">
                <Button
                  variant="outline"
                  onClick={() =>
                    setLabsUI((prev) => [
                      ...prev,
                      { test: "", value: "", reference: "", status: "Pending", pending: true }
                    ])
                  }
                >
                  + Add Lab
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Laboratory Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {labsUI.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No lab rows yet. Upload a PDF or click “Add Lab”.</p>
                ) : (
                  labsUI.map((row, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center rounded-md border p-3 bg-muted/20"
                    >
                      <div className="md:col-span-4">
                        <Label className="text-xs">Test Name</Label>
                        <Input
                          value={row.test}
                          placeholder="CBC, BMP, etc."
                          onChange={(e) =>
                            setLabsUI((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, test: e.target.value } : r))
                            )
                          }
                        />
                      </div>
                      <div className="md:col-span-3">
                        <Label className="text-xs">Value</Label>
                        <Input
                          value={row.value}
                          placeholder="Test result"
                          onChange={(e) =>
                            setLabsUI((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, value: e.target.value } : r))
                            )
                          }
                        />
                      </div>
                      <div className="md:col-span-3">
                        <Label className="text-xs">Reference Range</Label>
                        <Input
                          value={row.reference}
                          placeholder="Normal range"
                          onChange={(e) =>
                            setLabsUI((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, reference: e.target.value } : r))
                            )
                          }
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-xs">Status</Label>
                        <Select
                          value={row.status}
                          onValueChange={(v) =>
                            setLabsUI((prev) =>
                              prev.map((r, i) =>
                                i === idx ? { ...r, status: v, pending: v === "Pending" } : r
                              )
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Normal">Normal</SelectItem>
                            <SelectItem value="Abnormal">Abnormal</SelectItem>
                            <SelectItem value="Critical">Critical</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="md:col-span-12 flex justify-end">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setLabsUI((prev) => prev.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 5:
        return (
          <div className="space-y-8">
            {/* Allergies */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Allergies</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('allergies', { allergen: '', reaction: '', severity: 'mild' })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Allergy
                </Button>
              </div>

              {formData.allergies.map((allergy, index) => (
                <Card key={index} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Allergen</Label>
                      <Input
                        value={allergy.allergen}
                        onChange={(e) => updateArrayItem('allergies', index, 'allergen', e.target.value)}
                        placeholder="Penicillin, Peanuts, etc."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Reaction</Label>
                      <Input
                        value={allergy.reaction}
                        onChange={(e) => updateArrayItem('allergies', index, 'reaction', e.target.value)}
                        placeholder="Rash, swelling, etc."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Severity</Label>
                      <div className="flex gap-2">
                        <Select
                          value={allergy.severity}
                          onValueChange={(value) => updateArrayItem('allergies', index, 'severity', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mild">Mild</SelectItem>
                            <SelectItem value="moderate">Moderate</SelectItem>
                            <SelectItem value="severe">Severe</SelectItem>
                            <SelectItem value="life-threatening">Life-threatening</SelectItem>
                          </SelectContent>
                        </Select>
                        {formData.allergies.length > 1 && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => removeArrayItem('allergies', index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Medications */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Current Medications</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('medications', { name: '', dose: '', indication: '', started: undefined, status: 'active' })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Medication
                </Button>
              </div>

              {formData.medications.map((medication, index) => (
                <Card key={index} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Medication</Label>
                      <Input
                        value={medication.name}
                        onChange={(e) => updateArrayItem('medications', index, 'name', e.target.value)}
                        placeholder="Drug name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Dose</Label>
                      <Input
                        value={medication.dose}
                        onChange={(e) => updateArrayItem('medications', index, 'dose', e.target.value)}
                        placeholder="10mg daily"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Indication</Label>
                      <Input
                        value={medication.indication}
                        onChange={(e) => updateArrayItem('medications', index, 'indication', e.target.value)}
                        placeholder="Hypertension"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <div className="flex gap-2">
                        <Select
                          value={medication.status}
                          onValueChange={(value) => updateArrayItem('medications', index, 'status', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="discontinued">Discontinued</SelectItem>
                            <SelectItem value="on-hold">On Hold</SelectItem>
                          </SelectContent>
                        </Select>
                        {formData.medications.length > 1 && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => removeArrayItem('medications', index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="occupation">Occupation</Label>
                <Input
                  id="occupation"
                  value={formData.occupation}
                  onChange={(e) => updateFormData('occupation', e.target.value)}
                  placeholder="Job title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smoking">Smoking History</Label>
                <Input
                  id="smoking"
                  value={formData.smoking}
                  onChange={(e) => updateFormData('smoking', e.target.value)}
                  placeholder="Never, former, current"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="alcohol">Alcohol Use</Label>
                <Input
                  id="alcohol"
                  value={formData.alcohol}
                  onChange={(e) => updateFormData('alcohol', e.target.value)}
                  placeholder="Drinks per week"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="drugs">Substance Use</Label>
                <Input
                  id="drugs"
                  value={formData.drugs}
                  onChange={(e) => updateFormData('drugs', e.target.value)}
                  placeholder="Current or past use"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exercise">Exercise Habits</Label>
                <Input
                  id="exercise"
                  value={formData.exercise}
                  onChange={(e) => updateFormData('exercise', e.target.value)}
                  placeholder="Frequency and type"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diet">Diet</Label>
                <Input
                  id="diet"
                  value={formData.diet}
                  onChange={(e) => updateFormData('diet', e.target.value)}
                  placeholder="Special dietary needs"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="travel">Recent Travel</Label>
              <Textarea
                id="travel"
                value={formData.travel}
                onChange={(e) => updateFormData('travel', e.target.value)}
                placeholder="Recent travel history"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exposure">Environmental Exposures</Label>
              <Textarea
                id="exposure"
                value={formData.exposure}
                onChange={(e) => updateFormData('exposure', e.target.value)}
                placeholder="Chemical, occupational, or environmental exposures"
                rows={2}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-variant border-b border-border/20">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary-foreground">Patient Onboarding</h1>
              <p className="text-primary-foreground/80 mt-2">Complete patient registration and initial assessment</p>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="outline" className="bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                  Back to Dashboard
                </Button>
              </Link>
              <div className="text-right text-primary-foreground/80">
                <div className="text-sm">Step {currentStep} of {steps.length}</div>
                <div className="text-2xl font-bold">{Math.round((currentStep / steps.length) * 100)}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center overflow-x-auto">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              const Icon = step.icon;

              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center space-x-3 min-w-0 flex-1",
                    index < steps.length - 1 && "border-r border-border pr-4"
                  )}
                >
                  <div className={cn(
                    "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                    isActive && "border-primary bg-primary text-primary-foreground",
                    isCompleted && "border-accent bg-accent text-accent-foreground",
                    !isActive && !isCompleted && "border-muted-foreground/30 text-muted-foreground"
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn(
                      "text-sm font-medium truncate",
                      isActive && "text-primary",
                      isCompleted && "text-accent",
                      !isActive && !isCompleted && "text-muted-foreground"
                    )}>
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="container mx-auto px-6 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              {React.createElement(steps[currentStep - 1].icon, { className: "w-6 h-6 text-primary" })}
              <span>{steps[currentStep - 1].title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {renderStepContent()}

            {/* Navigation */}
            <div className="flex justify-between pt-6 border-t border-border">
              <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 1}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {currentStep === steps.length ? (
                <Button onClick={handleSubmit} disabled={mutation.isPending} className="bg-accent hover:bg-accent/90">
                  {mutation.isPending ? 'Submitting...' : 'Complete Onboarding'}
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PatientOnboarding;
