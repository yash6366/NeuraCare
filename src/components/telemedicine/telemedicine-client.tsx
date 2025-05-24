
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, UserCircle, MessageSquare, Activity, Mic, StopCircle } from "lucide-react"; 
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";
import { getAllUsers } from "@/lib/actions/admin.actions"; 
import type { Doctor as DoctorType, Patient as PatientUserType } from "@/types"; 
import { getCurrentUser } from "@/lib/auth";

interface Message {
  id: string;
  text: string;
  sender: "user" | "doctor"; 
  timestamp: Date;
}

export function TelemedicineClient() {
  const [doctorChatMessages, setDoctorChatMessages] = useState<Message[]>([]);
  const [doctorChatInput, setDoctorChatInput] = useState("");
  const [isDoctorChatLoading, setIsDoctorChatLoading] = useState(false); 
  const [isDoctorChatListening, setIsDoctorChatListening] = useState(false);

  const { toast } = useToast();
  const { language, translate } = useLanguage();
  const [currentUser, setCurrentUser] = useState<PatientUserType | null>(null);
  const doctorChatScrollAreaRef = useRef<HTMLDivElement>(null);
  const doctorChatRecognitionRef = useRef<SpeechRecognition | null>(null);

  const [availableDoctors, setAvailableDoctors] = useState<DoctorType[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorType | null>(null);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (user?.role === 'patient') {
      setCurrentUser(user as PatientUserType);
    }
    
    const fetchDoctors = async () => {
      setIsLoadingDoctors(true);
      try {
        const users = await getAllUsers();
        if (users) {
          const doctors = users.filter(u => u.role === 'doctor') as DoctorType[];
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
  }, [translate]); 

  useEffect(() => {
    if (doctorChatScrollAreaRef.current) {
        const scrollableViewport = doctorChatScrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (scrollableViewport) {
            scrollableViewport.scrollTop = scrollableViewport.scrollHeight;
        }
    }
  }, [doctorChatMessages]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = language;

      recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
        let transcribedText = event.results[0][0].transcript;
        setDoctorChatInput(transcribedText);
        // setIsDoctorChatListening(false); // onend will handle this
        handleSendDoctorMessage(transcribedText); // Send message after transcription
      };
      recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Doctor chat speech recognition error", event.error);
        toast({ title: translate('telemedicine.voiceError', 'Voice input error. Please try again or type your message.'), description: event.error as string, variant: "destructive" });
        setIsDoctorChatListening(false);
      };
      recognitionInstance.onend = () => {
        setIsDoctorChatListening(false);
      };
      doctorChatRecognitionRef.current = recognitionInstance;
    } else {
      console.warn("SpeechRecognition API not supported for doctor chat.");
    }

    return () => {
      doctorChatRecognitionRef.current?.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, toast, translate]); // Removed handleSendDoctorMessage from deps


  const handleSendDoctorMessage = async (messageContent?: string) => {
    const currentMessage = typeof messageContent === 'string' ? messageContent : doctorChatInput;
    if (!currentMessage.trim() || !selectedDoctor || !currentUser) return;
    
    setIsDoctorChatLoading(true);
    setDoctorChatInput(""); // Clear input immediately

    const newUserMessage: Message = {
      id: String(Date.now()),
      text: currentMessage,
      sender: "user",
      timestamp: new Date(),
    };
    setDoctorChatMessages(prev => [...prev, newUserMessage]);
    

    setTimeout(() => {
      const replyText = translate(
        'telemedicine.simulatedDoctorReply', 
        'Hello {patientName}, this is a simulated reply from Dr. {doctorName}. I have received your message: "{messageText}"'
      )
      .replace('{patientName}', currentUser.name)
      .replace('{doctorName}', selectedDoctor.name.split(' ').pop() || 'Doctor')
      .replace('{messageText}', newUserMessage.text);

      const doctorResponse: Message = {
        id: String(Date.now() + 1),
        text: replyText,
        sender: "doctor",
        timestamp: new Date(),
      };
      setDoctorChatMessages(prev => [...prev, doctorResponse]);
      setIsDoctorChatLoading(false);
    }, 1500);
  };

  const handleDoctorSelection = (doctorId: string) => {
    const doctor = availableDoctors.find(d => d.id === doctorId);
    setSelectedDoctor(doctor || null);
    setDoctorChatMessages([]); 
    if (doctor && currentUser) {
      const greetingText = translate(
        'telemedicine.doctorChatGreeting', 
        'You are now chatting with Dr. {doctorName}. How can I help you?'
      ).replace('{doctorName}', doctor.name);
      const greetingMessage: Message = {
        id: String(Date.now()),
        text: greetingText,
        sender: 'doctor',
        timestamp: new Date()
      };
      setDoctorChatMessages([greetingMessage]);
    }
  };

  const handleDoctorChatVoiceInput = () => {
    if (doctorChatRecognitionRef.current) {
      if (isDoctorChatListening) {
        doctorChatRecognitionRef.current.stop();
        // setIsDoctorChatListening(false); // onend will handle this
      } else {
        try {
          doctorChatRecognitionRef.current.lang = language;
          doctorChatRecognitionRef.current.start();
          setIsDoctorChatListening(true);
          toast({ title: translate('telemedicine.speakNow', 'Speak now...') });
        } catch (e) {
          console.error("Error starting doctor chat speech recognition:", e);
          toast({ title: translate('telemedicine.voiceError', 'Voice input error. Please try again or type your message.'), description: (e as Error).message || 'Could not start voice input.', variant: "destructive" });
          setIsDoctorChatListening(false);
        }
      }
    } else {
      toast({ title: translate('telemedicine.voiceNotSupported', 'Voice input not supported by your browser.'), variant: "destructive" });
    }
  };


  if (!currentUser) {
     return (
        <Card className="lg:col-span-1 shadow-lg">
            <CardHeader>
                <CardTitle>{translate('telemedicine.accessDeniedTitle', 'Access Denied')}</CardTitle>
            </CardHeader>
            <CardContent>
                <p>{translate('telemedicine.accessDeniedDescription', 'You must be logged in as a patient to use this feature.')}</p>
            </CardContent>
        </Card>
     )
  }


  return (
    <div className="grid lg:grid-cols-1 gap-8"> 
      <Card className="lg:col-span-1 shadow-lg"> 
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
                            <AvatarImage src={`https://placehold.co/40x40.png?text=${doc.name.charAt(0)}`} alt={doc.name} data-ai-hint="doctor professional"/>
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
              <Card className="mt-4 flex flex-col h-[450px]">
                <CardHeader className="border-b py-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                     <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://placehold.co/40x40.png?text=${selectedDoctor.name.charAt(0)}`} alt={selectedDoctor.name} data-ai-hint="doctor professional" />
                        <AvatarFallback>{selectedDoctor.name.substring(0,1).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    {translate('telemedicine.chattingWith', 'Chatting with Dr. {doctorName}').replace('{doctorName}', selectedDoctor.name)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col p-0">
                  <ScrollArea className="flex-grow p-4 h-72" ref={doctorChatScrollAreaRef}>
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
                              <AvatarImage src={`https://placehold.co/40x40.png?text=${currentUser.name.charAt(0)}`} alt={currentUser.name} data-ai-hint="user silhouette"/>
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
                        placeholder={isDoctorChatListening ? translate('telemedicine.listeningDoctorChat', 'Listening for doctor chat...') : translate('telemedicine.typeDoctorMessagePlaceholder', "Type your message to the doctor...")}
                        value={doctorChatInput}
                        onChange={(e) => setDoctorChatInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !isDoctorChatLoading && handleSendDoctorMessage()}
                        disabled={isDoctorChatLoading || (isDoctorChatListening && !doctorChatInput) }
                      />
                       <Button 
                          onClick={handleDoctorChatVoiceInput} 
                          size="icon" 
                          variant="outline" 
                          aria-label={isDoctorChatListening ? translate('telemedicine.stopListening', 'Stop Listening') : translate('telemedicine.useMicButtonDoctorChat', 'Use Microphone for Doctor Chat')} 
                          disabled={isDoctorChatLoading}
                        >
                        {isDoctorChatListening ? <StopCircle className="h-5 w-5 text-destructive animate-pulse" /> : <Mic className="h-5 w-5" />}
                      </Button>
                      <Button onClick={() => handleSendDoctorMessage()} size="icon" aria-label={translate('telemedicine.sendButton')} disabled={isDoctorChatLoading || !doctorChatInput.trim()}>
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
    </div>
  );
}
