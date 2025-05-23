"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Mic, Send, Lightbulb, FileText, Activity } from "lucide-react";
import { voiceSymptomChecker, type VoiceSymptomCheckerOutput } from "@/ai/flows/voice-symptom-checker";
import { useToast } from "@/hooks/use-toast";

export function SymptomCheckerClient() {
  const [symptoms, setSymptoms] = useState("");
  const [language, setLanguage] = useState("English"); // Default or auto-detect
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<VoiceSymptomCheckerOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim()) {
      setError("Please describe your symptoms.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const output = await voiceSymptomChecker({ symptoms, language });
      setResults(output);
    } catch (err) {
      console.error("Symptom checker AI error:", err);
      setError("An error occurred while analyzing symptoms. Please try again.");
      toast({
        title: "AI Error",
        description: "Could not process symptoms. The AI service might be temporarily unavailable.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleVoiceInput = () => {
    // Placeholder for voice input functionality
    // In a real app, this would use Web Speech API or similar
    toast({
      title: "Voice Input",
      description: "Voice input is not implemented in this demo. Please type your symptoms.",
    });
    // Example: setSymptoms("I have a fever and a cough, and I feel very tired.");
  };


  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <FileText className="h-7 w-7 text-primary" />
            Describe Your Symptoms
          </CardTitle>
          <CardDescription>
            Enter your symptoms in your preferred language. Our AI will analyze them to suggest possible conditions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="symptoms">Your Symptoms</Label>
              <Textarea
                id="symptoms"
                placeholder="e.g., 'I have a headache and a sore throat...'"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={6}
                className="text-base"
                disabled={isLoading}
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="language">Language (Optional)</Label>
              <Input
                id="language"
                placeholder="e.g., English, Spanish, French"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="text-base"
                disabled={isLoading}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <Activity className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
               <Button type="button" variant="outline" onClick={handleVoiceInput} disabled={isLoading} className="flex-1">
                <Mic className="mr-2 h-5 w-5" /> Use Voice (Simulated)
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                <Send className="mr-2 h-5 w-5" />
                {isLoading ? "Analyzing..." : "Check Symptoms"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Lightbulb className="h-7 w-7 text-accent" />
            Potential Insights
          </CardTitle>
          <CardDescription>
            Based on your symptoms, here are some possible conditions. This is not a diagnosis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex flex-col items-center justify-center space-y-3 p-8">
              <Activity className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">AI is thinking...</p>
              <Progress value={50} className="w-full" />
            </div>
          )}
          {!isLoading && !results && !error && (
            <div className="text-center text-muted-foreground p-8">
              <p>Your results will appear here after you submit your symptoms.</p>
            </div>
          )}
          {results && (
            <div className="space-y-6">
              {results.possibleConditions.map((condition, index) => (
                <Card key={index} className="bg-background/50">
                  <CardHeader>
                    <CardTitle className="text-xl">{condition}</CardTitle>
                    <CardDescription>
                      Confidence: {(results.confidenceLevels[index] * 100).toFixed(0)}%
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{results.explanation}</p>
                  </CardContent>
                  <CardFooter>
                     <Progress value={results.confidenceLevels[index] * 100} aria-label={`Confidence for ${condition}`} />
                  </CardFooter>
                </Card>
              ))}
              <Alert variant="default" className="bg-accent/10 border-accent/50">
                <Lightbulb className="h-4 w-4 text-accent" />
                <AlertTitle className="text-accent">Important Disclaimer</AlertTitle>
                <AlertDescription className="text-accent/90">
                  The information provided is for informational purposes only and does not constitute medical advice. Always consult with a qualified healthcare professional for diagnosis and treatment.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Adding Input component used in the form if not globally available (it should be via components/ui/input)
// This is just for completeness if this file were standalone.
// Normally, you'd import { Input } from "@/components/ui/input";

const Input = ({ id, placeholder, value, onChange, className, disabled }: { id: string, placeholder: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, className?: string, disabled?: boolean }) => {
  return (
    <input
      id={id}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      disabled={disabled}
    />
  );
};
