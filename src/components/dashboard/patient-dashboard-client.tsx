
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, type Patient as PatientUser } from "@/lib/auth";
import { mockDoctors, type MockDoctorRecord } from "@/lib/mock-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HeartPulse, CalendarDays, Video, MapPin, Stethoscope, Phone, Mail, ArrowRight, MessageSquare, Send } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "../ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  text: string;
  sender: "patient" | "doctor";
  timestamp: Date;
}

export function PatientDashboardClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [patient, setPatient] = useState<PatientUser | null>(null);
  const [assignedDoctor, setAssignedDoctor] = useState<MockDoctorRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [doctorChatMessages, setDoctorChatMessages] = useState<ChatMessage[]>([]);
  const [doctorChatInput, setDoctorChatInput] = useState("");

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'patient') {
      router.replace('/login');
    } else {
      const currentPatient = currentUser as PatientUser;
      setPatient(currentPatient);
      if (currentPatient.assignedDoctorId) {
        const doctor = mockDoctors.find(d => d.id === currentPatient.assignedDoctorId) || null;
        setAssignedDoctor(doctor);
        if (doctor) {
          // Initialize with a welcome message from the doctor
          setDoctorChatMessages([
            {
              id: String(Date.now()),
              text: `Hello ${currentPatient.name}, I'm Dr. ${doctor.name.split(' ').pop()}. How can I help you today?`,
              sender: "doctor",
              timestamp: new Date(),
            }
          ]);
        }
      }
      setIsLoading(false);
    }
  }, [router]);

  const handleSendDoctorMessage = () => {
    if (!doctorChatInput.trim() || !assignedDoctor || !patient) return;
    const newMessage: ChatMessage = {
      id: String(Date.now()),
      text: doctorChatInput,
      sender: "patient",
      timestamp: new Date(),
    };
    setDoctorChatMessages(prev => [...prev, newMessage]);
    setDoctorChatInput("");

    // Simulate doctor's reply
    setTimeout(() => {
      const replyText = `Thanks for your message, ${patient.name}. I've received it and will get back to you as soon as possible. If this is urgent, please call the clinic. (Simulated reply from Dr. ${assignedDoctor.name.split(' ').pop()})`;
      const botResponse: ChatMessage = {
        id: String(Date.now() + 1),
        text: replyText,
        sender: "doctor",
        timestamp: new Date(),
      };
      setDoctorChatMessages(prev => [...prev, botResponse]);
    }, 1500);
  };


  if (isLoading || !patient) {
    return (
       <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <Skeleton className="h-40 w-full md:w-1/2" />
        <Skeleton className="h-64 w-full md:w-1/2" />
      </div>
    );
  }
  
  const patientFeatures = [
    { title: "Symptom Checker", description: "Get AI insights on your symptoms.", href: "/symptom-checker", icon: HeartPulse },
    { title: "My Appointments", description: "Manage your scheduled visits.", href: "/appointments", icon: CalendarDays },
    { title: "Telemedicine", description: "Connect for remote consultations.", href: "/telemedicine", icon: Video },
    { title: "Find Care", description: "Discover nearby healthcare options.", href: "/find-care", icon: MapPin },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {patientFeatures.map((feature) => (
          <Card key={feature.title} className="shadow-md hover:shadow-lg transition-shadow flex flex-col">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                 <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link href={feature.href}>Access <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {assignedDoctor && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-7 w-7 text-primary" />
                Your Assigned Doctor
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row items-center gap-6">
              <Avatar className="h-24 w-24 border-4 border-primary">
                <AvatarImage src={`https://placehold.co/100x100.png?text=${assignedDoctor.name.charAt(0)}`} alt={assignedDoctor.name} data-ai-hint="doctor professional" />
                <AvatarFallback>{assignedDoctor.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="space-y-2 text-center sm:text-left">
                <h3 className="text-2xl font-semibold">{assignedDoctor.name}</h3>
                <p className="text-primary font-medium">{assignedDoctor.specialty}</p>
                <div className="flex items-center gap-2 text-muted-foreground justify-center sm:justify-start">
                  <Mail className="h-4 w-4" />
                  <span>{assignedDoctor.email}</span>
                </div>
                {assignedDoctor.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground justify-center sm:justify-start">
                    <Phone className="h-4 w-4" />
                    <span>{assignedDoctor.phone}</span>
                  </div>
                )}
              </div>
            </CardContent>
             <CardFooter className="flex flex-col sm:flex-row gap-2 pt-4 sm:pt-0 justify-end">
                  <Button onClick={() => toast({ title: "Feature Info", description: "Use the chat below to message your doctor."})}>
                    Message Doctor
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/appointments')}>Request Appointment</Button>
              </CardFooter>
          </Card>
        )}
        {!assignedDoctor && (
           <Card className="shadow-lg md:col-span-1">
              <CardHeader><CardTitle>No Assigned Doctor</CardTitle></CardHeader>
              <CardContent><p className="text-muted-foreground">You do not have an assigned doctor. You can use the "Find Care" feature to search for one.</p></CardContent>
          </Card>
        )}

        {assignedDoctor && patient && (
          <Card className="shadow-lg flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-7 w-7 text-primary" />
                Chat with Dr. {assignedDoctor.name.split(' ').pop()}
              </CardTitle>
              <CardDescription>Send a message to your doctor. (Simulated)</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col p-0">
              <ScrollArea className="h-72 flex-grow p-4">
                <div className="space-y-4">
                  {doctorChatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2 ${
                        msg.sender === "patient" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {msg.sender === "doctor" && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://placehold.co/40x40.png?text=${assignedDoctor.name.charAt(0)}`} alt={assignedDoctor.name} data-ai-hint="doctor face" />
                          <AvatarFallback>{assignedDoctor.name.substring(0,1).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`max-w-[75%] rounded-lg px-3 py-2 text-sm shadow-md ${
                          msg.sender === "patient"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {msg.text}
                      </div>
                      {msg.sender === "patient" && (
                         <Avatar className="h-8 w-8">
                           <AvatarImage src={`https://placehold.co/40x40.png?text=${patient.name.charAt(0)}`} alt={patient.name} data-ai-hint="user silhouette" />
                           <AvatarFallback>{patient.name.substring(0,1).toUpperCase()}</AvatarFallback>
                         </Avatar>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="p-4 border-t bg-background/80">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={doctorChatInput}
                    onChange={(e) => setDoctorChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendDoctorMessage()}
                  />
                  <Button onClick={handleSendDoctorMessage} size="icon" aria-label="Send message">
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
