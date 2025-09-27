import { useState, useRef } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Upload, ImageIcon, Bot, User, Loader2, Send, ArrowLeft } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import AnalysisChart from '@/components/ui/AnalysisChart';
import { Link } from 'react-router-dom';

// Updated data structure for a chat message
interface ChatMessage {
  id: number;
  sender: 'user' | 'bot';
  type: 'text' | 'image' | 'analysis';
  content: string | File;
  analysis?: {
    disease: string;
    score: number;
    highlights: string;
  }[];
  d3Data?: { disease: string; score: number }[];
  imageUrl?: string;
}

const VisualDiagnosis = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('AIzaSyBIM2YOcwm2ifx-nIGtGhCg_qdixSW7so8'); // API Key state is now empty by default
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleSend = async () => {
    if (!selectedFile) return;
    if (!apiKey) {
      setError("Please enter your Google AI API Key to proceed.");
      return;
    }
    setError(null);

    const userMessage: ChatMessage = {
      id: Date.now(),
      sender: 'user',
      type: 'image',
      content: selectedFile,
      imageUrl: URL.createObjectURL(selectedFile),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setSelectedFile(null);

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Corrected model name

      const fileToGenerativePart = async (file: File) => {
        const base64EncodedData = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(file);
        });
        return {
          inlineData: { data: base64EncodedData, mimeType: file.type },
        };
      };

      const imagePart = await fileToGenerativePart(selectedFile);
      // Enhanced prompt to ask for d3_data specifically
      const prompt = `Analyze the attached medical image of a skin lesion. Provide a differential diagnosis. 
      1.  Return a summary paragraph of your findings.
      2.  Return a JSON array for a detailed list. For each potential condition, provide a "disease" name, a "score" (confidence level from 0 to 100), and "highlights" (a brief explanation of the visual evidence).
      3.  Return a separate JSON array formatted for a D3.js chart, named "d3_data". This array should contain objects with "disease" and "score" fields.
      
      Enclose both JSON arrays in a single JSON object like this:
      \`\`\`json
      {
        "analysis": [ ... ],
        "d3_data": [ ... ]
      }
      \`\`\`
      `;

      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();
      
      let analysis = [];
      let d3Data = [];
      let summary = "Could not parse the analysis from the model's response.";

      const jsonRegex = /```json\n([\s\S]*?)\n```/;
      const jsonMatch = text.match(jsonRegex);

      if (jsonMatch && jsonMatch[1]) {
        try {
          const parsedJson = JSON.parse(jsonMatch[1]);
          analysis = parsedJson.analysis || [];
          d3Data = parsedJson.d3_data || [];
          summary = text.replace(jsonRegex, '').trim();
        } catch (e) {
          console.error("Failed to parse JSON from model response:", e);
          setError("Failed to parse the analysis from the model. The response format might have changed.");
        }
      } else {
        summary = text;
      }

      const botMessage: ChatMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        type: 'analysis',
        content: summary,
        analysis: analysis,
        d3Data: d3Data, // Storing d3_data in the message
        imageUrl: userMessage.imageUrl,
      };

      setMessages(prev => [...prev, botMessage]);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`API Error: ${errorMessage}`);
      console.error('Error calling Gemini API:', err);
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 p-4 sm:p-6 lg:p-8">
      <Card className="max-w-5xl mx-auto h-[calc(100vh-4rem)] flex flex-col bg-white backdrop-blur-sm border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center">
            <Bot className="mr-3 h-8 w-8 text-primary animate-pulse" />
            <div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                Visual Diagnosis Assistant
                </CardTitle>
                <p className="text-sm text-gray-500">Powered by Gemini-Pro Vision</p>
            </div>
          </div>
          <Link to="/dashboard">
            <Button variant="ghost" className="text-gray-600 hover:bg-gray-200 hover:text-gray-900">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
            </Button>
          </Link>
        </CardHeader>
        <ScrollArea className="flex-grow p-4 border-t border-b border-gray-200">
          <div className="space-y-8">
            {error && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-red-100 border border-red-300 text-red-700">
                    <p>{error}</p>
                </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex items-start gap-4 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                {msg.sender === 'bot' && (
                  <Avatar className="border-2 border-primary">
                    <AvatarFallback className="bg-blue-100 text-primary">AI</AvatarFallback>
                  </Avatar>
                )}
                <div className={`rounded-xl p-4 max-w-2xl shadow-lg transition-all duration-300 ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
                  {msg.type === 'image' && msg.imageUrl && (
                    <img src={msg.imageUrl} alt="User upload" className="rounded-lg max-h-72 border-2 border-gray-300" />
                  )}
                  {msg.type === 'analysis' && (
                    <div className="space-y-6">
                      <p className="text-gray-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: msg.content as string }}></p>
                      
                      {msg.d3Data && msg.d3Data.length > 0 && (
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <AnalysisChart data={msg.d3Data} />
                        </div>
                      )}

                      <h4 className="font-semibold text-lg text-gray-800 border-b border-gray-200 pb-2">Detailed Analysis</h4>
                      <div className="space-y-4">
                        {msg.analysis?.map(item => (
                          <div key={item.disease} className="p-3 bg-gray-200/50 rounded-lg">
                            <div className="flex justify-between items-center text-sm font-medium">
                              <span className="text-gray-800">{item.disease}</span>
                              <span className={item.score > 60 ? 'text-red-500' : item.score > 30 ? 'text-orange-500' : 'text-green-600'}>{item.score}%</span>
                            </div>
                            <Progress value={item.score} className="h-2 mt-2" />
                            <p className="text-xs text-gray-600 mt-2">{item.highlights}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {msg.sender === 'user' && (
                  <Avatar className="border-2 border-blue-500">
                    <AvatarFallback className="bg-blue-100 text-blue-500">U</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-4">
                <Avatar className="border-2 border-primary">
                  <AvatarFallback className="bg-blue-100 text-primary">AI</AvatarFallback>
                </Avatar>
                <div className="rounded-xl p-4 bg-gray-100">
                  <div className="flex items-center space-x-3">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-gray-800">Analyzing image, please wait...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <CardFooter className="p-4 space-y-4 flex-col items-start">
          <div className="w-full">
            {/* <Input
                type="password"
                placeholder="Enter your Google AI API Key here"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-primary focus:border-primary"
            />
            <p className="text-xs text-gray-500 mt-2">
                Your API key is stored locally for this session. Get one from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Google AI Studio</a>.
            </p> */}
          </div>
          <div className="flex items-center w-full space-x-3">
            <Button variant="outline" className="bg-white border-gray-300 hover:bg-gray-100" onClick={() => fileInputRef.current?.click()}>
              <ImageIcon className="mr-2 h-5 w-5" />
              {selectedFile ? 'Image Ready' : 'Choose Image'}
            </Button>
            <div className="flex-grow p-2 border border-gray-300 rounded-md text-sm text-gray-500 bg-gray-50">
              {selectedFile ? selectedFile.name : 'Select an image for analysis.'}
            </div>
            <Button onClick={handleSend} disabled={!selectedFile || isLoading} className="bg-primary hover:bg-primary/90 text-white font-bold">
              <Send className="mr-2 h-5 w-5" />
              Analyze
            </Button>
          </div>
        </CardFooter>
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
        />
      </Card>
    </div>
  );
};

export default VisualDiagnosis;
