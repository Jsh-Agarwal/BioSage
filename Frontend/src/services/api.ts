// API base URLs
const BASE_URL = 'http://127.0.0.1:8000/api/v1';
const DIAGNOSIS_BASE_URL = 'https://postmedian-collins-gorgeously.ngrok-free.dev';

// Types for the API responses
export interface UndiagnosedPatient {
  patient_name: string;
  patient_mrn: string;
  patient_age: number;
  case_id: string;
  patient_id: string;
}

export interface DiagnosedPatient {
  patient_name: string;
  patient_age: number;
  patient_mrn: string;
  current_diagnosis: string;
  status: string;
}

// Comprehensive patient data interfaces
export interface Patient {
  _id: string;
  name: string;
  age: number;
  gender: string;
  mrn: string;
  contact: string;
  address: string;
  email: string;
  created_at: string;
}

export interface Case {
  _id: string;
  case_id: string;
  chief_complaint: string;
  admission_date: string;
  status: string;
  current_dx: string;
  assigned_team: string[];
  diagnosed: boolean;
  patient_id: string;
  last_update: string;
}

export interface Vitals {
  _id: string;
  temperature: string; // Now includes unit like "99.1°F"
  bp: string;
  hr: string; // Now includes unit like "80 bpm"
  rr: string; // Now includes unit like "18/min"
  o2sat: string; // Now includes unit like "97%"
  weight: string; // Now includes unit like "68 kg"
  case_id: string;
  timestamp: string;
}

export interface Labs {
  _id: string;
  test: string;
  value: string;
  reference: string;
  status: string; // Changed from abnormal/normal to completed
  date: string;
  case_id: string;
}

export interface MedicalHistory {
  _id: string;
  conditions: string[];
  medications: string[];
  allergies: string[];
  patient_id: string;
}

export interface SocialHistory {
  _id: string;
  smoking: string;
  alcohol: string;
  occupation: string;
  patient_id: string;
}

export interface PatientDataResponse {
  patient: Patient;
  case: Case;
  vitals: Vitals;
  labs: Labs[]; // Changed from single Labs object to Labs array
  medical_history: MedicalHistory;
  social_history: SocialHistory;
}

// Generic API error type
export interface ApiError {
  message: string;
  status?: number;
}

// Fetch undiagnosed patients
export const fetchUndiagnosedPatients = async (
  skip: number = 0,
  limit: number = 50
): Promise<UndiagnosedPatient[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/cases/undiagnosed?skip=${skip}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching undiagnosed patients:', error);
    throw error;
  }
};

// Fetch diagnosed patients
export const fetchDiagnosedPatients = async (): Promise<DiagnosedPatient[]> => {
  try {
    const response = await fetch(`${BASE_URL}/cases/diagnosed`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching diagnosed patients:', error);
    throw error;
  }
};

// Fetch comprehensive patient data by MRN
export const fetchPatientDataByMRN = async (mrn: string): Promise<PatientDataResponse> => {
  const url = `${BASE_URL}/onboarding/${mrn}`;
  console.log('Making API request to:', url);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
      },
    });

    console.log('API response status:', response.status);
    console.log('API response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('API response data:', data);
    return data;
  } catch (error) {
    console.error('Error fetching patient data by MRN:', error);
    throw error;
  }
};

// Fetch patient onboarding data (same as fetchPatientDataByMRN but with clearer name for diagnosis flow)
export const fetchPatientOnboardingData = async (mrn: string): Promise<PatientDataResponse> => {
  return fetchPatientDataByMRN(mrn);
};

// Types for the diagnosis response
export interface DiagnosisCandidate {
  diagnosis: string;
  rationale: string;
  citations: {
    doc_id: string;
    span: string;
  }[];
  confidence_qual: string;
  score_local: number;
}

export interface DiagnosisAgent {
  agent: string;
  candidates: DiagnosisCandidate[];
}

export interface FusedDifferential {
  diagnosis: string;
  score_global: number;
  why_top: string;
  citations: {
    doc_id: string;
    span: string;
  }[];
}

export interface NextBestTest {
  name: string;
  why: string;
  linked_hypotheses: string[];
}

export interface TestPlan {
  diagnosis: string;
  plan: string;
}

