
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Video, Phone, Send, Bot, Mic, Volume2, VolumeX, Activity, Users, Languages } from "lucide-react";
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
    startVideoCall: "Start Video Call with a Doctor",
    dwaniSTTInfo: "Using browser STT. (Dwani AI STT would be used here for regional languages)",
    dwaniTranslateInfo: "Input (if regional) would be translated to English here by Dwani AI for core processing."
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
    startVideoCall: "डॉक्टर के साथ वीडियो कॉल शुरू करें",
    dwaniSTTInfo: "ब्राउज़र STT का उपयोग किया जा रहा है। (क्षेत्रीय भाषाओं के लिए यहां द्वानी एआई STT का उपयोग किया जाएगा)",
    dwaniTranslateInfo: "इनपुट (यदि क्षेत्रीय हो) को कोर प्रोसेसिंग के लिए द्वानी एआई द्वारा यहां अंग्रेजी में अनुवादित किया जाएगा।"
  },
  // Add other language translations similarly, falling back to English if not provided
  "kn-IN": { chatPlaceholder: "ನಿಮ್ಮ ಸಂದೇಶವನ್ನು ಟೈಪ್ ಮಾಡಿ...", sendButton: "ಕಳುಹಿಸು", listening: "ಕೇಳುತ್ತಿದೆ...", speakNow: "ಈಗ ಮಾತನಾಡಿ...", voiceError: "ಧ್ವನಿ ಇನ್ಪುಟ್ ದೋಷ.", autoPlaySpeech: "AI ಭಾಷಣವನ್ನು ಸ್ವಯಂ-ಪ್ಲೇ ಮಾಡಿ", language: "ಭಾಷೆ", aiAssistantTitle: "AI ಚಾಟ್ ಸಹಾಯಕ", aiAssistantDescription: "ನಿಮ್ಮ ಆರೋಗ್ಯ ಪ್ರಶ್ನೆಗಳಿಗೆ ತ್ವರಿತ ಉತ್ತರಗಳನ್ನು ಪಡೆಯಿರಿ.", aiAssistantInitialGreeting: "ನಮಸ್ಕಾರ! ನಾನು ಸ್ಮಾರ್ಟ್‌ಕೇರ್ AI ಸಹಾಯಕ.", verbalConsultationTitle: "ಮೌಖಿಕ ಸಮಾಲೋಚನೆ", startAudioCall: "ವೈದ್ಯರೊಂದಿಗೆ ಆಡಿಯೋ ಕರೆ ಪ್ರಾರಂಭಿಸಿ", startVideoCall: "ವೈದ್ಯರೊಂದಿಗೆ ವೀಡಿಯೊ ಕರೆ ಪ್ರಾರಂಭಿಸಿ", dwaniSTTInfo: "ಬ್ರೌಸರ್ STT ಬಳಸಲಾಗುತ್ತಿದೆ. (ಪ್ರಾದೇಶಿಕ ಭಾಷೆಗಳಿಗಾಗಿ ದ್ವನಿ AI STT ಇಲ್ಲಿ ಬಳಸಲ್ಪಡುತ್ತದೆ)", dwaniTranslateInfo: "ಇನ್‌ಪುಟ್ (ಪ್ರಾದೇಶಿಕವಾಗಿದ್ದರೆ) ದ್ವನಿ AI ನಿಂದ ಇಲ್ಲಿ ಇಂಗ್ಲಿಷ್‌ಗೆ ಅನುವಾದಿಸಲಾಗುತ್ತದೆ." },
  "te-IN": { chatPlaceholder: "మీ సందేశాన్ని టైప్ చేయండి...", sendButton: "పంపు", listening: "వినడం...", speakNow: "ఇప్పుడు మాట్లాడండి...", voiceError: "వాయిస్ ఇన్‌పుట్ లోపం.", autoPlaySpeech: "AI ప్రసంగాన్ని ఆటో-ప్లే చేయండి", language: "భాష", aiAssistantTitle: "AI చాట్ అసిస్టెంట్", aiAssistantDescription: "మీ ఆరోగ్య ప్రశ్నలకు త్వరిత సమాధానాలను పొందండి.", aiAssistantInitialGreeting: "నమస్కారం! నేను స్మార్ట్‌కేర్ AI అసిస్టెంట్.", verbalConsultationTitle: "మౌఖిక సంప్రదింపులు", startAudioCall: "డాక్టర్‌తో ఆడియో కాల్ ప్రారంభించండి", startVideoCall: "డాక్టర్‌తో వీడియో కాల్ ప్రారంభించండి", dwaniSTTInfo: "బ్రౌజర్ STT ఉపయోగించబడుతోంది. (ప్రాంతీయ భాషల కోసం ద్వాని AI STT ఇక్కడ ఉపయోగించబడుతుంది)", dwaniTranslateInfo: "ఇన్‌పుట్ (ప్రాంతీయంగా ఉంటే) ఇక్కడ ద్వాని AI ద్వారా ఆంగ్లంలోకి అనువదించబడుతుంది." },
  "ta-IN": { chatPlaceholder: "உங்கள் செய்தியைத் தட்டச்சு செய்க...", sendButton: "அனுப்பு", listening: "கேட்கிறது...", speakNow: "இப்போது பேசுங்கள்...", voiceError: "குரல் உள்ளீட்டுப் பிழை.", autoPlaySpeech: "AI பேச்சைத் தானாக இயக்கு", language: "மொழி", aiAssistantTitle: "AI அரட்டை உதவியாளர்", aiAssistantDescription: "உங்கள் சுகாதார வினவல்களுக்கு விரைவான பதில்களைப் பெறுங்கள்.", aiAssistantInitialGreeting: "வணக்கம்! நான் ஸ்மார்ட்கேர் AI உதவியாளர்.", verbalConsultationTitle: "வாய்மொழி ஆலோசனை", startAudioCall: "மருத்துவருடன் ஆடியோ அழைப்பைத் தொடங்குங்கள்", startVideoCall: "மருத்துவருடன் வீடியோ அழைப்பைத் தொடங்குங்கள்", dwaniSTTInfo: "உலாவி STT பயன்படுத்தப்படுகிறது. (பிராந்திய மொழிகளுக்கு துவனி AI STT இங்கே பயன்படுத்தப்படும்)", dwaniTranslateInfo: "உள்ளீடு (பிராந்தியமாக இருந்தால்) துவனி AI மூலம் ஆங்கிலத்திற்கு இங்கே மொழிபெயர்க்கப்படும்." },
  "bn-IN": { chatPlaceholder: "আপনার বার্তা টাইপ করুন...", sendButton: "পাঠান", listening: "শুনছে...", speakNow: "এখন কথা বলুন...", voiceError: "ভয়েস ইনপুট ত্রুটি।", autoPlaySpeech: "এআই স্পিচ অটো-প্লে করুন", language: "ভাষা", aiAssistantTitle: "এআই চ্যাট সহকারী", aiAssistantDescription: "আপনার স্বাস্থ্য প্রশ্নের দ্রুত উত্তর পান।", aiAssistantInitialGreeting: "নমস্কার! আমি স্মার্টকেয়ার এআই সহকারী।", verbalConsultationTitle: "মৌখিক পরামর্শ", startAudioCall: "ডাক্তারের সাথে অডিও কল শুরু করুন", startVideoCall: "ডাক্তারের সাথে ভিডিও কল শুরু করুন", dwaniSTTInfo: "ব্রাউজার এসটিটি ব্যবহার করা হচ্ছে। (আঞ্চলিক ভাষার জন্য এখানে ধ্বনি এআই এসটিটি ব্যবহার করা হবে)", dwaniTranslateInfo: "ইনপুট (যদি আঞ্চলিক হয়) মূল প্রক্রিয়াকরণের জন্য ধ্বনি এআই দ্বারা এখানে ইংরেজিতে অনুবাদ করা হবে।" },
  "mr-IN": { chatPlaceholder: "तुमचा संदेश टाइप करा...", sendButton: "पाठवा", listening: "ऐकत आहे...", speakNow: "आता बोला...", voiceError: "व्हॉइस इनपुट त्रुटी.", autoPlaySpeech: "एआय स्पीच ऑटो-प्ले करा", language: "भाषा", aiAssistantTitle: "एआय चॅट असिस्टंट", aiAssistantDescription: "तुमच्या आरोग्यविषयक प्रश्नांची त्वरित उत्तरे मिळवा.", aiAssistantInitialGreeting: "नमस्कार! मी स्मार्टकेअर एआय असिस्टंट आहे.", verbalConsultationTitle: "तोंडी सल्लामसलत", startAudioCall: "डॉक्टरसोबत ऑडिओ कॉल सुरू करा", startVideoCall: "डॉक्टरसोबत व्हिडिओ कॉल सुरू करा", dwaniSTTInfo: "ब्राउझर एसटीटी वापरले जात आहे. (प्रादेशिक भाषांसाठी ध्वनी एआय एसटीटी येथे वापरला जाईल)", dwaniTranslateInfo: "इनपुट (प्रादेशिक असल्यास) कोर प्रक्रियेसाठी ध्वनी एआयद्वारे येथे इंग्रजीमध्ये अनुवादित केले जाईल." },
  "gu-IN": { chatPlaceholder: "તમારો સંદેશ લખો...", sendButton: "મોકલો", listening: "સાંભળી રહ્યું છે...", speakNow: "હવે બોલો...", voiceError: "વૉઇસ ઇનપુટ ભૂલ.", autoPlaySpeech: "AI સ્પીચ ઓટો-પ્લે કરો", language: "ભાષા", aiAssistantTitle: "AI ચેટ સહાયક", aiAssistantDescription: "તમારા સ્વાસ્થ્ય પ્રશ્નોના ઝડપી જવાબો મેળવો.", aiAssistantInitialGreeting: "નમસ્તે! હું સ્માર્ટકેર AI સહાયક છું.", verbalConsultationTitle: "મૌખિક પરામર્શ", startAudioCall: "ડૉક્ટર સાથે ઑડિયો કૉલ શરૂ કરો", startVideoCall: "ડૉક્ટર સાથે વીડિયો કૉલ શરૂ કરો", dwaniSTTInfo: "બ્રાઉઝર STT નો ઉપયોગ કરી રહ્યું છે. (પ્રાદેશિક ભાષાઓ માટે અહીં દ્વાની AI STT નો ઉપયોગ કરવામાં આવશે)", dwaniTranslateInfo: "ઇનપુટ (જો પ્રાદેશિક હોય તો) મુખ્ય પ્રક્રિયા માટે દ્વાની AI દ્વારા અહીં અંગ્રેજીમાં અનુવાદિત કરવામાં આવશે." },
  "ur-IN": { chatPlaceholder: "اپنا پیغام ٹائپ کریں...", sendButton: "بھیجیں", listening: "سن رہا ہے۔..", speakNow: "اب بولیں...", voiceError: "وائس ان پٹ میں خرابی۔", autoPlaySpeech: "AI تقریر خود بخود چلائیں", language: "زبان", aiAssistantTitle: "AI چیٹ اسسٹنٹ", aiAssistantDescription: "اپنے صحت کے سوالات کے فوری جوابات حاصل کریں۔", aiAssistantInitialGreeting: "سلام! میں اسمار্ট کیئر AI اسسٹنٹ ہوں۔", verbalConsultationTitle: "زبانی مشاورت", startAudioCall: "ڈاکٹر کے ساتھ آڈیو کال شروع کریں", startVideoCall: "ڈاکٹر کے ساتھ ویڈیو کال شروع کریں", dwaniSTTInfo: "براؤزر ایس ٹی ٹی استعمال کیا جا رہا ہے۔ (علاقائی زبانوں کے لیے یہاں ڈوانی اے آئی ایس ٹی ٹی استعمال کیا جائے گا)", dwaniTranslateInfo: "ان پٹ (اگر علاقائی ہو) کو بنیادی پروسیسنگ کے لیے ڈوانی اے آئی کے ذریعے یہاں انگریزی میں ترجمہ کیا جائے گا۔" },
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
    const initialBotMessageText = currentTranslations[initialBotMessageKey] || 
                              (uiTranslations["en-US"][initialBotMessageKey] || defaultGreeting);
    
    const initialBotMessage: Message = {
      id: String(Date.now()),
      text: initialBotMessageText,
      sender: "bot",
      timestamp: new Date(),
    };
    setChatMessages([initialBotMessage]);

    // Play initial greeting if autoPlay is on
    if (autoPlayBotSpeech) {
        playTextAsSpeech(initialBotMessageText, selectedLanguage);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLanguage]); // Removed currentTranslations and autoPlayBotSpeech to avoid re-triggering on toggle
  
  useEffect(() => {
    // Initialize SpeechRecognition
    // This would be where Dwani AI STT integration would happen for regional languages.
    // For now, we use Web Speech API.
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = selectedLanguage;

      recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
        let transcribedText = event.results[0][0].transcript;
        console.log(currentTranslations.dwaniSTTInfo, "Transcribed text:", transcribedText);
        
        // Simulate Dwani AI translation to English for internal processing
        if (selectedLanguage !== "en-US") {
            console.log(currentTranslations.dwaniTranslateInfo, "Original (regional):", transcribedText);
            // In a real Dwani AI integration, you'd call its translation API here.
            // e.g., const englishText = await dwaniTranslateToEnglish(transcribedText);
            // For this simulation, we'll just log it. The AI flow will still receive the regional text.
        }
        
        setChatInput(transcribedText);
        setIsListening(false);
        // Automatically send message after voice input
        handleSendMessage(transcribedText); 
      };
      recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error", event.error);
        toast({ title: currentTranslations.voiceError, description: event.error, variant: "destructive" });
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
      window.speechSynthesis?.cancel(); // Stop any speech on component unmount or language change
    };
  }, [selectedLanguage, toast, currentTranslations]);

  const playTextAsSpeech = (text: string, lang: string) => {
    if (!autoPlayBotSpeech || typeof window === 'undefined' || !window.speechSynthesis) return;

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Attempt to find a voice that matches the full language code (e.g., 'hi-IN')
    let targetVoice = window.speechSynthesis.getVoices().find(voice => voice.lang === lang);
    
    // If not found, try matching just the language part (e.g., 'hi')
    if (!targetVoice) {
      targetVoice = window.speechSynthesis.getVoices().find(voice => voice.lang.startsWith(lang.split('-')[0]));
    }
        
    if (targetVoice) {
      utterance.voice = targetVoice;
    } else {
       // Fallback to setting utterance.lang if no specific voice is found
       // This lets the browser pick a default voice for that language if available
       utterance.lang = lang;
    }
    
    window.speechSynthesis.cancel(); 
    window.speechSynthesis.speak(utterance);
  };
  
  useEffect(() => {
    // Ensure voices are loaded
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => {
        // Voices loaded, good to go.
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

    // Simulate Dwani AI internal translation step if input was regional and not English
    let textForAI = currentMessage;
    if (selectedLanguage !== "en-US") {
        console.log(currentTranslations.dwaniTranslateInfo, "Original (regional) for AI:", currentMessage);
        // For this demo, textForAI remains currentMessage.
        // In a real Dwani integration: textForAI = await dwaniTranslateToEnglish(currentMessage);
        // And the AI flow would be designed to expect English.
    }
    
    const historyForGenkit: GenkitChatMessage[] = chatMessages.map(msg => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    }));
    
    const inputForFlow: TelemedicineChatInput = {
      userMessage: textForAI, // This would be the translated English text in a full Dwani integration
      chatHistory: historyForGenkit,
      language: selectedLanguage.split('-')[0], // Gemini is asked to respond in the user's selected language
    };

    try {
      const aiResponse: TelemedicineChatOutput = await telemedicineChat(inputForFlow);
      const newBotMessage: Message = {
        id: String(Date.now() + 1),
        text: aiResponse.botResponse, // This response is already in the user's selected language
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
         toast({ title: "Voice Error", description: (e as Error).message || currentTranslations.voiceError, variant: "destructive" });
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
              <Label htmlFor="language-select" className="flex items-center gap-1">
                <Languages className="h-4 w-4"/>
                {currentTranslations.language}
              </Label>
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
