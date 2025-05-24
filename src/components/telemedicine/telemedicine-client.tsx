
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Video, Phone, Send, Bot, Mic, Volume2, VolumeX, Activity, Users } from "lucide-react";
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

const supportedLanguages = [
  { value: "en-US", label: "English (US)" },
  { value: "hi-IN", label: "हिन्दी (Hindi)" },
  { value: "kn-IN", label: "ಕನ್ನಡ (Kannada)" },
  { value: "te-IN", label: "తెలుగు (Telugu)" },
  { value: "ta-IN", label: "தமிழ் (Tamil)" },
  { value: "bn-IN", label: "বাংলা (Bengali)" },
  { value: "mr-IN", label: "मराठी (Marathi)" },
  { value: "gu-IN", label: "ગુજરાતી (Gujarati)" },
  { value: "ur-IN", label: "اردو (Urdu)" },
];

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
    aiAssistantInitialGreeting: "Hello! I'm SmartCare AI Assistant. How can I help you today?",
    verbalConsultationTitle: "Verbal Consultation",
    verbalConsultationDescription: "Connect with registered doctors for a voice call based on your needs.",
    startAudioCall: "Start Audio Call with a Doctor",
    startVideoCall: "Start Video Call with a Doctor"
  },
  "hi-IN": {
    chatPlaceholder: "अपना संदेश लिखें...",
    sendButton: "भेजें",
    listening: "सुन रहा है...",
    speakNow: "अब बोलें...",
    voiceError: "वॉइस इनपुट त्रुटि। कृपया पुनः प्रयास करें या अपना संदेश टाइप करें।",
    voiceNotSupported: "आपके ब्राउज़र द्वारा वॉइस इनपुट समर्थित नहीं है।",
    autoPlaySpeech: "एआई भाषण स्वतः चलाएं",
    language: "भाषा",
    aiAssistantTitle: "एआई चैट सहायक",
    aiAssistantDescription: "अपने स्वास्थ्य प्रश्नों के त्वरित उत्तर प्राप्त करें।",
    aiAssistantInitialGreeting: "नमस्ते! मैं स्मार्टकेयर एआई सहायक हूँ। आज मैं आपकी कैसे मदद कर सकता हूँ?",
    verbalConsultationTitle: "मौखिक परामर्श",
    verbalConsultationDescription: "अपनी आवश्यकताओं के आधार पर पंजीकृत डॉक्टरों के साथ वॉयस कॉल के लिए जुड़ें।",
    startAudioCall: "डॉक्टर के साथ ऑडियो कॉल शुरू करें",
    startVideoCall: "डॉक्टर के साथ वीडियो कॉल शुरू करें"
  },
  "kn-IN": { 
    chatPlaceholder: "ನಿಮ್ಮ ಸಂದೇಶವನ್ನು ಟೈಪ್ ಮಾಡಿ...",
    sendButton: "ಕಳುಹಿಸು",
    listening: "ಕೇಳುತ್ತಿದೆ...",
    speakNow: "ಈಗ ಮಾತನಾಡಿ...",
    voiceError: "ಧ್ವನಿ ಇನ್ಪುಟ್ ದೋಷ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ನಿಮ್ಮ ಸಂದೇಶವನ್ನು ಟೈಪ್ ಮಾಡಿ.",
    voiceNotSupported: "ನಿಮ್ಮ ಬ್ರೌಸರ್‌ನಿಂದ ಧ್ವನಿ ಇನ್ಪುಟ್ ಬೆಂಬಲಿತವಾಗಿಲ್ಲ.",
    autoPlaySpeech: "AI ಭಾಷಣವನ್ನು ಸ್ವಯಂ-ಪ್ಲೇ ಮಾಡಿ",
    language: "ಭಾಷೆ",
    aiAssistantTitle: "AI ಚಾಟ್ ಸಹಾಯಕ",
    aiAssistantDescription: "ನಿಮ್ಮ ಆರೋಗ್ಯ ಪ್ರಶ್ನೆಗಳಿಗೆ ತ್ವರಿತ ಉತ್ತರಗಳನ್ನು ಪಡೆಯಿರಿ.",
    aiAssistantInitialGreeting: "ನಮಸ್ಕಾರ! ನಾನು ಸ್ಮಾರ್ಟ್‌ಕೇರ್ AI ಸಹಾಯಕ. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?",
    verbalConsultationTitle: "ಮೌಖಿಕ ಸಮಾಲೋಚನೆ",
    verbalConsultationDescription: "ನಿಮ್ಮ ಅಗತ್ಯಗಳಿಗೆ ಅನುಗುಣವಾಗಿ ನೋಂದಾಯಿತ ವೈದ್ಯರೊಂದಿಗೆ ಧ್ವನಿ ಕರೆಗಾಗಿ ಸಂಪರ್ಕಿಸಿ.",
    startAudioCall: "ವೈದ್ಯರೊಂದಿಗೆ ಆಡಿಯೋ ಕರೆ ಪ್ರಾರಂಭಿಸಿ",
    startVideoCall: "ವೈದ್ಯರೊಂದಿಗೆ ವೀಡಿಯೊ ಕರೆ ಪ್ರಾರಂಭಿಸಿ"
  },
  "te-IN": { 
    chatPlaceholder: "మీ సందేశాన్ని టైప్ చేయండి...",
    sendButton: "పంపు",
    listening: "వినడం...",
    speakNow: "ఇప్పుడు మాట్లాడండి...",
    voiceError: "వాయిస్ ఇన్‌పుట్ లోపం. దయచేసి మళ్లీ ప్రయత్నించండి లేదా మీ సందేశాన్ని టైప్ చేయండి.",
    voiceNotSupported: "మీ బ్రౌజర్ ద్వారా వాయిస్ ఇన్‌పుట్ మద్దతు లేదు.",
    autoPlaySpeech: "AI ప్రసంగాన్ని ఆటో-ప్లే చేయండి",
    language: "భాష",
    aiAssistantTitle: "AI చాట్ అసిస్టెంట్",
    aiAssistantDescription: "మీ ఆరోగ్య ప్రశ్నలకు త్వరిత సమాధానాలను పొందండి.",
    aiAssistantInitialGreeting: "నమస్కారం! నేను స్మార్ట్‌కేర్ AI అసిస్టెంట్. ఈ రోజు నేను మీకు ఎలా సహాయపడగలను?",
    verbalConsultationTitle: "మౌఖిక సంప్రదింపులు",
    verbalConsultationDescription: "మీ అవసరాలకు అనుగుణంగా రిజిస్టర్డ్ డాక్టర్లతో వాయిస్ కాల్ కోసం కనెక్ట్ అవ్వండి.",
    startAudioCall: "డాక్టర్‌తో ఆడియో కాల్ ప్రారంభించండి",
    startVideoCall: "డాక్టర్‌తో వీడియో కాల్ ప్రారంభించండి"
  },
    "ta-IN": { 
    chatPlaceholder: "உங்கள் செய்தியைத் தட்டச்சு செய்க...",
    sendButton: "அனுப்பு",
    listening: "கேட்கிறது...",
    speakNow: "இப்போது பேசுங்கள்...",
    voiceError: "குரல் உள்ளீட்டுப் பிழை. மீண்டும் முயற்சிக்கவும் அல்லது உங்கள் செய்தியைத் தட்டச்சு செய்யவும்.",
    voiceNotSupported: "உங்கள் உலாவியில் குரல் உள்ளீடு ஆதரிக்கப்படவில்லை.",
    autoPlaySpeech: "AI பேச்சைத் தானாக இயக்கு",
    language: "மொழி",
    aiAssistantTitle: "AI அரட்டை உதவியாளர்",
    aiAssistantDescription: "உங்கள் சுகாதார வினவல்களுக்கு விரைவான பதில்களைப் பெறுங்கள்.",
    aiAssistantInitialGreeting: "வணக்கம்! நான் ஸ்மார்ட்கேர் AI உதவியாளர். இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?",
    verbalConsultationTitle: "வாய்மொழி ஆலோசனை",
    verbalConsultationDescription: "உங்கள் தேவைகளுக்கு ஏற்ப பதிவுசெய்யப்பட்ட மருத்துவர்களுடன் குரல் அழைப்புக்கு இணையுங்கள்.",
    startAudioCall: "மருத்துவருடன் ஆடியோ அழைப்பைத் தொடங்குங்கள்",
    startVideoCall: "மருத்துவருடன் வீடியோ அழைப்பைத் தொடங்குங்கள்"
  },
  "bn-IN": { 
    chatPlaceholder: "আপনার বার্তা টাইপ করুন...",
    sendButton: "পাঠান",
    listening: "শুনছে...",
    speakNow: "এখন কথা বলুন...",
    voiceError: "ভয়েস ইনপুট ত্রুটি। অনুগ্রহ করে আবার চেষ্টা করুন অথবা আপনার বার্তা টাইপ করুন।",
    voiceNotSupported: "আপনার ব্রাউজার ভয়েস ইনপুট সমর্থন করে না।",
    autoPlaySpeech: "এআই স্পিচ অটো-প্লে করুন",
    language: "ভাষা",
    aiAssistantTitle: "এআই চ্যাট সহকারী",
    aiAssistantDescription: "আপনার স্বাস্থ্য প্রশ্নের দ্রুত উত্তর পান।",
    aiAssistantInitialGreeting: "নমস্কার! আমি স্মার্টকেয়ার এআই সহকারী। আজ আমি আপনাকে কিভাবে সাহায্য করতে পারি?",
    verbalConsultationTitle: "মৌখিক পরামর্শ",
    verbalConsultationDescription: "আপনার প্রয়োজন অনুযায়ী নিবন্ধিত ডাক্তারদের সাথে ভয়েস কলের জন্য সংযোগ করুন।",
    startAudioCall: "ডাক্তারের সাথে অডিও কল শুরু করুন",
    startVideoCall: "ডাক্তারের সাথে ভিডিও কল শুরু করুন"
  },
  "mr-IN": {
    chatPlaceholder: "तुमचा संदेश टाइप करा...",
    sendButton: "पाठवा",
    listening: "ऐकत आहे...",
    speakNow: "आता बोला...",
    voiceError: "व्हॉइस इनपुट त्रुटी. कृपया पुन्हा प्रयत्न करा किंवा तुमचा संदेश टाइप करा.",
    voiceNotSupported: "तुमचा ब्राउझर व्हॉइस इनपुटला समर्थन देत नाही.",
    autoPlaySpeech: "एआय स्पीच ऑटो-प्ले करा",
    language: "भाषा",
    aiAssistantTitle: "एआय चॅट असिस्टंट",
    aiAssistantDescription: "तुमच्या आरोग्यविषयक प्रश्नांची त्वरित उत्तरे मिळवा.",
    aiAssistantInitialGreeting: "नमस्कार! मी स्मार्टकेअर एआय असिस्टंट आहे. आज मी तुमची कशी मदत करू शकेन?",
    verbalConsultationTitle: "तोंडी सल्लामसलत",
    verbalConsultationDescription: "तुमच्या गरजेनुसार नोंदणीकृत डॉक्टरांशी व्हॉइस कॉलसाठी संपर्क साधा.",
    startAudioCall: "डॉक्टरसोबत ऑडिओ कॉल सुरू करा",
    startVideoCall: "डॉक्टरसोबत व्हिडिओ कॉल सुरू करा"
  },
  "gu-IN": { 
    chatPlaceholder: "તમારો સંદેશ લખો...",
    sendButton: "મોકલો",
    listening: "સાંભળી રહ્યું છે...",
    speakNow: "હવે બોલો...",
    voiceError: "વૉઇસ ઇનપુટ ભૂલ. કૃપા કરીને ફરી પ્રયાસ કરો અથવા તમારો સંદેશ લખો.",
    voiceNotSupported: "તમારું બ્રાઉઝર વૉઇસ ઇનપુટને સમર્થન આપતું નથી.",
    autoPlaySpeech: "AI સ્પીચ ઓટો-પ્લે કરો",
    language: "ભાષા",
    aiAssistantTitle: "AI ચેટ સહાયક",
    aiAssistantDescription: "તમારા સ્વાસ્થ્ય પ્રશ્નોના ઝડપી જવાબો મેળવો.",
    aiAssistantInitialGreeting: "નમસ્તે! હું સ્માર્ટકેર AI સહાયક છું. આજે હું તમને કેવી રીતે મદદ કરી શકું?",
    verbalConsultationTitle: "મૌખિક પરામર્શ",
    verbalConsultationDescription: "તમારી જરૂરિયાતોને આધારે નોંધાયેલા ડોકટરો સાથે વૉઇસ કૉલ માટે કનેક્ટ થાઓ.",
    startAudioCall: "ડૉક્ટર સાથે ઑડિયો કૉલ શરૂ કરો",
    startVideoCall: "ડૉક્ટર સાથે વીડિયો કૉલ શરૂ કરો"
  },
  "ur-IN": { 
    chatPlaceholder: "اپنا پیغام ٹائپ کریں...",
    sendButton: "بھیجیں",
    listening: "سن رہا ہے۔..",
    speakNow: "اب بولیں...",
    voiceError: "وائس ان پٹ میں خرابی۔ براہ کرم دوبارہ کوشش کریں یا اپنا پیغام ٹائپ کریں۔",
    voiceNotSupported: "آپ کا براؤزر وائس ان پٹ کو سپورٹ نہیں کرتا۔",
    autoPlaySpeech: "AI تقریر خود بخود چلائیں",
    language: "زبان",
    aiAssistantTitle: "AI چیٹ اسسٹنٹ",
    aiAssistantDescription: "اپنے صحت کے سوالات کے فوری جوابات حاصل کریں۔",
    aiAssistantInitialGreeting: "سلام! میں اسمارٹ کیئر AI اسسٹنٹ ہوں۔ آج میں آپ کی کیسے مدد کر سکتا ہوں؟",
    verbalConsultationTitle: "زبانی مشاورت",
    verbalConsultationDescription: "اپنی ضروریات کی بنیاد پر رجسٹرڈ ڈاکٹروں کے ساتھ وائس کال کے لیے رابطہ کریں۔",
    startAudioCall: "ڈاکٹر کے ساتھ آڈیو کال شروع کریں",
    startVideoCall: "ڈاکٹر کے ساتھ ویڈیو کال شروع کریں"
  },
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
    const initialBotMessageKey = "aiAssistantInitialGreeting";
    const defaultGreeting = "Hello! I'm SmartCare AI Assistant. How can I help you today?";
    const initialBotMessage = currentTranslations[initialBotMessageKey] || 
                              (uiTranslations["en-US"][initialBotMessageKey] || defaultGreeting);
    
    setChatMessages([
      {
        id: String(Date.now()),
        text: initialBotMessage,
        sender: "bot",
        timestamp: new Date(),
      },
    ]);
  }, [selectedLanguage, currentTranslations]);
  
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
    
    const voices = window.speechSynthesis.getVoices();
    const targetVoice = voices.find(voice => voice.lang.startsWith(lang.split('-')[0])); 
    
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
      window.speechSynthesis.getVoices(); 
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
      language: selectedLanguage.split('-')[0], 
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
      const errorText = currentTranslations.voiceError || "Sorry, I couldn't connect to the AI assistant right now. Please try again later.";
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
      title: `${type === "video" ? "Video" : "Audio"} Consultation Initiated`,
      description: "Simulating connection to a registered doctor...",
    });
  };

  const endConsultation = () => {
    setIsConsultationActive(false);
    toast({
      title: "Consultation Ended",
      description: "Your simulated consultation has ended.",
    });
  };

  const handleVoiceInput = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = selectedLanguage; 
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
          <CardTitle className="text-2xl flex items-center gap-2">
           <Users className="h-7 w-7 text-primary" /> {currentTranslations.verbalConsultationTitle}
          </CardTitle>
          <CardDescription>{currentTranslations.verbalConsultationDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          {isConsultationActive ? (
            <div className="space-y-4">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <Image 
                  src="https://placehold.co/600x338.png" 
                  alt="Verbal consultation placeholder" 
                  width={600} 
                  height={338} 
                  className="rounded-lg object-cover"
                  data-ai-hint="audio call doctor" 
                />
              </div>
              <div className="flex justify-center gap-4">
                <Button variant="destructive" onClick={endConsultation}>
                  <Phone className="mr-2 h-5 w-5" /> End Call
                </Button>
              </div>
              <p className="text-center text-muted-foreground">You are currently in a simulated verbal consultation.</p>
            </div>
          ) : (
            <div className="space-y-4 text-center py-8">
              <p className="text-lg text-muted-foreground mb-6">Ready to connect with a registered doctor?</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button size="lg" onClick={() => startConsultation("audio")} className="flex-1">
                  <Phone className="mr-2 h-6 w-6" /> {currentTranslations.startAudioCall}
                </Button>
                <Button size="lg" variant="outline" onClick={() => startConsultation("video")} className="flex-1">
                  <Video className="mr-2 h-6 w-6" /> {currentTranslations.startVideoCall}
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
                placeholder={isListening ? currentTranslations.listening : currentTranslations.chatPlaceholder}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isChatLoading && handleSendMessage()}
                disabled={isChatLoading || isListening}
              />
              <Button onClick={handleVoiceInput} size="icon" variant="outline" aria-label="Use microphone" disabled={isListening || isChatLoading}>
                <Mic className={`h-5 w-5 ${isListening ? 'text-destructive animate-pulse' : ''}`} />
              </Button>
              <Button onClick={() => handleSendMessage()} size="icon" aria-label={currentTranslations.sendButton} disabled={isChatLoading || isListening || !chatInput.trim()}>
                {isChatLoading ? <Activity className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


