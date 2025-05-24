
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, Mic, Volume2, VolumeX, Activity, UserCircle, MessageSquare, Languages } from "lucide-react"; // Replaced Video, Phone with MessageSquare
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { telemedicineChat, type TelemedicineChatInput, type TelemedicineChatOutput } from "@/ai/flows/telemedicine-chat-flow";
import { useLanguage } from "@/contexts/language-context";
import type { LanguageCode } from "@/contexts/language-context";
import { getAllUsers } from "@/lib/actions/admin.actions"; 
import type { Doctor as DoctorType, AppUser, Patient as PatientUserType } from "@/types"; 
import { getCurrentUser } from "@/lib/auth";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot" | "doctor"; // Added "doctor" sender type
  timestamp: Date;
}

interface GenkitChatMessage {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

export function TelemedicineClient() {
  const [aiChatMessages, setAiChatMessages] = useState<Message[]>([]);
  const [aiChatInput, setAiChatInput] = useState("");
  const [isAiChatLoading, setIsAiChatLoading] = useState(false);
  
  const [doctorChatMessages, setDoctorChatMessages] = useState<Message[]>([]);
  const [doctorChatInput, setDoctorChatInput] = useState("");
  const [isDoctorChatLoading, setIsDoctorChatLoading] = useState(false); // For doctor chat

  const { toast } = useToast();
  const { language, translate, supportedLanguages } = useLanguage();
  const [currentUser, setCurrentUser] = useState<PatientUserType | null>(null);


  const [isListening, setIsListening] = useState(false);
  const [autoPlayBotSpeech, setAutoPlayBotSpeech] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const [availableDoctors, setAvailableDoctors] = useState<DoctorType[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorType | null>(null);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);

  useEffect(() => {
    setCurrentUser(getCurrentUser() as PatientUserType | null);
    const initialBotMessageText = translate('telemedicine.aiAssistantInitialGreeting');
    const initialBotMessage: Message = {
      id: String(Date.now()),
      text: initialBotMessageText,
      sender: "bot",
      timestamp: new Date(),
    };
    setAiChatMessages([initialBotMessage]);
    if (autoPlayBotSpeech && typeof window !== 'undefined' && window.speechSynthesis) {
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
        setAiChatInput(transcribedText); // Default to AI chat input, user can switch focus
        setIsListening(false);
        handleSendAiMessage(transcribedText); // Auto-send for AI chat
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
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [language, toast, translate]); // Added translate to dependency array

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

  const handleSendAiMessage = async (messageContent?: string) => {
    const currentMessage = typeof messageContent === 'string' ? messageContent : aiChatInput;
    if (!currentMessage.trim()) return;
    setIsAiChatLoading(true);

    const newUserMessage: Message = {
      id: String(Date.now()),
      text: currentMessage,
      sender: "user",
      timestamp: new Date(),
    };
    setAiChatMessages(prev => [...prev, newUserMessage]);
    if (typeof messageContent !== 'string') {
      setAiChatInput("");
    }

    let textForAI = currentMessage;
    if (language !== "en-US") { // Assuming en-US is your "internal processing" language
      console.log(translate('telemedicine.dwaniTranslateInfo'), "Original (regional) for AI:", currentMessage);
      // Here you would theoretically call Dwani AI translation:
      // textForAI = await dwaniTranslateToEnglish(currentMessage); 
    }

    const historyForGenkit: GenkitChatMessage[] = aiChatMessages.map(msg => ({
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
      setAiChatMessages(prev => [...prev, newBotMessage]);
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
      setAiChatMessages(prev => [...prev, errorBotMessage]);
    } finally {
      setIsAiChatLoading(false);
    }
  };
  
  const handleSendDoctorMessage = async () => {
    if (!doctorChatInput.trim() || !selectedDoctor) return;
    setIsDoctorChatLoading(true);

    const newUserMessage: Message = {
      id: String(Date.now()),
      text: doctorChatInput,
      sender: "user",
      timestamp: new Date(),
    };
    setDoctorChatMessages(prev => [...prev, newUserMessage]);
    const patientName = currentUser?.name || "Patient";
    setDoctorChatInput("");

    // Simulate doctor's reply
    setTimeout(() => {
      const replyText = translate('telemedicine.simulatedDoctorReply', `Hello ${patientName}, this is a simulated reply from Dr. ${selectedDoctor.name.split(' ').pop()}. I have received your message: "${newUserMessage.text}"`);
      const doctorResponse: Message = {
        id: String(Date.now() + 1),
        text: replyText,
        sender: "doctor",
        timestamp: new Date(),
      };
      setDoctorChatMessages(prev => [...prev, doctorResponse]);
      if (autoPlayBotSpeech) {
        playTextAsSpeech(replyText, language);
      }
      setIsDoctorChatLoading(false);
    }, 1500);
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
    setDoctorChatMessages([]); // Clear previous doctor's chat
    if (doctor) {
      const greetingText = translate('telemedicine.doctorChatGreeting', `You are now chatting with Dr. ${doctor.name}. How can I help you?`);
      const greetingMessage: Message = {
        id: String(Date.now()),
        text: greetingText,
        sender: 'doctor',
        timestamp: new Date()
      };
      setDoctorChatMessages([greetingMessage]);
      if (autoPlayBotSpeech) {
        playTextAsSpeech(greetingText, language);
      }
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-2 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <MessageSquare className="h-7 w-7 text-primary" /> {translate('telemedicine.chatWithDoctorTitle')}
          </CardTitle>
          <CardDescription>{translate('telemedicine.chatWithDoctorDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 py-4">
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
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={`https://placehold.co/40x40.png?text=${doc.name.charAt(0)}`} alt={doc.name} data-ai-hint="doctor professional" />
                            <AvatarFallback>{doc.name.substring(0,1).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          Dr. {doc.name} ({doc.specialty || 'General'})
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <p className="text-muted-foreground text-center">{translate('telemedicine.noDoctorsAvailable')}</p>
            )}

            {selectedDoctor && (
              <Card className="mt-4 flex flex-col h-[450px]"> {/* Fixed height for chat area */}
                <CardHeader className="border-b py-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                     <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://placehold.co/40x40.png?text=${selectedDoctor.name.charAt(0)}`} alt={selectedDoctor.name} data-ai-hint="doctor professional" />
                        <AvatarFallback>{selectedDoctor.name.substring(0,1).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    Chatting with Dr. {selectedDoctor.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col p-0">
                  <ScrollArea className="h-72 flex-grow p-4">
                    <div className="space-y-4">
                      {doctorChatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex items-end gap-2 ${
                            msg.sender === "user" ? "justify-end" : "justify-start"
                          }`}
                        >
                          {msg.sender === "doctor" && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={`https://placehold.co/40x40.png?text=${selectedDoctor.name.charAt(0)}`} alt={selectedDoctor.name} data-ai-hint="doctor professional" />
                              <AvatarFallback>{selectedDoctor.name.substring(0,1).toUpperCase()}</AvatarFallback>
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
                          {msg.sender === "user" && currentUser && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={`https://placehold.co/40x40.png?text=${currentUser.name.charAt(0)}`} alt={currentUser.name} data-ai-hint="user silhouette" />
                              <AvatarFallback>{currentUser.name.substring(0,1).toUpperCase()}</AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      ))}
                       {isDoctorChatLoading && (
                        <div className="flex items-end gap-2 justify-start">
                           <Avatar className="h-8 w-8">
                            <AvatarImage src={`https://placehold.co/40x40.png?text=${selectedDoctor.name.charAt(0)}`} alt={selectedDoctor.name} data-ai-hint="doctor professional" />
                            <AvatarFallback>{selectedDoctor.name.substring(0,1).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="max-w-[75%] rounded-lg px-3 py-2 text-sm shadow-md bg-muted">
                            <Activity className="h-5 w-5 animate-spin text-primary" />
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                  <div className="p-4 border-t bg-background/80">
                    <div className="flex gap-2">
                      <Input
                        placeholder={translate('telemedicine.typeDoctorMessagePlaceholder', "Type your message to the doctor...")}
                        value={doctorChatInput}
                        onChange={(e) => setDoctorChatInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !isDoctorChatLoading && handleSendDoctorMessage()}
                        disabled={isDoctorChatLoading}
                      />
                      <Button onClick={handleSendDoctorMessage} size="icon" aria-label={translate('telemedicine.sendButton')} disabled={isDoctorChatLoading || !doctorChatInput.trim()}>
                        {isDoctorChatLoading ? <Activity className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {!selectedDoctor && !isLoadingDoctors && (
                <p className="text-muted-foreground text-center mt-4">{translate('telemedicine.selectDoctorToChat')}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-1 shadow-lg flex flex-col h-[600px]"> {/* Fixed height for AI chat */}
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Bot className="h-7 w-7 text-primary" /> {translate('telemedicine.aiAssistantTitle')}
              </CardTitle>
              <CardDescription>{translate('telemedicine.aiAssistantDescription')}</CardDescription>
            </div>
            <div className="flex items-center space-x-2 pt-1">
              <Switch
                id="autoplay-speech"
                checked={autoPlayBotSpeech}
                onCheckedChange={setAutoPlayBotSpeech}
                aria-label={translate('telemedicine.autoPlaySpeech')}
              />
              <Label htmlFor="autoplay-speech" className="text-sm sr-only">{translate('telemedicine.autoPlaySpeech')}</Label>
              {autoPlayBotSpeech ? <Volume2 className="h-5 w-5 text-primary" /> : <VolumeX className="h-5 w-5 text-muted-foreground" />}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col p-0">
          <ScrollArea className="h-72 flex-grow p-4">
            <div className="space-y-4">
              {aiChatMessages.map((msg) => (
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
                  {msg.sender === "user" && currentUser && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://placehold.co/40x40.png?text=${currentUser.name.charAt(0)}`} alt={currentUser.name} data-ai-hint="user silhouette" />
                      <AvatarFallback>{currentUser.name.substring(0,1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isAiChatLoading && (
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
                value={aiChatInput}
                onChange={(e) => setAiChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isAiChatLoading && handleSendAiMessage()}
                disabled={isAiChatLoading || isListening}
              />
              <Button onClick={handleVoiceInput} size="icon" variant="outline" aria-label={translate('telemedicine.useMicButton')} disabled={isListening || isAiChatLoading}>
                <Mic className={`h-5 w-5 ${isListening ? 'text-destructive animate-pulse' : ''}`} />
              </Button>
              <Button onClick={() => handleSendAiMessage()} size="icon" aria-label={translate('telemedicine.sendButton')} disabled={isAiChatLoading || isListening || !aiChatInput.trim()}>
                {isAiChatLoading ? <Activity className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
