
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Mic, Send, Lightbulb, FileText, Activity, Pill, Leaf, HomeIcon, Volume2, VolumeX, StopCircle, Save } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { voiceSymptomChecker, type VoiceSymptomCheckerOutput } from "@/ai/flows/voice-symptom-checker";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";
import type { LanguageCode } from "@/contexts/language-context";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getCurrentUser, type Patient } from "@/lib/auth";
import { uploadMedicalRecordToDB } from "@/lib/actions/medical.actions";
import { format } from "date-fns";

export function SymptomCheckerClient() {
  const [symptoms, setSymptoms] = useState("");
  const { language, translate } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<VoiceSymptomCheckerOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [isListening, setIsListening] = useState(false);
  const [autoPlayResultsSpeech, setAutoPlayResultsSpeech] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const [currentUser, setCurrentUser] = useState<Patient | null>(null);
  const [isSavingAnalysis, setIsSavingAnalysis] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (user && user.role === 'patient') {
      setCurrentUser(user as Patient);
    }
  }, []);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = language;

      recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
        let transcribedText = event.results[0][0].transcript;
        console.log(translate('symptomChecker.dwaniSTTInfo', "Using browser STT. (Dwani AI STT would be used here for regional languages)"), "Transcribed text:", transcribedText);
        
        if (language !== "en-US") { 
          console.log(translate('symptomChecker.dwaniTranslateInfo', "Conceptual: Dwani AI would translate this to English for core AI processing:"), transcribedText);
        }
        
        setSymptoms(transcribedText);
      };
      recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error", event.error);
        toast({ title: translate('symptomChecker.voiceErrorTitle', 'Voice Input Error'), description: event.error as string, variant: "destructive" });
        setIsListening(false);
      };
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      recognitionRef.current = recognitionInstance;
    } else {
      console.warn("SpeechRecognition API not supported.");
    }

    return () => {
      recognitionRef.current?.abort();
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, toast, translate]);

  useEffect(() => {
    if (!autoPlayResultsSpeech && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [autoPlayResultsSpeech]);

  const playTextAsSpeech = (text: string, lang: LanguageCode) => {
    if (!autoPlayResultsSpeech || typeof window === 'undefined' || !window.speechSynthesis || !text) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    let targetVoice = window.speechSynthesis.getVoices().find(voice => voice.lang === lang);
    if (!targetVoice) {
      targetVoice = window.speechSynthesis.getVoices().find(voice => voice.lang.startsWith(lang.split('-')[0]));
    }
    if (targetVoice) {
      utterance.voice = targetVoice;
    } else {
      utterance.lang = lang;
    }
    
    window.speechSynthesis.cancel(); 
    window.speechSynthesis.speak(utterance);
  };
  
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const loadVoices = () => {
        window.speechSynthesis.getVoices();
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const speakResults = (analysisResults: VoiceSymptomCheckerOutput) => {
    if (!autoPlayResultsSpeech || !analysisResults) return;

    let fullTextToSpeak = "";

    if (analysisResults.analysis && analysisResults.analysis.length > 0) {
      fullTextToSpeak += translate('symptomChecker.tts.analysisIntro', "Based on your symptoms, here are some potential insights: ");
      analysisResults.analysis.forEach(item => {
        fullTextToSpeak += `${item.conditionName}. ${translate('symptomChecker.tts.confidence', "Confidence")}: ${(item.confidence * 100).toFixed(0)}%. ${item.explanation}. `;
        if (item.allopathicSuggestions && item.allopathicSuggestions.length > 0) {
          fullTextToSpeak += `${translate('symptomChecker.allopathicSuggestionsLabel', "Allopathic Suggestions")}: ${item.allopathicSuggestions.join(', ')}. `;
        }
        if (item.ayurvedicSuggestions && item.ayurvedicSuggestions.length > 0) {
          fullTextToSpeak += `${translate('symptomChecker.ayurvedicSuggestionsLabel', "Ayurvedic Suggestions")}: ${item.ayurvedicSuggestions.join(', ')}. `;
        }
        if (item.homeRemedies && item.homeRemedies.length > 0) {
          fullTextToSpeak += `${translate('symptomChecker.homeRemediesLabel', "Home Remedies")}: ${item.homeRemedies.join(', ')}. `;
        }
      });
    } else {
        fullTextToSpeak += translate('symptomChecker.tts.noSpecificConditions', "No specific conditions were identified, or I couldn't process the request. ");
    }

    if (analysisResults.disclaimer) {
      fullTextToSpeak += `${translate('symptomChecker.disclaimerTitle', "Important Disclaimer")}: ${analysisResults.disclaimer}`;
    }
    
    playTextAsSpeech(fullTextToSpeak, language);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim()) {
      setError(translate('symptomChecker.error.noSymptoms', "Please describe your symptoms."));
      return;
    }
    setIsLoading(true);
    setError(null);
    setResults(null);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }

    try {
      const output = await voiceSymptomChecker({ symptoms, language: language.split('-')[0] });
      setResults(output);
      if (output && autoPlayResultsSpeech) {
        speakResults(output);
      }
    } catch (err: any) {
      console.error("Symptom checker AI error:", err);
      const specificErrorMessage = err.message ? `Details: ${err.message}` : "Please check the server console for more details.";
      setError(`${translate('symptomChecker.error.aiError', "An error occurred while analyzing symptoms. Please try again.")} ${specificErrorMessage}`);
      toast({
        title: translate('symptomChecker.toast.aiErrorTitle', "AI Error"),
        description: `${translate('symptomChecker.toast.aiErrorDescription', "Could not process symptoms. The AI service might be temporarily unavailable.")} ${specificErrorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleVoiceInput = () => {
    if (recognitionRef.current) {
      if (isListening) {
        recognitionRef.current.stop();
      } else {
        try {
          recognitionRef.current.lang = language; 
          recognitionRef.current.start();
          setIsListening(true);
          toast({ title: translate('symptomChecker.speakNow', 'Speak now...') });
        } catch (e) {
          console.error("Error starting speech recognition:", e);
          toast({ title: translate('symptomChecker.voiceErrorTitle', 'Voice Input Error'), description: (e as Error).message || 'Could not start voice input.', variant: "destructive" });
          setIsListening(false);
        }
      }
    } else {
      toast({ title: translate('symptomChecker.voiceNotSupported', 'Voice input not supported by your browser.'), variant: "destructive" });
    }
  };

  const handleSaveAnalysis = async () => {
    if (!results || !currentUser || currentUser.role !== 'patient') {
      toast({
        title: translate('symptomChecker.saveError.title', "Cannot Save Analysis"),
        description: translate('symptomChecker.saveError.noResultsOrNotPatient', "No analysis to save, or user is not a patient."),
        variant: "destructive",
      });
      return;
    }

    setIsSavingAnalysis(true);

    let analysisText = `${translate('symptomChecker.savedReport.title', "Symptom Check Analysis")}\n`;
    analysisText += `${translate('symptomChecker.savedReport.date', "Date")}: ${format(new Date(), "PPP p")}\n`;
    analysisText += `${translate('symptomChecker.savedReport.language', "Language of Analysis")}: ${language}\n\n`;
    analysisText += `${translate('symptomChecker.savedReport.symptomsTitle', "Reported Symptoms:")}\n`;
    analysisText += "--------------------\n";
    analysisText += `${symptoms}\n\n`;
    analysisText += `${translate('symptomChecker.savedReport.insightsTitle', "Potential Insights:")}\n`;
    analysisText += "--------------------\n";

    if (results.analysis && results.analysis.length > 0) {
      results.analysis.forEach(item => {
        analysisText += `${translate('symptomChecker.savedReport.condition', "Condition")}: ${item.conditionName} (${translate('symptomChecker.savedReport.confidence', "Confidence")}: ${(item.confidence * 100).toFixed(0)}%)\n`;
        analysisText += `${translate('symptomChecker.savedReport.explanation', "Explanation")}: ${item.explanation}\n`;
        if (item.allopathicSuggestions && item.allopathicSuggestions.length > 0) {
          analysisText += `${translate('symptomChecker.allopathicSuggestionsLabel', "Allopathic Suggestions")}:\n${item.allopathicSuggestions.map(s => `- ${s}`).join("\n")}\n`;
        }
        if (item.ayurvedicSuggestions && item.ayurvedicSuggestions.length > 0) {
          analysisText += `${translate('symptomChecker.ayurvedicSuggestionsLabel', "Ayurvedic Suggestions")}:\n${item.ayurvedicSuggestions.map(s => `- ${s}`).join("\n")}\n`;
        }
        if (item.homeRemedies && item.homeRemedies.length > 0) {
          analysisText += `${translate('symptomChecker.homeRemediesLabel', "Home Remedies")}:\n${item.homeRemedies.map(s => `- ${s}`).join("\n")}\n`;
        }
        analysisText += "--------------------\n";
      });
    } else {
      analysisText += `${translate('symptomChecker.noConditionsFound', "No specific conditions identified based on the symptoms provided, or the AI could not process the request.")}\n`;
      analysisText += "--------------------\n";
    }

    analysisText += `\n${translate('symptomChecker.disclaimerTitle', "Important Disclaimer")}:\n${results.disclaimer}`;

    const fileName = `${translate('symptomChecker.savedReport.fileNamePrefix', "Symptom Analysis")} - ${format(new Date(), 'yyyy-MM-dd HHmm')}.txt`;
    
    // Encode URI components and then unescape to handle UTF-8 characters for btoa
    const base64EncodedText = btoa(unescape(encodeURIComponent(analysisText)));
    const dataUri = `data:text/plain;base64,${base64EncodedText}`;
    const fileSize = new TextEncoder().encode(analysisText).length;

    const uploadResult = await uploadMedicalRecordToDB(
      currentUser.id,
      fileName,
      'text/plain',
      fileSize,
      dataUri
    );

    if (uploadResult.success) {
      toast({
        title: translate('symptomChecker.saveSuccess.title', "Analysis Saved"),
        description: translate('symptomChecker.saveSuccess.description', "Your symptom analysis has been saved to your medical records."),
      });
    } else {
      toast({
        title: translate('symptomChecker.saveError.title', "Save Failed"),
        description: uploadResult.message || translate('symptomChecker.saveError.general', "Could not save the analysis."),
        variant: "destructive",
      });
    }
    setIsSavingAnalysis(false);
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
                placeholder={isListening ? translate('symptomChecker.listening', 'Listening...') : translate('symptomChecker.symptomsPlaceholder', "e.g., 'I have a headache and a sore throat...'")}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={6}
                className="text-base"
                disabled={isLoading || isListening}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <Activity className="h-4 w-4" />
                <AlertTitle>{translate('symptomChecker.error.title', "Error")}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
               <Button type="button" variant="outline" onClick={handleVoiceInput} disabled={isLoading} className="flex-1">
                 {isListening ? <StopCircle className="mr-2 h-5 w-5 text-destructive animate-pulse" /> : <Mic className="mr-2 h-5 w-5" />}
                {isListening ? translate('symptomChecker.stopListening', 'Stop Listening') : translate('symptomChecker.useVoiceButton', "Use Voice")}
              </Button>
              <Button type="submit" disabled={isLoading || isListening || !symptoms.trim()} className="flex-1">
                {isLoading ? <Activity className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
                {isLoading ? translate('symptomChecker.analyzingButton', "Analyzing...") : translate('symptomChecker.checkSymptomsButton', "Check Symptoms")}
              </Button>
            </div>
             <div className="flex items-center space-x-2 pt-2 justify-end">
              <Switch
                id="autoplay-results-speech"
                checked={autoPlayResultsSpeech}
                onCheckedChange={setAutoPlayResultsSpeech}
                aria-label={translate('symptomChecker.autoPlayResultsSpeech', 'Auto-play results speech')}
                disabled={isLoading || isListening}
              />
              <Label htmlFor="autoplay-results-speech" className="text-sm text-muted-foreground">
                {translate('symptomChecker.autoPlayResultsSpeechLabel', 'Speak Results')}
              </Label>
              {autoPlayResultsSpeech ? <Volume2 className="h-5 w-5 text-primary" /> : <VolumeX className="h-5 w-5 text-muted-foreground" />}
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
              <Progress value={50} className="w-full" />
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
                    
                    <Accordion type="single" collapsible className="w-full" defaultValue="allopathic">
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
              {currentUser && currentUser.role === 'patient' && results && (
                <div className="pt-4 text-center">
                    <Button 
                        onClick={handleSaveAnalysis} 
                        disabled={isSavingAnalysis || isLoading}
                        variant="default"
                        size="lg"
                    >
                        <Save className="mr-2 h-5 w-5" />
                        {isSavingAnalysis 
                            ? translate('symptomChecker.savingAnalysisButton', "Saving Analysis...") 
                            : translate('symptomChecker.saveAnalysisButton', "Save Analysis to Medical Records")
                        }
                    </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

