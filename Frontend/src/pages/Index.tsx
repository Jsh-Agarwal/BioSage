import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Stethoscope, TrendingUp, Users, Zap, ArrowRight } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/5 to-primary/10">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-6">
            <Brain className="h-16 w-16 text-primary mr-4" />
            <h1 className="text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              BioSage
            </h1>
          </div>
          <h2 className="text-3xl font-semibold mb-6">Agentic Super-Diagnostician</h2>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            AI-powered clinical decision support with multi-specialist agents, evidence-based diagnostics, 
            and complete transparency. Empowering clinicians with speed, clarity, and confidence.
          </p>
          
          <div className="flex items-center justify-center space-x-4 mb-12">
            <Link to="/dashboard">
              <Button size="lg" className="text-lg px-8 py-4">
                Enter Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/onboarding">
              <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                Patient Onboarding
              </Button>
            </Link>
            <Link to="/case/BSG-2024-001">
              <Button variant="secondary" size="lg" className="text-lg px-8 py-4">
                View Live Case
              </Button>
            </Link>
          </div>

          {/* Key Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Stethoscope className="mr-3 h-6 w-6 text-primary" />
                  Multi-Agent Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Six specialist AI agents working in parallel - Infectious Disease, Cardiology, 
                  Neurology, Oncology, Autoimmune, and Toxicology.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-3 h-6 w-6 text-primary" />
                  Evidence-Based
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Complete provenance tracking with knowledge graph exploration, 
                  literature citations, and transparent reasoning chains.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-3 h-6 w-6 text-primary" />
                  Collaborative Platform
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Real-time collaboration rooms, consensus voting, and seamless 
                  integration with clinical workflows and decision-making.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* System Status */}
          <Card className="max-w-2xl mx-auto border-accent/20 bg-accent/5">
            <CardHeader>
              <CardTitle className="flex items-center justify-center">
                <Zap className="mr-2 h-5 w-5 text-success" />
                System Status: All Agents Online
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">94.7%</div>
                  <div className="text-sm text-muted-foreground">Diagnostic Accuracy</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">1.8s</div>
                  <div className="text-sm text-muted-foreground">Avg Response Time</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">2,847</div>
                  <div className="text-sm text-muted-foreground">Cases Analyzed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
