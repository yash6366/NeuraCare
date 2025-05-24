
"use client";

import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot as BotIcon, Mic, Volume2, VolumeX, Activity, ImagePlus, Paperclip, FileText, Search, HelpCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { telemedicineChat, type TelemedicineChatInput, type TelemedicineChatOutput } from "@/ai/flows/telemedicine-chat-flow";
import { analyzeImage, type AnalyzeImageInput, type AnalyzeImageOutput } from "@/ai/flows/image-analysis-flow"; // Added
import { useLanguage } from "@/contexts/language-context";
import type { LanguageCode } from "@/contexts/language-context";
import { getCurrentUser, type AppUser } from "@/lib/auth";
import Image from "next/image"; // For displaying image preview
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  isImageQueryResponse?: boolean; // To differentiate image analysis responses
}

interface GenkitChatMessage {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

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
  const imageInputRef = useRef<HTMLInputElement>(null); // For image upload

  // Image Analysis State
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [imageQuery, setImageQuery] = useState("");
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);


  useEffect(() => {
    setCurrentUser(getCurrentUser());
    const initialBotMessageText = translate('telemedicine.aiAssistantInitialGreeting', "Hello! I'm SmartCare AI Assistant. How can I help you today? You can also ask me to analyze images or documents.");
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
  }, [language, translate]);

  useEffect(() => {
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
        handleSendMessage(transcribedText); 
      };
      recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error", event.error);
        toast({ title: translate('telemedicine.voiceError', 'Voice input error. Please try again or type your message.'), description: event.error as string, variant: "destructive" });
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
    if (!autoPlayBotSpeech || typeof window === 'undefined' || !window.speechSynthesis || !text) return;
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
        const loadVoices = () => window.speechSynthesis.getVoices();
        loadVoices(); // Initial load
        window.speechSynthesis.onvoiceschanged = loadVoices; // Load when voices change
    }
  }, []);

  const handleSendMessage = async (messageContent?: string) => {
    const currentMessage = typeof messageContent === 'string' ? messageContent : input;
    if (!currentMessage.trim()) return;
    
    const userMessageText = currentMessage; 
    setInput(""); 

    setIsLoading(true);

    const newUserMessage: Message = {
      id: String(Date.now()),
      text: userMessageText,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newUserMessage]);
    
    let textForAI = userMessageText;
    if (language !== "en-US") { 
        console.log(translate('telemedicine.dwaniTranslateInfo', 'Input (if regional) would be translated to English here by Dwani AI for core processing.'), "Original (regional) for AI:", userMessageText);
    }

    const historyForGenkit: GenkitChatMessage[] = messages.concat([newUserMessage]).map(msg => ({ 
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    }));
    

    const inputForFlow: TelemedicineChatInput = {
      userMessage: textForAI,
      chatHistory: historyForGenkit.slice(0, -1), 
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
        description: `${errorText} ${(error as Error).message ? `Details: ${(error as Error).message}`: ''}`,
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
        toast({ title: translate('telemedicine.speakNow', 'Speak now...') });
      } catch (e) {
        console.error("Error starting speech recognition:", e);
        toast({ title: translate('telemedicine.voiceError', 'Voice input error. Please try again or type your message.'), description: (e as Error).message || translate('telemedicine.voiceError', 'Voice input error. Please try again or type your message.'), variant: "destructive" });
        setIsListening(false);
      }
    } else {
      toast({ title: translate('telemedicine.voiceNotSupported', 'Voice input not supported by your browser.'), variant: "destructive" });
    }
  };

  const handleImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast({
          title: translate('aiChatAssistant.imageTooLargeTitle', 'Image Too Large'),
          description: translate('aiChatAssistant.imageTooLargeDescription', 'Please select an image smaller than {MAX_FILE_SIZE_MB}MB.').replace('{MAX_FILE_SIZE_MB}', String(MAX_FILE_SIZE_MB)),
          variant: "destructive",
        });
        setSelectedImage(null);
        setSelectedImagePreview(null);
        if (imageInputRef.current) imageInputRef.current.value = "";
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!selectedImage || !selectedImagePreview) {
      toast({ title: translate('aiChatAssistant.noImageSelectedTitle', 'No Image Selected'), description: translate('aiChatAssistant.noImageSelectedDescription', 'Please select an image to analyze.'), variant: "destructive" });
      return;
    }
    setIsAnalyzingImage(true);
    setIsLoading(true); // General loading for AI response

    const userQueryMessage: Message = {
        id: String(Date.now()),
        text: imageQuery || translate('aiChatAssistant.analyzeThisImage', 'User requested to analyze the uploaded image.'),
        sender: "user",
        timestamp: new Date(),
      };
    setMessages(prev => [...prev, userQueryMessage]);

    try {
      const inputForFlow: AnalyzeImageInput = {
        imageDataUri: selectedImagePreview,
        query: imageQuery || undefined,
        language: language.split('-')[0],
      };
      const result: AnalyzeImageOutput = await analyzeImage(inputForFlow);
      
      const botResponse: Message = {
        id: String(Date.now() + 1),
        text: result.description,
        sender: "bot",
        timestamp: new Date(),
        isImageQueryResponse: true,
      };
      setMessages(prev => [...prev, botResponse]);
      if (autoPlayBotSpeech) {
        playTextAsSpeech(result.description, language);
      }
    } catch (error) {
      console.error("Error analyzing image:", error);
      const errorText = translate('aiChatAssistant.imageAnalysisError', "Sorry, I couldn't analyze the image.");
      toast({
        title: translate('aiChatAssistant.imageAnalysisErrorTitle', "Image Analysis Error"),
        description: `${errorText} ${(error as Error).message ? `Details: ${(error as Error).message}`: ''}`,
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
      setIsAnalyzingImage(false);
      setIsLoading(false);
      // Clear image selection after analysis? Or keep it for follow-up? For now, keep.
      // setSelectedImage(null);
      // setSelectedImagePreview(null);
      // setImageQuery("");
      // if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };


  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 shadow-lg flex flex-col h-[calc(100vh-200px)] min-h-[600px]">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <BotIcon className="h-6 w-6 text-primary" /> {translate('aiChatAssistant.chatTitle', 'Chat with AI Assistant')}
              </CardTitle>
              <CardDescription>{translate('aiChatAssistant.chatDescription', 'Ask anything, get intelligent responses. You can also upload images for analysis.')}</CardDescription>
            </div>
            <div className="flex items-center space-x-2 pt-1">
              <Switch
                id="autoplay-speech"
                checked={autoPlayBotSpeech}
                onCheckedChange={setAutoPlayBotSpeech}
                aria-label={translate('telemedicine.autoPlaySpeech', 'Auto-play AI speech')}
              />
              <Label htmlFor="autoplay-speech" className="text-sm sr-only">{translate('telemedicine.autoPlaySpeech', 'Auto-play AI speech')}</Label>
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
                    <Avatar className="h-8 w-8 self-start">
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
                    {msg.isImageQueryResponse && selectedImagePreview && (
                        <div className="mt-2 border-t pt-2">
                            <p className="text-xs text-muted-foreground italic">{translate('aiChatAssistant.imageQueryResponseContext', 'Response related to the uploaded image.')}</p>
                        </div>
                    )}
                  </div>
                  {msg.sender === "user" && currentUser && (
                    <Avatar className="h-8 w-8 self-start">
                      <AvatarImage src={`https://placehold.co/40x40.png?text=${currentUser.name.charAt(0)}`} alt={currentUser.name} data-ai-hint="user silhouette" />
                      <AvatarFallback>{currentUser.name.substring(0,1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {(isLoading || isAnalyzingImage) && !messages.some(m => m.sender === 'bot' && m.text.includes('spin')) && ( // Avoid double spinner
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
                placeholder={isListening ? translate('telemedicine.listening', 'Listening...') : translate('telemedicine.chatPlaceholder', 'Type your message...')}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && !isAnalyzingImage && handleSendMessage()}
                disabled={isLoading || isListening || isAnalyzingImage}
              />
              <Button onClick={handleVoiceInput} size="icon" variant="outline" aria-label={translate('telemedicine.useMicButton', 'Use Microphone')} disabled={isListening || isLoading || isAnalyzingImage}>
                <Mic className={`h-5 w-5 ${isListening ? 'text-destructive animate-pulse' : ''}`} />
              </Button>
              <Button onClick={() => handleSendMessage()} size="icon" aria-label={translate('telemedicine.sendButton', 'Send')} disabled={isLoading || isListening || isAnalyzingImage || !input.trim()}>
                {(isLoading && !isAnalyzingImage) ? <Activity className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-1 shadow-lg h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Paperclip className="h-6 w-6 text-primary" /> {translate('aiChatAssistant.fileToolsTitle', 'File Tools')}
          </CardTitle>
          <CardDescription>{translate('aiChatAssistant.fileToolsDescription', 'Upload images or documents for AI analysis.')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Image Analysis Section */}
          <div className="space-y-3 p-3 border rounded-lg bg-background/50">
            <h3 className="font-semibold flex items-center gap-2"><ImagePlus className="h-5 w-5 text-accent" /> {translate('aiChatAssistant.imageAnalysisTitle', 'Image Analysis')}</h3>
            <Input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageFileChange}
              ref={imageInputRef}
              className="text-sm"
              disabled={isAnalyzingImage || isLoading}
            />
            {selectedImagePreview && (
              <div className="mt-2 border rounded-md p-2 flex flex-col items-center">
                <Image src={selectedImagePreview} alt="Selected preview" width={150} height={150} className="rounded-md object-contain max-h-[150px]" data-ai-hint="uploaded image"/>
                <Button variant="link" size="sm" className="text-xs text-destructive mt-1" onClick={() => {setSelectedImage(null); setSelectedImagePreview(null); if(imageInputRef.current) imageInputRef.current.value = "";}}>
                  {translate('aiChatAssistant.removeImageButton', 'Remove Image')}
                </Button>
              </div>
            )}
            <Textarea
              placeholder={translate('aiChatAssistant.imageQueryPlaceholder', "Optional: Ask something about the image...")}
              value={imageQuery}
              onChange={(e) => setImageQuery(e.target.value)}
              rows={2}
              className="text-sm"
              disabled={!selectedImage || isAnalyzingImage || isLoading}
            />
            <Button onClick={handleAnalyzeImage} className="w-full" disabled={!selectedImage || isAnalyzingImage || isLoading}>
              {isAnalyzingImage ? <Activity className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              {translate('aiChatAssistant.analyzeImageButton', 'Analyze Image')}
            </Button>
          </div>

          {/* Document Analysis Section (Placeholder) */}
          <div className="space-y-3 p-3 border rounded-lg bg-background/50 opacity-50 cursor-not-allowed">
            <h3 className="font-semibold flex items-center gap-2"><FileText className="h-5 w-5 text-muted-foreground" /> {translate('aiChatAssistant.documentAnalysisTitle', 'Document Analysis (Coming Soon)')}</h3>
             <Alert variant="default">
                <HelpCircle className="h-4 w-4" />
                <AlertTitle>{translate('aiChatAssistant.comingSoonTitle', 'Feature Coming Soon!')}</AlertTitle>
                <AlertDescription>
                {translate('aiChatAssistant.documentFeaturePlaceholder', 'Functionality to upload and analyze documents (PDFs) will be added here. You\'ll be able to extract text, get summaries, and ask questions about your documents.')}
                </AlertDescription>
            </Alert>
            <Button className="w-full" disabled={true}>
              <Paperclip className="mr-2 h-4 w-4" /> {translate('aiChatAssistant.uploadDocumentButton', 'Upload Document (Disabled)')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
