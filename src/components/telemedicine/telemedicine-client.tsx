
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Video, Phone, Send, Bot, Mic, Volume2, VolumeX, Activity } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { telemedicineChat, type TelemedicineChatInput, type TelemedicineChatOutput } from "@/ai/flows/telemedicine-chat-flow";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

interface GenkitChatMessage {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

// Placeholder for Dwani AI supported languages - replace with actual list
const supportedLanguages = [
  { value: "en-US", label: "English (US)" },
  { value: "es-ES", label: "Español (España)" },
  { value: "fr-FR", label: "Français (France)" },
  { value: "de-DE", label: "Deutsch (Deutschland)" },
  { value: "hi-IN", label: "हिन्दी (भारत)" },
  { value: "ja-JP", label: "日本語 (日本)" },
];

// Simple translations for demo purposes
const uiTranslations: Record<string, Record<string, string>> = {
  "en-US": {
    chatPlaceholder: "Type your message...",
    sendButton: "Send",
    listening: "Listening...",
    speakNow: "Speak now...",
    voiceError: "Voice input error. Please try again or type your message.",
    voiceNotSupported: "Voice input not supported by your browser.",
    autoPlaySpeech: "Auto-play AI speech",
    language: "Language",
    aiAssistantTitle: "AI Chat Assistant",
    aiAssistantDescription: "Get quick answers to your health queries.",
    virtualConsultationTitle: "Virtual Consultation",
    virtualConsultationDescription: "Connect with doctors via video or audio call."
  },
  "es-ES": {
    chatPlaceholder: "Escribe tu mensaje...",
    sendButton: "Enviar",
    listening: "Escuchando...",
    speakNow: "Hable ahora...",
    voiceError: "Error de entrada de voz. Inténtalo de nuevo o escribe tu mensaje.",
    voiceNotSupported: "Entrada de voz no compatible con tu navegador.",
    autoPlaySpeech: "Reproducir voz IA automáticamente",
    language: "Idioma",
    aiAssistantTitle: "Asistente de Chat IA",
    aiAssistantDescription: "Obtenga respuestas rápidas a sus consultas de salud.",
    virtualConsultationTitle: "Consulta Virtual",
    virtualConsultationDescription: "Conéctese con médicos mediante videollamada o llamada de audio."
  },
  // Add more languages as needed
};


export function TelemedicineClient() {
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isConsultationActive, setIsConsultationActive] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const { toast } = useToast();

  const [selectedLanguage, setSelectedLanguage] = useState("en-US");
  const [isListening, setIsListening] = useState(false);
  const [autoPlayBotSpeech, setAutoPlayBotSpeech] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const currentTranslations = uiTranslations[selectedLanguage] || uiTranslations["en-US"];

  useEffect(() => {
    setChatMessages([
      {
        id: String(Date.now()),
        text: selectedLanguage === "es-ES" ? "¡Hola! Soy el Asistente IA de SmartCare. ¿Cómo puedo ayudarte hoy?" : "Hello! I'm SmartCare AI Assistant. How can I help you today?",
        sender: "bot",
        timestamp: new Date(),
      },
    ]);
  }, [selectedLanguage]);
  
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = selectedLanguage;

      recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setChatInput(transcript);
        setIsListening(false);
        // Automatically send if desired, or let user press send
        // handleSendMessage(transcript); 
      };
      recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error", event.error);
        toast({ title: "Voice Error", description: currentTranslations.voiceError, variant: "destructive" });
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
    };
  }, [selectedLanguage, toast, currentTranslations]);

  const playTextAsSpeech = (text: string, lang: string) => {
    if (!autoPlayBotSpeech || typeof window === 'undefined' || !window.speechSynthesis) return;

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Attempt to find a voice that matches the language
    const voices = window.speechSynthesis.getVoices();
    const targetVoice = voices.find(voice => voice.lang.startsWith(lang.split('-')[0])); // Match base language e.g. 'en' for 'en-US'
    
    if (targetVoice) {
      utterance.voice = targetVoice;
    } else {
       // Fallback to browser default for the language if specific voice not found
       utterance.lang = lang;
    }

    window.speechSynthesis.cancel(); // Cancel any ongoing speech
    window.speechSynthesis.speak(utterance);
  };
  
  // Preload voices - this is a bit of a hack, voices might not be ready immediately
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices(); // Request voices to be loaded
    }
  }, []);


  const handleSendMessage = async (messageToSend?: string) => {
    const currentMessage = typeof messageToSend === 'string' ? messageToSend : chatInput;
    if (!currentMessage.trim()) return;
    setIsChatLoading(true);

    const newUserMessage: Message = {
      id: String(Date.now()),
      text: currentMessage,
      sender: "user",
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, newUserMessage]);
    if (typeof messageToSend !== 'string') {
      setChatInput(""); 
    }

    const historyForGenkit: GenkitChatMessage[] = chatMessages.map(msg => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    }));
    
    const inputForFlow: TelemedicineChatInput = {
      userMessage: currentMessage,
      chatHistory: historyForGenkit,
      language: selectedLanguage.split('-')[0], // Send base language e.g. 'en'
    };

    try {
      const aiResponse: TelemedicineChatOutput = await telemedicineChat(inputForFlow);
      const newBotMessage: Message = {
        id: String(Date.now() + 1),
        text: aiResponse.botResponse,
        sender: "bot",
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, newBotMessage]);
      if (autoPlayBotSpeech) {
        playTextAsSpeech(aiResponse.botResponse, selectedLanguage);
      }
    } catch (error) {
      console.error("Error calling telemedicine chat flow:", error);
      const errorText = selectedLanguage === 'es-ES' ? "Lo siento, no pude conectarme al asistente de IA en este momento. Por favor, inténtalo de nuevo más tarde." : "Sorry, I couldn't connect to the AI assistant right now. Please try again later.";
      toast({
        title: "AI Chat Error",
        description: errorText,
        variant: "destructive",
      });
       const errorBotMessage: Message = {
        id: String(Date.now() + 1),
        text: errorText,
        sender: "bot",
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, errorBotMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const startConsultation = (type: "video" | "audio") => {
    setIsConsultationActive(true);
    toast({
      title: `${type === "video" ? "Video" : "Audio"} Consultation Started`,
      description: "Connecting you to a healthcare professional... (Simulated)",
    });
  };

  const endConsultation = () => {
    setIsConsultationActive(false);
    toast({
      title: "Consultation Ended",
      description: "Your consultation has ended.",
    });
  };

  const handleVoiceInput = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = selectedLanguage; // Update language before starting
        recognitionRef.current.start();
        setIsListening(true);
        toast({ title: currentTranslations.speakNow });
      } catch (e) {
         console.error("Error starting speech recognition:", e);
         toast({ title: "Voice Error", description: currentTranslations.voiceError, variant: "destructive" });
         setIsListening(false);
      }
    } else {
      toast({ title: "Voice Not Supported", description: currentTranslations.voiceNotSupported, variant: "destructive" });
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-2 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">{currentTranslations.virtualConsultationTitle}</CardTitle>
          <CardDescription>{currentTranslations.virtualConsultationDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          {isConsultationActive ? (
            <div className="space-y-4">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <Image 
                  src="https://placehold.co/600x338.png" 
                  alt="Video consultation placeholder" 
                  width={600} 
                  height={338} 
                  className="rounded-lg object-cover"
                  data-ai-hint="video call doctor" 
                />
              </div>
              <div className="flex justify-center gap-4">
                <Button variant="destructive" onClick={endConsultation}>
                  <Phone className="mr-2 h-5 w-5" /> End Call
                </Button>
              </div>
              <p className="text-center text-muted-foreground">You are currently in a simulated consultation.</p>
            </div>
          ) : (
            <div className="space-y-4 text-center py-8">
              <p className="text-lg text-muted-foreground mb-6">Ready to start your consultation?</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button size="lg" onClick={() => startConsultation("video")} className="flex-1">
                  <Video className="mr-2 h-6 w-6" /> Start Video Call
                </Button>
                <Button size="lg" variant="outline" onClick={() => startConsultation("audio")} className="flex-1">
                  <Phone className="mr-2 h-6 w-6" /> Start Audio Call
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-1 shadow-lg flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Bot className="h-7 w-7 text-primary" /> {currentTranslations.aiAssistantTitle}
          </CardTitle>
          <CardDescription>{currentTranslations.aiAssistantDescription}</CardDescription>
           <div className="pt-2 space-y-2">
            <div>
              <Label htmlFor="language-select">{currentTranslations.language}</Label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger id="language-select">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {supportedLanguages.map(lang => (
                    <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground pt-1">Note: Voice support varies by browser & OS for selected language.</p>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="autoplay-speech"
                checked={autoPlayBotSpeech}
                onCheckedChange={setAutoPlayBotSpeech}
              />
              <Label htmlFor="autoplay-speech" className="text-sm">{currentTranslations.autoPlaySpeech}</Label>
              {autoPlayBotSpeech ? <Volume2 className="h-5 w-5 text-primary" /> : <VolumeX className="h-5 w-5 text-muted-foreground" />}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col p-0">
          <ScrollArea className="h-72 flex-grow p-4">
            <div className="space-y-4">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.sender === "bot" && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="https://placehold.co/40x40.png" alt="Bot Avatar" data-ai-hint="robot face" />
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[75%] rounded-lg px-3 py-2 text-sm shadow-md ${
                      msg.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {msg.text}
                  </div>
                  {msg.sender === "user" && (
                     <Avatar className="h-8 w-8">
                       <AvatarImage src="https://placehold.co/40x40.png" alt="User Avatar" data-ai-hint="user silhouette" />
                       <AvatarFallback>U</AvatarFallback>
                     </Avatar>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                placeholder={isListening ? currentTranslations.listening : currentTranslations.chatPlaceholder}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isChatLoading && handleSendMessage()}
                disabled={isChatLoading || isListening}
              />
              <Button onClick={handleVoiceInput} size="icon" variant="outline" aria-label="Use microphone" disabled={isListening || isChatLoading}>
                <Mic className={`h-5 w-5 ${isListening ? 'text-destructive animate-pulse' : ''}`} />
              </Button>
              <Button onClick={() => handleSendMessage()} size="icon" aria-label={currentTranslations.sendButton} disabled={isChatLoading || isListening}>
                {isChatLoading ? <Activity className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
