
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot as BotIcon, Mic, Volume2, VolumeX, Activity } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { telemedicineChat, type TelemedicineChatInput, type TelemedicineChatOutput } from "@/ai/flows/telemedicine-chat-flow";
import { useLanguage } from "@/contexts/language-context";
import type { LanguageCode } from "@/contexts/language-context";
import { getCurrentUser, type AppUser } from "@/lib/auth";

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

export function AiChatAssistantClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

  const { toast } = useToast();
  const { language, translate } = useLanguage();

  const [isListening, setIsListening] = useState(false);
  const [autoPlayBotSpeech, setAutoPlayBotSpeech] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
    const initialBotMessageText = translate('telemedicine.aiAssistantInitialGreeting'); // Re-use existing key or create new one
    const initialBotMessage: Message = {
      id: String(Date.now()),
      text: initialBotMessageText,
      sender: "bot",
      timestamp: new Date(),
    };
    setMessages([initialBotMessage]);
    if (autoPlayBotSpeech && typeof window !== 'undefined' && window.speechSynthesis) {
      playTextAsSpeech(initialBotMessageText, language);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, translate]); // Effect runs on language change to re-initialize greeting

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
        const scrollableViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (scrollableViewport) {
            scrollableViewport.scrollTop = scrollableViewport.scrollHeight;
        }
    }
  }, [messages]);


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
        setInput(transcribedText);
        setIsListening(false);
        handleSendMessage(transcribedText); // Auto-send after transcription
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      utterance.lang = lang; // Fallback to browser's language choice if specific voice not found
    }
    window.speechSynthesis.cancel(); 
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => {
        // Voices loaded, useful if you need to re-select a voice after this event
      };
    }
  }, []);

  const handleSendMessage = async (messageContent?: string) => {
    const currentMessage = typeof messageContent === 'string' ? messageContent : input;
    if (!currentMessage.trim()) return;
    setIsLoading(true);

    const newUserMessage: Message = {
      id: String(Date.now()),
      text: currentMessage,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newUserMessage]);
    if (typeof messageContent !== 'string') { // Clear input only if not from voice auto-send
        setInput("");
    }


    let textForAI = currentMessage;
    if (language !== "en-US") { 
        console.log(translate('telemedicine.dwaniTranslateInfo'), "Original (regional) for AI:", currentMessage);
    }

    const historyForGenkit: GenkitChatMessage[] = messages.map(msg => ({
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
      setMessages(prev => [...prev, newBotMessage]);
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
      setMessages(prev => [...prev, errorBotMessage]);
    } finally {
      setIsLoading(false);
    }
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

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg flex flex-col h-[calc(100vh-200px)] min-h-[500px]">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <BotIcon className="h-6 w-6 text-primary" /> {translate('aiChatAssistant.chatTitle', 'Chat with AI Assistant')}
            </CardTitle>
            <CardDescription>{translate('aiChatAssistant.chatDescription', 'Ask anything, get intelligent responses.')}</CardDescription>
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
        <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((msg) => (
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
            {isLoading && (
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
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
              disabled={isLoading || isListening}
            />
            <Button onClick={handleVoiceInput} size="icon" variant="outline" aria-label={translate('telemedicine.useMicButton')} disabled={isListening || isLoading}>
              <Mic className={`h-5 w-5 ${isListening ? 'text-destructive animate-pulse' : ''}`} />
            </Button>
            <Button onClick={() => handleSendMessage()} size="icon" aria-label={translate('telemedicine.sendButton')} disabled={isLoading || isListening || !input.trim()}>
              {isLoading ? <Activity className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
