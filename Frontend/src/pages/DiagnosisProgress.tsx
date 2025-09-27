import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { fetchPatientOnboardingData, diagnosePatient, DiagnosisResponse, PatientDataResponse } from '@/services/api';

const captions = [
  'Searching knowledgebase...',
  'Vectorbase search...',
  'Agents argument masters collecting results...',
  'Generating AI recommendations and results...',

  'Bootstrapping context graphs...',
  'Orchestrating multi-agent debate...',
  'Synthesizing insights across sources...',
  'Scoring relevance with semantic signals...',
  'Distilling long documents into key takeaways...',
  'Fact-checking claims against trusted data...',
  'Calibrating confidence and uncertainty...',
  'Ranking evidence and preparing citations...',
  'Assembling a clear, actionable plan...',
  'Polishing results for a judge-ready finish...',
];


const DiagnosisProgress = () => {
  const [progress, setProgress] = useState(0);
  const [caption, setCaption] = useState(captions[0]);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { mrn } = useParams<{ mrn: string }>();

  useEffect(() => {
    const handleDiagnosis = async () => {
      if (!mrn) {
        setError('No patient MRN provided');
        navigate('/dashboard');
        return;
      }

      try {
        console.log('Starting diagnosis process for MRN:', mrn);
        
        // First, fetch patient data by MRN
        console.log('Fetching patient onboarding data...');
        const patientData = await fetchPatientOnboardingData(mrn);
        console.log('Patient data fetched:', patientData);
        
        // Then, send this data to the diagnosis endpoint
        console.log('Sending patient data for diagnosis...');
        const diagnosisData = await diagnosePatient(patientData);
        console.log('Diagnosis completed:', diagnosisData);
        
        // Navigate to the case view page with the data
        navigate(`/case-view/${patientData.case.case_id}`, { 
          state: { 
            diagnosisData, 
            requestData: patientData 
          } 
        });
      } catch (error) {
        console.error('Diagnosis failed:', error);
        setError(error instanceof Error ? error.message : 'Diagnosis failed');
        // Go back to dashboard on error after showing error for a moment
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      }
    };

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          handleDiagnosis(); // Call diagnosis when progress reaches 100
          return 100;
        }
        const newProgress = prev + 25;
        setCaption(captions[Math.floor(newProgress / 25)] || captions[captions.length - 1]);
        return newProgress;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [navigate, mrn]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {error ? 'Diagnosis Failed' : 'Running Diagnosis'}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {error ? error : 'Please wait while we analyze the patient\'s data.'}
          </p>
        </div>
        
        {!error && (
          <>
            <div className="flex flex-col items-center space-y-4">
              <Progress value={progress} className="w-full" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{caption}</p>
            </div>
            <div className="flex items-center justify-center">
              <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          </>
        )}
        
        {error && (
          <div className="flex items-center justify-center">
            <svg className="h-8 w-8 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiagnosisProgress;
