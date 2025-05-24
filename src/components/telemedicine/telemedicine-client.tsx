
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Video, Phone, Send, Bot, Mic, Volume2, VolumeX, Activity, Users, UserCircle, ChevronDown, Stethoscope } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { telemedicineChat, type TelemedicineChatInput, type TelemedicineChatOutput } from "@/ai/flows/telemedicine-chat-flow";
import { useLanguage } from "@/contexts/language-context";
import type { LanguageCode } from "@/contexts/language-context";
import { getAllUsers } from "@/lib/actions/admin.actions"; // To get doctors
import type { Doctor as DoctorType, AppUser } from "@/types"; // Use Doctor type

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

export function TelemedicineClient() {
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isConsultationActive, setIsConsultationActive] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const { toast } = useToast();

  const { language, translate, supportedLanguages } = useLanguage();

  const [isListening, setIsListening] = useState(false);
  const [autoPlayBotSpeech, setAutoPlayBotSpeech] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const [availableDoctors, setAvailableDoctors] = useState<DoctorType[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorType | null>(null);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);
  const [currentConsultationDoctor, setCurrentConsultationDoctor] = useState<DoctorType | null>(null);


  useEffect(() => {
    const initialBotMessageText = translate('telemedicine.aiAssistantInitialGreeting');
    const initialBotMessage: Message = {
      id: String(Date.now()),
      text: initialBotMessageText,
      sender: "bot",
      timestamp: new Date(),
    };
    setChatMessages([initialBotMessage]);
    if (autoPlayBotSpeech) {
      playTextAsSpeech(initialBotMessageText, language);
    }

    const fetchDoctors = async () => {
      setIsLoadingDoctors(true);
      try {
        const users = await getAllUsers();
        if (users) {
          const doctors = users.filter(user => user.role === 'doctor') as DoctorType[];
          setAvailableDoctors(doctors);
        } else {
          setAvailableDoctors([]);
        }
      } catch (error) {
        console.error("Error fetching doctors:", error);
        setAvailableDoctors([]);
        toast({ title: translate('telemedicine.errorFetchingDoctors'), variant: "destructive" });
      } finally {
        setIsLoadingDoctors(false);
      }
    };
    fetchDoctors();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, translate]); // Depends on global language and translate function

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = language;

      recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
        let transcribedText = event.results[0][0].transcript;
        console.log(translate('telemedicine.dwaniSTTInfo'), "Transcribed text:", transcribedText);
        if (language !== "en-US") {
          console.log(translate('telemedicine.dwaniTranslateInfo'), "Original (regional):", transcribedText);
        }
        setChatInput(transcribedText);
        setIsListening(false);
        handleSendMessage(transcribedText);
      };
      recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error", event.error);
        toast({ title: translate('telemedicine.voiceError'), description: event.error as string, variant: "destructive" });
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
      window.speechSynthesis?.cancel();
    };
  }, [language, toast, translate]);

  const playTextAsSpeech = (text: string, lang: LanguageCode) => {
    if (!autoPlayBotSpeech || typeof window === 'undefined' || !window.speechSynthesis) return;
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
      window.speechSynthesis.onvoiceschanged = () => {
        // Voices loaded
      };
    }
  }, []);

  const handleSendMessage = async (messageContent?: string) => {
    const currentMessage = typeof messageContent === 'string' ? messageContent : chatInput;
    if (!currentMessage.trim()) return;
    setIsChatLoading(true);

    const newUserMessage: Message = {
      id: String(Date.now()),
      text: currentMessage,
      sender: "user",
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, newUserMessage]);
    if (typeof messageContent !== 'string') {
      setChatInput("");
    }

    let textForAI = currentMessage;
    if (language !== "en-US") {
      console.log(translate('telemedicine.dwaniTranslateInfo'), "Original (regional) for AI:", currentMessage);
    }

    const historyForGenkit: GenkitChatMessage[] = chatMessages.map(msg => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    }));

    const inputForFlow: TelemedicineChatInput = {
      userMessage: textForAI,
      chatHistory: historyForGenkit,
      language: language.split('-')[0],
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
        playTextAsSpeech(aiResponse.botResponse, language);
      }
    } catch (error) {
      console.error("Error calling telemedicine chat flow:", error);
      const errorText = translate('telemedicine.aiChatError', "Sorry, I couldn't connect to the AI assistant right now. Please try again later.");
      toast({
        title: translate('telemedicine.aiChatErrorTitle', "AI Chat Error"),
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
    if (!selectedDoctor) {
      toast({ title: translate('telemedicine.selectDoctorFirst'), variant: "destructive" });
      return;
    }
    setCurrentConsultationDoctor(selectedDoctor);
    setIsConsultationActive(true);
    toast({
      title: `${type === "video" ? translate('telemedicine.videoConsultationStarted') : translate('telemedicine.audioConsultationStarted')}`,
      description: `${translate('telemedicine.connectingWith')} Dr. ${selectedDoctor.name}...`,
    });
  };

  const endConsultation = () => {
    setIsConsultationActive(false);
    setCurrentConsultationDoctor(null);
    toast({
      title: translate('telemedicine.consultationEndedTitle'),
      description: translate('telemedicine.consultationEndedDescription'),
    });
  };

  const handleVoiceInput = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = language;
        recognitionRef.current.start();
        setIsListening(true);
        toast({ title: translate('telemedicine.speakNow') });
      } catch (e) {
        console.error("Error starting speech recognition:", e);
        toast({ title: translate('telemedicine.voiceError'), description: (e as Error).message || translate('telemedicine.voiceError'), variant: "destructive" });
        setIsListening(false);
      }
    } else {
      toast({ title: translate('telemedicine.voiceNotSupported'), variant: "destructive" });
    }
  };

  const handleDoctorSelection = (doctorId: string) => {
    const doctor = availableDoctors.find(d => d.id === doctorId);
    setSelectedDoctor(doctor || null);
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-2 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" /> {translate('telemedicine.verbalConsultationTitle')}
          </CardTitle>
          <CardDescription>{translate('telemedicine.verbalConsultationDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isConsultationActive && currentConsultationDoctor ? (
            <div className="space-y-4">
              <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center p-4">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={`https://placehold.co/100x100.png?text=${currentConsultationDoctor.name.charAt(0)}`} alt={currentConsultationDoctor.name} data-ai-hint="doctor professional" />
                  <AvatarFallback>{currentConsultationDoctor.name.substring(0,2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <p className="font-semibold text-lg">{translate('telemedicine.inConsultationWith')} Dr. {currentConsultationDoctor.name}</p>
                <p className="text-sm text-muted-foreground">{currentConsultationDoctor.specialty}</p>
                 <Image 
                  src="https://placehold.co/300x150.png" // Smaller placeholder as main view is avatar
                  alt="Verbal consultation placeholder" 
                  width={300} 
                  height={150} 
                  className="rounded-lg object-cover mt-4"
                  data-ai-hint="audio waves" 
                />
              </div>
              <div className="flex justify-center gap-4">
                <Button variant="destructive" onClick={endConsultation}>
                  <Phone className="mr-2 h-5 w-5" /> {translate('telemedicine.endCallButton')}
                </Button>
              </div>
              <p className="text-center text-muted-foreground">{translate('telemedicine.simulatedConsultationNotice')}</p>
            </div>
          ) : (
            <div className="space-y-6 text-center py-8">
              <p className="text-lg text-muted-foreground mb-4">{translate('telemedicine.readyToConnect')}</p>
              
              {isLoadingDoctors ? (
                <Skeleton className="h-10 w-full max-w-sm mx-auto" />
              ) : availableDoctors.length > 0 ? (
                <div className="max-w-sm mx-auto space-y-2">
                  <Label htmlFor="doctor-select" className="sr-only">{translate('telemedicine.selectDoctorLabel')}</Label>
                  <Select onValueChange={handleDoctorSelection} value={selectedDoctor?.id || ""}>
                    <SelectTrigger id="doctor-select" className="w-full">
                      <SelectValue placeholder={
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <UserCircle className="h-5 w-5" />
                            {translate('telemedicine.selectDoctorPlaceholder')}
                          </div>
                        } />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDoctors.map(doc => (
                        <SelectItem key={doc.id} value={doc.id}>
                          <div className="flex items-center gap-2">
                            <Stethoscope className="h-4 w-4 text-primary" />
                            Dr. {doc.name} ({doc.specialty || 'General'})
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <p className="text-muted-foreground">{translate('telemedicine.noDoctorsAvailable')}</p>
              )}

              <div className="flex flex-col sm:flex-row justify-center gap-4 mt-4">
                <Button size="lg" onClick={() => startConsultation("audio")} className="flex-1" disabled={!selectedDoctor || isLoadingDoctors}>
                  <Phone className="mr-2 h-6 w-6" /> {translate('telemedicine.startAudioCall')}
                </Button>
                <Button size="lg" variant="outline" onClick={() => startConsultation("video")} className="flex-1" disabled={!selectedDoctor || isLoadingDoctors}>
                  <Video className="mr-2 h-6 w-6" /> {translate('telemedicine.startVideoCall')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-1 shadow-lg flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Bot className="h-7 w-7 text-primary" /> {translate('telemedicine.aiAssistantTitle')}
          </CardTitle>
          <CardDescription>{translate('telemedicine.aiAssistantDescription')}</CardDescription>
          <div className="pt-2 space-y-2">
            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="autoplay-speech"
                checked={autoPlayBotSpeech}
                onCheckedChange={setAutoPlayBotSpeech}
              />
              <Label htmlFor="autoplay-speech" className="text-sm">{translate('telemedicine.autoPlaySpeech')}</Label>
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
              {isChatLoading && (
                <div className="flex items-end gap-2 justify-start">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="https://placehold.co/40x40.png" alt="Bot Avatar" data-ai-hint="robot face" />
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                  <div className="max-w-[75%] rounded-lg px-3 py-2 text-sm shadow-md bg-muted">
                    <Activity className="h-5 w-5 animate-spin text-primary" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                placeholder={isListening ? translate('telemedicine.listening') : translate('telemedicine.chatPlaceholder')}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isChatLoading && handleSendMessage()}
                disabled={isChatLoading || isListening}
              />
              <Button onClick={handleVoiceInput} size="icon" variant="outline" aria-label="Use microphone" disabled={isListening || isChatLoading}>
                <Mic className={`h-5 w-5 ${isListening ? 'text-destructive animate-pulse' : ''}`} />
              </Button>
              <Button onClick={() => handleSendMessage()} size="icon" aria-label={translate('telemedicine.sendButton')} disabled={isChatLoading || isListening || !chatInput.trim()}>
                {isChatLoading ? <Activity className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
