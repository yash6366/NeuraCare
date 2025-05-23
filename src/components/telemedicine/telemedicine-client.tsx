
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Video, Phone, Send, MessageCircle, Bot } from "lucide-react"; // Added Bot icon
import { useToast } from "@/hooks/use-toast";
import { telemedicineChat, type TelemedicineChatInput, type TelemedicineChatOutput } from "@/ai/flows/telemedicine-chat-flow"; // Import the new flow
import type { ChatHistoryItem } from "@/ai/flows/telemedicine-chat-flow"; // Assuming ChatMessageSchema structure for history

// Define message structure for client-side state
interface Message {
  id: string;
  text: string;
  sender: "user" | "bot"; // 'bot' will represent the AI model
  timestamp: Date;
}

// Define chat history item structure for sending to Genkit flow
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

  // Initialize chat with a welcome message from the AI
  useEffect(() => {
    setChatMessages([
      {
        id: String(Date.now()),
        text: "Hello! I'm SmartCare AI Assistant. How can I help you today?",
        sender: "bot",
        timestamp: new Date(),
      },
    ]);
  }, []);

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    setIsChatLoading(true);

    const newUserMessage: Message = {
      id: String(Date.now()),
      text: chatInput,
      sender: "user",
      timestamp: new Date(),
    };
    // Add user message to chat immediately for better UX
    setChatMessages(prev => [...prev, newUserMessage]);
    const currentInput = chatInput;
    setChatInput(""); // Clear input field

    // Prepare chat history for Genkit flow
    const historyForGenkit: GenkitChatMessage[] = chatMessages.map(msg => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    }));
    
    // Add the latest user message to the history being sent
    // (The welcome message from bot is already in chatMessages, so it's part of historyForGenkit)
    const inputForFlow: TelemedicineChatInput = {
      userMessage: currentInput,
      chatHistory: historyForGenkit,
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
    } catch (error) {
      console.error("Error calling telemedicine chat flow:", error);
      toast({
        title: "AI Chat Error",
        description: "Sorry, I couldn't connect to the AI assistant right now. Please try again later.",
        variant: "destructive",
      });
      // Optionally, add back the user's message to the input if sending failed
      // setChatInput(currentInput); 
      // Or add a system error message to the chat
       const errorBotMessage: Message = {
        id: String(Date.now() + 1),
        text: "I'm having trouble connecting right now. Please try again in a moment.",
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

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Video/Audio Consultation Section */}
      <Card className="lg:col-span-2 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Virtual Consultation</CardTitle>
          <CardDescription>Connect with doctors via video or audio call.</CardDescription>
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

      {/* Chatbot Section */}
      <Card className="lg:col-span-1 shadow-lg flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Bot className="h-7 w-7 text-primary" /> AI Chat Assistant
          </CardTitle>
          <CardDescription>Get quick answers to your health queries.</CardDescription>
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
                placeholder="Type your message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isChatLoading && handleSendMessage()}
                disabled={isChatLoading}
              />
              <Button onClick={handleSendMessage} size="icon" aria-label="Send message" disabled={isChatLoading}>
                {isChatLoading ? <Activity className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper type for clarity in client, matching Genkit flow's ChatMessageSchema expectation
export interface ChatHistoryItem {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}
