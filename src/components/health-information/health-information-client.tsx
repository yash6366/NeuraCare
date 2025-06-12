
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Mic, Send, Lightbulb, Activity, Languages, Volume2, VolumeX, StopCircle, HelpCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { queryHealthInformation, type HealthInfoQueryInput, type HealthInfoQueryOutput } from "@/ai/flows/health-info-query-flow";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";
import type { LanguageCode } from "@/contexts/language-context";
import { ScrollArea } from "@/components/ui/scroll-area";

interface QueryResponse {
  question: string;
  answer: string;
  disclaimer: string;
  language: LanguageCode;
  timestamp: Date;
}

export function HealthInformationClient() {
  const [userQuery, setUserQuery] = useState("");
  const { language, setLanguage, translate, supportedLanguages } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<QueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [isListening, setIsListening] = useState(false);
  const [autoPlayResponseSpeech, setAutoPlayResponseSpeech] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = language;

      recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
        let transcribedText = event.results[0][0].transcript;
        setUserQuery(transcribedText);
      };
      recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        toast({ title: translate('healthInformation.voiceErrorTitle', 'Voice Input Error'), description: event.error as string, variant: "destructive" });
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
    if (scrollAreaRef.current) {
      const scrollableViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollableViewport) {
        scrollableViewport.scrollTop = scrollableViewport.scrollHeight;
      }
    }
  }, [lastResponse]);

  useEffect(() => {
    if (!autoPlayResponseSpeech && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [autoPlayResponseSpeech]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const loadVoices = () => window.speechSynthesis.getVoices();
      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }, []);

  const playTextAsSpeech = (text: string, lang: LanguageCode) => {
    if (!autoPlayResponseSpeech || typeof window === 'undefined' || !window.speechSynthesis || !text) return;
    
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

  const speakResponse = (response: QueryResponse) => {
    if (!autoPlayResponseSpeech || !response) return;
    let fullTextToSpeak = `${translate('healthInformation.tts.answerPrefix', "The answer to your question about")} '${response.question}' ${translate('healthInformation.tts.is', "is")}: ${response.answer}. `;
    fullTextToSpeak += `${translate('healthInformation.disclaimerTitle', "Important Disclaimer")}: ${response.disclaimer}`;
    playTextAsSpeech(fullTextToSpeak, response.language);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuery.trim()) {
      setError(translate('healthInformation.error.noQuestion', "Please enter your health question."));
      return;
    }
    setIsLoading(true);
    setError(null);
    setLastResponse(null); 
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }

    const inputForFlow: HealthInfoQueryInput = {
      userQuery,
      language: language.split('-')[0] 
    };

    try {
      const output: HealthInfoQueryOutput = await queryHealthInformation(inputForFlow);
      const newResponse: QueryResponse = {
        question: userQuery,
        answer: output.answer,
        disclaimer: output.disclaimer,
        language: language,
        timestamp: new Date(),
      };
      setLastResponse(newResponse);
      if (autoPlayResponseSpeech) {
        speakResponse(newResponse);
      }
    } catch (err: any) {
      console.error("Health information query AI error:", err);
      const specificErrorMessage = err.message ? `Details: ${err.message}` : "Please check the server console for more details.";
      setError(`${translate('healthInformation.error.aiError', "An error occurred while fetching health information.")} ${specificErrorMessage}`);
      toast({
        title: translate('healthInformation.toast.aiErrorTitle', "AI Query Error"),
        description: `${translate('healthInformation.toast.aiErrorDescription', "Could not process your health query. The AI service might be temporarily unavailable.")} ${specificErrorMessage}`,
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
          toast({ title: translate('healthInformation.speakNow', 'Speak now...') });
        } catch (e) {
          console.error("Error starting speech recognition:", e);
          toast({ title: translate('healthInformation.voiceErrorTitle', 'Voice Input Error'), description: (e as Error).message || 'Could not start voice input.', variant: "destructive" });
          setIsListening(false);
        }
      }
    } else {
      toast({ title: translate('healthInformation.voiceNotSupported', 'Voice input not supported by your browser.'), variant: "destructive" });
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-8">
      <Card className="md:col-span-1 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <HelpCircle className="h-6 w-6 text-primary" />
            {translate('healthInformation.askQuestionTitle', "Ask a Health Question")}
          </CardTitle>
          <CardDescription>
            {translate('healthInformation.askQuestionDescription', "Type your health-related question below. Our AI will provide information. This is not medical advice.")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="userQuery">{translate('healthInformation.yourQuestionLabel', "Your Question")}</Label>
              <Textarea
                id="userQuery"
                placeholder={isListening ? translate('healthInformation.listeningPlaceholder', 'Listening...') : translate('healthInformation.queryPlaceholder', "e.g., 'What are common symptoms of flu?'")}
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                rows={5}
                className="text-base"
                disabled={isLoading || isListening}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <Activity className="h-4 w-4" />
                <AlertTitle>{translate('healthInformation.error.title', "Error")}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="flex flex-col sm:flex-row gap-2">
               <Button type="button" variant="outline" onClick={handleVoiceInput} disabled={isLoading} className="flex-1">
                 {isListening ? <StopCircle className="mr-2 h-5 w-5 text-destructive animate-pulse" /> : <Mic className="mr-2 h-5 w-5" />}
                {isListening ? translate('healthInformation.stopListeningButton', 'Stop Listening') : translate('healthInformation.useVoiceButton', "Use Voice")}
              </Button>
              <Button type="submit" disabled={isLoading || isListening || !userQuery.trim()} className="flex-1">
                {isLoading ? <Activity className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
                {isLoading ? translate('healthInformation.gettingInfoButton', "Getting Info...") : translate('healthInformation.getInfoButton', "Get Information")}
              </Button>
            </div>

            <div className="flex items-center space-x-2 pt-2 justify-end">
              <Switch
                id="autoplay-response-speech"
                checked={autoPlayResponseSpeech}
                onCheckedChange={setAutoPlayResponseSpeech}
                aria-label={translate('healthInformation.autoPlayResponseSpeech', 'Auto-play response speech')}
                disabled={isLoading || isListening}
              />
              <Label htmlFor="autoplay-response-speech" className="text-sm text-muted-foreground">
                {translate('healthInformation.autoPlayResponseSpeechLabel', 'Speak Response')}
              </Label>
              {autoPlayResponseSpeech ? <Volume2 className="h-5 w-5 text-primary" /> : <VolumeX className="h-5 w-5 text-muted-foreground" />}
            </div>

          </form>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 shadow-lg flex flex-col min-h-[400px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Lightbulb className="h-6 w-6 text-accent" />
            {translate('healthInformation.aiResponseTitle', "AI Response")}
          </CardTitle>
          <CardDescription>
             {translate('healthInformation.aiResponseDescription', "Information provided by our AI. Always consult a healthcare professional for medical advice.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          {isLoading && (
            <div className="flex flex-col items-center justify-center space-y-3 p-8 h-full">
              <Activity className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground">{translate('healthInformation.aiThinking', "AI is processing your question...")}</p>
            </div>
          )}
          {!isLoading && !lastResponse && !error && (
            <div className="text-center text-muted-foreground p-8 h-full flex items-center justify-center">
              <p>{translate('healthInformation.responseAppearHere', "The AI's response will appear here after you submit a question.")}</p>
            </div>
          )}
          {lastResponse && (
            <ScrollArea className="h-[calc(100%-0px)] pr-3" ref={scrollAreaRef}> {/* Adjust height as needed */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-base mb-1">{translate('healthInformation.yourQuestionWas', "Your Question:")}</h3>
                  <p className="text-muted-foreground italic text-sm bg-muted/30 p-2 rounded-md">"{lastResponse.question}"</p>
                </div>
                <div>
                  <h3 className="font-semibold text-base mb-1">{translate('healthInformation.aiAnswer', "AI's Answer:")}</h3>
                  <div className="prose prose-sm max-w-none p-3 border rounded-md bg-background">
                    <p>{lastResponse.answer}</p>
                  </div>
                </div>
                <Alert variant="default" className="bg-yellow-50 border-yellow-300 text-yellow-700">
                  <Lightbulb className="h-4 w-4 text-yellow-600" />
                  <AlertTitle className="text-yellow-700">{translate('healthInformation.disclaimerTitle', "Important Disclaimer")}</AlertTitle>
                  <AlertDescription className="text-yellow-700/90">
                    {lastResponse.disclaimer}
                  </AlertDescription>
                </Alert>
              </div>
            </ScrollArea>
          )}
        </CardContent>
        {lastResponse && (
            <CardFooter className="text-xs text-muted-foreground pt-3 border-t">
                {translate('healthInformation.responseTimestamp', "Response generated at {timestamp} in {language}.").replace('{timestamp}', new Date(lastResponse.timestamp).toLocaleString()).replace('{language}', lastResponse.language)}
            </CardFooter>
        )}
      </Card>
    </div>
  );
}

    