export interface FusedDiagnosis {
  differential: FusedDifferential[];
  next_best_test: NextBestTest;
  disagreement_score: number;
  test_plans: TestPlan[];
}

export interface Recommendation {
  title: string;
  rationale: string;
  priority: string;
}

export interface DiagnosisResponse {
  agents: DiagnosisAgent[];
  fused: FusedDiagnosis;
  recommendations: Recommendation[];
}

// Diagnose patient using real patient data
export const diagnosePatient = async (patientData: PatientDataResponse): Promise<DiagnosisResponse> => {
  try {
    console.log('Sending diagnosis request to ngrok endpoint with patient data:', patientData);
    
    const response = await fetch(`${DIAGNOSIS_BASE_URL}/diagnose`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true', // Skip ngrok browser warning
      },
      body: JSON.stringify(patientData),
    });

    console.log('Diagnosis response status:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Diagnosis response data:', data);
    return data;
  } catch (error) {
    console.error('Error diagnosing patient:', error);
    throw error;
  }
};

// Fetch diagnosed results for a patient by MRN
export const fetchDiagnosedResults = async (mrn: string): Promise<DiagnosisResponse> => {
  try {
    console.log('Fetching diagnosed results for MRN:', mrn);
    const url = `${DIAGNOSIS_BASE_URL}/diagnosed_result/${mrn}`;
    console.log('Full request URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true', // Skip ngrok browser warning
      },
    });

    console.log('Diagnosed results response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    // First, get the response text to see what we're actually receiving
    const responseText = await response.text();
    console.log('Raw response (first 200 chars):', responseText.substring(0, 200));

    if (!response.ok) {
      console.error('API Error Response:', responseText);
      throw new Error(`HTTP error! status: ${response.status}, response: ${responseText.substring(0, 100)}...`);
    }

    // Check if the response looks like HTML (DOCTYPE, html tags, etc.)
    if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
      console.error('Received HTML instead of JSON:', responseText.substring(0, 300));
      throw new Error('Server returned HTML instead of JSON. This might be due to CORS issues, ngrok tunnel problems, or incorrect endpoint configuration.');
    }

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError);
      console.error('Response text that failed to parse:', responseText.substring(0, 500));
      throw new Error(`Invalid JSON response: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
    }

    console.log('Diagnosed results data:', data);
    return data;
  } catch (error) {
    console.error('Error fetching diagnosed results:', error);
    throw error;
  }
};

export const diagnosisRequest = {
  "patient": {
    "name": "Mann",
    "dob": "1993-04-12",
    "gender": "Male",
    "mrn": "MANN-001",
    "address": "123 Health St, City",
    "phone": "9876543210",
    "email": "mann@example.com",
    "emergency_contact": "Riya Mann (+91-9876500000)",
    "insurance": "ABC Health - Silver Plan",
    "primary_care": "Dr. A. Rao, MD"
  },
  "case": {
    "case_id": "CASE-2025-001",
    "patient_id": "MANN-001",
    "chief_complaint": "Persistent skin rash, joint pain, fatigue",
    "admission_date": "2025-09-27",
    "status": "active",
    "current_dx": "Suspected fungal infection and autoimmune disorder",
    "assigned_team": [
      "dr.smith@example.com",
      "dr.jones@example.com"
    ],
    "diagnosed": false
  },
  "vitals": {
    "temperature": "99.1°F",
    "bp": "130/85",
    "hr": "80 bpm",
    "rr": "18/min",
    "o2sat": "97%",
    "weight": "68 kg"
  },
  "labs": [
    {
      "test": "Fungal Culture",
      "value": "Positive for Candida",
      "reference": "Negative",
      "status": "completed",
      "date": "2025-09-26"
    }
  ],
  "medical_history": {
    "patient_id": "MANN-001",
    "allergies": ["Penicillin"],
    "medications": ["Inhaler"],
    "conditions": ["Asthma"],
    "surgeries": []
  },
  "social_history": {
    "patient_id": "MANN-001",
    "occupation": "Software Engineer",
    "smoking": "No",
    "alcohol": "Occasional",
    "drugs": "No",
    "exercise": "3-4 times/week",
    "diet": "Mixed/Balanced",
    "travel": "None recent",
    "exposure": "No known exposures"
  }
};