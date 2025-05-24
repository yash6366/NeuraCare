
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, UserCircle, MessageSquare, Activity, Mic, StopCircle, Volume2, VolumeX, Users, Speaker } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";
import type { LanguageCode } from "@/contexts/language-context";
import { getAllUsers } from "@/lib/actions/admin.actions";
import type { Doctor as DoctorType, Patient as PatientUserType, Admin as AdminUserType, AppUser } from "@/types";
import { getCurrentUser } from "@/lib/auth";
import { Alert, AlertDescription, AlertTitle }
from "@/components/ui/alert";

interface Message {
  id: string;
  text: string;
  sender: "user" | "doctor" | "admin" | "system"; // Added 'admin' and 'system'
  timestamp: Date;
  isBroadcast?: boolean;
}

export function TelemedicineClient() {
  const [doctorChatMessages, setDoctorChatMessages] = useState<Message[]>([]);
  const [doctorChatInput, setDoctorChatInput] = useState("");
  const [isDoctorChatLoading, setIsDoctorChatLoading] = useState(false);
  const [isDoctorChatListening, setIsDoctorChatListening] = useState(false);
  const [autoPlayDoctorSpeech, setAutoPlayDoctorSpeech] = useState(true);

  const { toast } = useToast();
  const { language, translate } = useLanguage();
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const doctorChatScrollAreaRef = useRef<HTMLDivElement>(null);
  const doctorChatRecognitionRef = useRef<SpeechRecognition | null>(null);

  const [availableDoctors, setAvailableDoctors] = useState<DoctorType[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorType | null>(null);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);
  const [isAdminBroadcastMode, setIsAdminBroadcastMode] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user); // Works for Patient, Admin, Doctor

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
        handleSendDoctorMessage(transcribedText);
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
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, toast, translate]);

   useEffect(() => {
    if (!autoPlayDoctorSpeech && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [autoPlayDoctorSpeech]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        const loadVoices = () => window.speechSynthesis.getVoices();
        loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }
  }, []);

  const playDoctorTextAsSpeech = (text: string, lang: LanguageCode) => {
    if (!autoPlayDoctorSpeech || typeof window === 'undefined' || !window.speechSynthesis || !text) return;

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


  const handleSendDoctorMessage = async (messageContent?: string) => {
    const currentMessage = typeof messageContent === 'string' ? messageContent : doctorChatInput;
    if (!currentMessage.trim() || !currentUser) return;
    if (currentUser.role === 'patient' && !selectedDoctor) return;
    if (currentUser.role === 'admin' && !isAdminBroadcastMode && !selectedDoctor) return;


    setIsDoctorChatLoading(true);
    setDoctorChatInput("");

    const senderRole = currentUser.role === 'admin' ? 'admin' : 'user';

    const newMessage: Message = {
      id: String(Date.now()),
      text: currentMessage,
      sender: senderRole,
      timestamp: new Date(),
      isBroadcast: currentUser.role === 'admin' && isAdminBroadcastMode,
    };
    setDoctorChatMessages(prev => [...prev, newMessage]);

    setTimeout(() => {
      let replyText = "";
      let replySender: Message['sender'] = 'doctor';

      if (currentUser.role === 'admin' && isAdminBroadcastMode) {
        replyText = translate(
          'telemedicine.adminBroadcastConfirmation',
          'Broadcast message sent to all doctors (simulated): "{messageText}"'
        ).replace('{messageText}', newMessage.text);
        replySender = 'system'; // System message for broadcast confirmation
      } else {
        const doctorName = selectedDoctor?.name.split(' ').pop() || 'Doctor';
        replyText = translate(
          'telemedicine.simulatedDoctorReply',
          'Hello {userName}, this is a simulated reply from Dr. {doctorName}. I have received your message: "{messageText}"'
        )
        .replace('{userName}', currentUser.name)
        .replace('{doctorName}', doctorName)
        .replace('{messageText}', newMessage.text);
        replySender = 'doctor';
      }


      const doctorResponse: Message = {
        id: String(Date.now() + 1),
        text: replyText,
        sender: replySender,
        timestamp: new Date(),
      };
      setDoctorChatMessages(prev => [...prev, doctorResponse]);
      if (autoPlayDoctorSpeech && replySender !== 'system') { // Don't speak system messages
        playDoctorTextAsSpeech(doctorResponse.text, language);
      }
      setIsDoctorChatLoading(false);
    }, 1500);
  };

  const handleDoctorSelection = (doctorId: string) => {
    const doctor = availableDoctors.find(d => d.id === doctorId);
    setSelectedDoctor(doctor || null);
    setDoctorChatMessages([]);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
    if (doctor && currentUser) {
      let greetingText = "";
      if (currentUser.role === 'patient') {
         greetingText = translate(
          'telemedicine.doctorChatGreeting',
          'You are now chatting with Dr. {doctorName}. How can I help you?'
        ).replace('{doctorName}', doctor.name);
      } else if (currentUser.role === 'admin') {
        greetingText = translate(
          'telemedicine.adminChatWithDoctorGreeting',
          'You are now chatting with Dr. {doctorName} as an Administrator.'
        ).replace('{doctorName}', doctor.name);
      }

      const greetingMessage: Message = {
        id: String(Date.now()),
        text: greetingText,
        sender: 'doctor',
        timestamp: new Date()
      };
      setDoctorChatMessages([greetingMessage]);
      if (autoPlayDoctorSpeech) {
        playDoctorTextAsSpeech(greetingMessage.text, language);
      }
    }
  };

  const handleDoctorChatVoiceInput = () => {
    if (doctorChatRecognitionRef.current) {
      if (isDoctorChatListening) {
        doctorChatRecognitionRef.current.stop();
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

  const handleBroadcastModeToggle = (checked: boolean) => {
    setIsAdminBroadcastMode(checked);
    setDoctorChatMessages([]); // Clear messages when switching mode
    if (checked) {
      setSelectedDoctor(null); // Deselect doctor in broadcast mode
      const broadcastInfo: Message = {
        id: String(Date.now()),
        text: translate('telemedicine.adminBroadcastModeActive', 'Broadcast mode active. Messages will be sent to all doctors (simulated).'),
        sender: 'system',
        timestamp: new Date()
      };
      setDoctorChatMessages([broadcastInfo]);
    } else if (selectedDoctor) {
      // Re-trigger greeting if a doctor was previously selected and we're switching back
      handleDoctorSelection(selectedDoctor.id);
    }
  };


  if (!currentUser) {
     return (
        <Card className="lg:col-span-1 shadow-lg">
            <CardHeader>
                <CardTitle>{translate('telemedicine.accessDeniedTitle', 'Access Denied')}</CardTitle>
            </CardHeader>
            <CardContent>
                <p>{translate('telemedicine.accessDeniedDescription', 'You must be logged in to use this feature.')}</p>
            </CardContent>
        </Card>
     )
  }


  return (
    <div className="grid lg:grid-cols-1 gap-8">
      <Card className="lg:col-span-1 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <MessageSquare className="h-7 w-7 text-primary" />
            {currentUser.role === 'admin' ? translate('telemedicine.adminDoctorChatTitle', 'Communicate with Doctors') : translate('telemedicine.chatWithDoctorTitle')}
          </CardTitle>
          <CardDescription>
            {currentUser.role === 'admin' ? translate('telemedicine.adminDoctorChatDescription', 'Chat with individual doctors or broadcast messages to all.') : translate('telemedicine.chatWithDoctorDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 py-4">
            {isLoadingDoctors ? (
              <Skeleton className="h-10 w-full max-w-sm mx-auto" />
            ) : availableDoctors.length > 0 ? (
              <div className="max-w-sm mx-auto space-y-2">
                {currentUser.role === 'admin' && (
                  <div className="flex items-center space-x-2 justify-center mb-4 p-3 border rounded-md bg-primary/5">
                    <Switch
                      id="broadcast-mode"
                      checked={isAdminBroadcastMode}
                      onCheckedChange={handleBroadcastModeToggle}
                      disabled={isLoadingDoctors}
                    />
                    <Label htmlFor="broadcast-mode" className="font-medium text-sm flex items-center gap-1">
                      <Speaker className="h-4 w-4"/>
                      {translate('telemedicine.adminBroadcastModeLabel', 'Broadcast to All Doctors')}
                    </Label>
                  </div>
                )}
                {!isAdminBroadcastMode && (
                  <>
                    <Label htmlFor="doctor-select" className="sr-only">{translate('telemedicine.selectDoctorLabel')}</Label>
                    <Select onValueChange={handleDoctorSelection} value={selectedDoctor?.id || ""} disabled={isAdminBroadcastMode}>
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
                  </>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-center">{translate('telemedicine.noDoctorsAvailable')}</p>
            )}

            { (selectedDoctor || (currentUser.role === 'admin' && isAdminBroadcastMode)) && (
              <Card className="mt-4 flex flex-col h-[450px]">
                <CardHeader className="border-b py-3 flex flex-row justify-between items-center">
                   <CardTitle className="text-lg flex items-center gap-2">
                    {isAdminBroadcastMode ? (
                      <>
                        <Users className="h-6 w-6" />
                        {translate('telemedicine.adminBroadcastingTitle', 'Broadcasting to All Doctors')}
                      </>
                    ) : selectedDoctor ? (
                      <>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://placehold.co/40x40.png?text=${selectedDoctor.name.charAt(0)}`} alt={selectedDoctor.name} data-ai-hint="doctor professional" />
                          <AvatarFallback>{selectedDoctor.name.substring(0,1).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {translate('telemedicine.chattingWith', 'Chatting with Dr. {doctorName}').replace('{doctorName}', selectedDoctor.name)}
                      </>
                    ) : null}
                  </CardTitle>
                  {!isAdminBroadcastMode && (
                    <div className="flex items-center space-x-2">
                      <Switch
                          id="autoplay-doctor-speech"
                          checked={autoPlayDoctorSpeech}
                          onCheckedChange={setAutoPlayDoctorSpeech}
                          aria-label={translate('telemedicine.autoPlayDoctorSpeechLabel', 'Auto-play doctor speech')}
                          disabled={isDoctorChatLoading || isDoctorChatListening}
                      />
                      <Label htmlFor="autoplay-doctor-speech" className="text-sm sr-only">{translate('telemedicine.autoPlayDoctorSpeechLabel', 'Auto-play doctor speech')}</Label>
                      {autoPlayDoctorSpeech ? <Volume2 className="h-5 w-5 text-primary" /> : <VolumeX className="h-5 w-5 text-muted-foreground" />}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="flex-grow flex flex-col p-0">
                  <ScrollArea className="flex-grow p-4 h-72" ref={doctorChatScrollAreaRef}>
                    <div className="space-y-4">
                      {doctorChatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex items-end gap-2 ${
                            (msg.sender === "user" || msg.sender === "admin") ? "justify-end" : "justify-start"
                          }`}
                        >
                          {msg.sender === "doctor" && selectedDoctor && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={`https://placehold.co/40x40.png?text=${selectedDoctor.name.charAt(0)}`} alt={selectedDoctor.name} data-ai-hint="doctor professional" />
                              <AvatarFallback>{selectedDoctor.name.substring(0,1).toUpperCase()}</AvatarFallback>
                            </Avatar>
                          )}
                          {msg.sender === "system" && (
                             <Avatar className="h-8 w-8">
                              <AvatarImage src="https://placehold.co/40x40.png" alt="System Avatar" data-ai-hint="system gear" />
                              <AvatarFallback>Sys</AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={`max-w-[75%] rounded-lg px-3 py-2 text-sm shadow-md ${
                              (msg.sender === "user" || msg.sender === "admin")
                                ? "bg-primary text-primary-foreground"
                                : msg.sender === "system" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300" : "bg-muted"
                            }`}
                          >
                            {msg.text}
                            {msg.isBroadcast && <p className="text-xs opacity-70 mt-1">({translate('telemedicine.broadcastLabel', 'Broadcast')})</p>}
                          </div>
                          {(msg.sender === "user" || msg.sender === "admin") && currentUser && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={`https://placehold.co/40x40.png?text=${currentUser.name.charAt(0)}`} alt={currentUser.name} data-ai-hint={currentUser.role === 'admin' ? 'admin user' : 'user silhouette'}/>
                              <AvatarFallback>{currentUser.name.substring(0,1).toUpperCase()}</AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      ))}
                       {isDoctorChatLoading && (
                        <div className="flex items-end gap-2 justify-start">
                           <Avatar className="h-8 w-8">
                            <AvatarImage src={`https://placehold.co/40x40.png?text=${selectedDoctor ? selectedDoctor.name.charAt(0) : 'S'}`} alt={selectedDoctor?.name || 'System'} data-ai-hint={selectedDoctor? 'doctor professional' : 'system gear'} />
                            <AvatarFallback>{selectedDoctor ? selectedDoctor.name.substring(0,1).toUpperCase() : 'Sys'}</AvatarFallback>
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
                        placeholder={
                          isDoctorChatListening ? translate('telemedicine.listeningDoctorChat', 'Listening for doctor chat...') :
                          isAdminBroadcastMode ? translate('telemedicine.typeBroadcastPlaceholder', "Type your broadcast message...") :
                          translate('telemedicine.typeDoctorMessagePlaceholder', "Type your message to the doctor...")
                        }
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
            {currentUser.role === 'patient' && !selectedDoctor && !isLoadingDoctors && (
                <Alert variant="default" className="max-w-md mx-auto mt-4">
                    <UserCircle className="h-4 w-4"/>
                    <AlertTitle>{translate('telemedicine.selectDoctorPromptTitlePatient', 'Select a Doctor')}</AlertTitle>
                    <AlertDescription>
                    {translate('telemedicine.selectDoctorPromptDescPatient', 'Please select a doctor from the list above to start your chat.')}
                    </AlertDescription>
                </Alert>
            )}
             {currentUser.role === 'admin' && !selectedDoctor && !isAdminBroadcastMode && !isLoadingDoctors && (
                <Alert variant="default" className="max-w-md mx-auto mt-4">
                    <Users className="h-4 w-4"/>
                    <AlertTitle>{translate('telemedicine.adminChatPromptTitle', 'Select Doctor or Broadcast')}</AlertTitle>
                    <AlertDescription>
                    {translate('telemedicine.adminChatPromptDesc', 'Please select a doctor for a one-on-one chat, or activate "Broadcast to All Doctors" mode to send a message to everyone.')}
                    </AlertDescription>
                </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
