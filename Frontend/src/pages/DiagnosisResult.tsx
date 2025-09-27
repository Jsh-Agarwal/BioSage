import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DiagnosisResponse } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const DiagnosisResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { diagnosisData } = (location.state || {}) as { diagnosisData?: DiagnosisResponse };

  if (!diagnosisData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold">No diagnosis data found.</h1>
          <Button onClick={() => navigate('/dashboard')} className="mt-4">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const { fused, recommendations } = diagnosisData;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Diagnosis Result</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">Differential Diagnosis</h3>
              <Accordion type="single" collapsible className="w-full">
                {fused.differential.map((diag, index) => (
                  <AccordionItem value={`item-${index}`} key={index}>
                    <AccordionTrigger>
                      <div className="flex justify-between w-full pr-4">
                        <span>{diag.diagnosis}</span>
                        <Badge>{(diag.score_global * 100).toFixed(1)}%</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-2">{diag.why_top}</p>
                      {diag.citations.map((citation, i) => (
                        <p key={i} className="text-xs text-gray-500 italic">
                          - {citation.span} (Source: {citation.doc_id})
                        </p>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Next Best Test</h3>
              <p>{fused.next_best_test.name}: <span className="text-gray-600">{fused.next_best_test.why}</span></p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Recommendations</h3>
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <Card key={index}>
                    <CardHeader className="p-4">
                      <CardTitle className="text-base flex justify-between">
                        {rec.title}
                        <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'secondary' : 'outline'}>
                          {rec.priority}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-sm">{rec.rationale}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="text-center">
        <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
      </div>
    </div>
  );
};

export default DiagnosisResult;
