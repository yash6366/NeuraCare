
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Mic, Send, Lightbulb, FileText, Activity, Pill, Leaf, HomeIcon } from "lucide-react"; // Added Pill, Leaf, HomeIcon
import { voiceSymptomChecker, type VoiceSymptomCheckerOutput } from "@/ai/flows/voice-symptom-checker";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context"; // For language selection
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"; // For suggestions

export function SymptomCheckerClient() {
  const [symptoms, setSymptoms] = useState("");
  const { language, translate } = useLanguage(); // Using global language context
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<VoiceSymptomCheckerOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim()) {
      setError(translate('symptomChecker.error.noSymptoms', "Please describe your symptoms."));
      return;
    }
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      // Pass the globally selected language to the AI flow
      const output = await voiceSymptomChecker({ symptoms, language: language.split('-')[0] }); // Pass base language e.g. 'en'
      setResults(output);
    } catch (err) {
      console.error("Symptom checker AI error:", err);
      setError(translate('symptomChecker.error.aiError', "An error occurred while analyzing symptoms. Please try again."));
      toast({
        title: translate('symptomChecker.toast.aiErrorTitle', "AI Error"),
        description: translate('symptomChecker.toast.aiErrorDescription', "Could not process symptoms. The AI service might be temporarily unavailable."),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleVoiceInput = () => {
    toast({
      title: translate('symptomChecker.toast.voiceInputTitle', "Voice Input"),
      description: translate('symptomChecker.toast.voiceInputDescription', "Voice input is simulated for symptom checker. Please type your symptoms for now."),
    });
    // Example: setSymptoms("I have a fever and a cough, and I feel very tired.");
  };


  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <FileText className="h-7 w-7 text-primary" />
            {translate('symptomChecker.describeSymptomsTitle', "Describe Your Symptoms")}
          </CardTitle>
          <CardDescription>
            {translate('symptomChecker.describeSymptomsDescription', "Enter your symptoms in your preferred language. Our AI will analyze them to suggest possible conditions and remedies.")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="symptoms">{translate('symptomChecker.symptomsLabel', "Your Symptoms")}</Label>
              <Textarea
                id="symptoms"
                placeholder={translate('symptomChecker.symptomsPlaceholder', "e.g., 'I have a headache and a sore throat...'")}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={6}
                className="text-base"
                disabled={isLoading}
              />
            </div>
            {/* Language selection is now global, no need for a local input here */}
            {error && (
              <Alert variant="destructive">
                <Activity className="h-4 w-4" />
                <AlertTitle>{translate('symptomChecker.error.title', "Error")}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
               <Button type="button" variant="outline" onClick={handleVoiceInput} disabled={isLoading} className="flex-1">
                <Mic className="mr-2 h-5 w-5" /> {translate('symptomChecker.useVoiceButton', "Use Voice (Simulated)")}
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                <Send className="mr-2 h-5 w-5" />
                {isLoading ? translate('symptomChecker.analyzingButton', "Analyzing...") : translate('symptomChecker.checkSymptomsButton', "Check Symptoms")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Lightbulb className="h-7 w-7 text-accent" />
            {translate('symptomChecker.potentialInsightsTitle', "Potential Insights")}
          </CardTitle>
          <CardDescription>
             {translate('symptomChecker.potentialInsightsDescription', "Based on your symptoms, here are some possibilities. This is not a diagnosis.")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex flex-col items-center justify-center space-y-3 p-8">
              <Activity className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">{translate('symptomChecker.aiThinking', "AI is thinking...")}</p>
              <Progress value={50} className="w-full" /> {/* Consider making progress dynamic if possible */}
            </div>
          )}
          {!isLoading && !results && !error && (
            <div className="text-center text-muted-foreground p-8">
              <p>{translate('symptomChecker.resultsAppearHere', "Your results will appear here after you submit your symptoms.")}</p>
            </div>
          )}
          {results && (
            <div className="space-y-6">
              {results.analysis?.length > 0 ? results.analysis.map((item, index) => (
                <Card key={index} className="bg-background/50">
                  <CardHeader>
                    <CardTitle className="text-xl">{item.conditionName}</CardTitle>
                    <CardDescription>
                      {translate('symptomChecker.confidenceLabel', "Confidence")}: {(item.confidence * 100).toFixed(0)}%
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm"><strong className="font-medium">{translate('symptomChecker.explanationLabel', "Explanation:")}</strong> {item.explanation}</p>
                    
                    <Accordion type="single" collapsible className="w-full">
                      {item.allopathicSuggestions && item.allopathicSuggestions.length > 0 && (
                        <AccordionItem value={`allopathic-${index}`}>
                          <AccordionTrigger className="text-base hover:no-underline">
                            <div className="flex items-center gap-2">
                                <Pill className="h-5 w-5 text-blue-600" />
                                {translate('symptomChecker.allopathicSuggestionsLabel', "Allopathic Suggestions")}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                              {item.allopathicSuggestions.map((sug, i) => <li key={`allo-${i}`}>{sug}</li>)}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      )}

                      {item.ayurvedicSuggestions && item.ayurvedicSuggestions.length > 0 && (
                        <AccordionItem value={`ayurvedic-${index}`}>
                           <AccordionTrigger className="text-base hover:no-underline">
                             <div className="flex items-center gap-2">
                                <Leaf className="h-5 w-5 text-green-600" />
                                {translate('symptomChecker.ayurvedicSuggestionsLabel', "Ayurvedic Suggestions")}
                             </div>
                           </AccordionTrigger>
                          <AccordionContent>
                            <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                              {item.ayurvedicSuggestions.map((sug, i) => <li key={`ayur-${i}`}>{sug}</li>)}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      )}

                      {item.homeRemedies && item.homeRemedies.length > 0 && (
                         <AccordionItem value={`home-${index}`}>
                           <AccordionTrigger className="text-base hover:no-underline">
                             <div className="flex items-center gap-2">
                                <HomeIcon className="h-5 w-5 text-orange-600" />
                                {translate('symptomChecker.homeRemediesLabel', "Home Remedies")}
                             </div>
                           </AccordionTrigger>
                          <AccordionContent>
                            <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                              {item.homeRemedies.map((sug, i) => <li key={`home-${i}`}>{sug}</li>)}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      )}
                    </Accordion>
                  </CardContent>
                  <CardFooter>
                     <Progress value={item.confidence * 100} aria-label={`${translate('symptomChecker.confidenceFor', "Confidence for")} ${item.conditionName}`} />
                  </CardFooter>
                </Card>
              )) : (
                 <p className="text-muted-foreground text-center py-4">
                  {translate('symptomChecker.noConditionsFound', "No specific conditions identified based on the symptoms provided, or the AI could not process the request.")}
                </p>
              )}

              {results.disclaimer && (
                <Alert variant="default" className="bg-accent/10 border-accent/50 mt-6">
                  <Lightbulb className="h-4 w-4 text-accent" />
                  <AlertTitle className="text-accent">{translate('symptomChecker.disclaimerTitle', "Important Disclaimer")}</AlertTitle>
                  <AlertDescription className="text-accent/90">
                    {results.disclaimer}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
