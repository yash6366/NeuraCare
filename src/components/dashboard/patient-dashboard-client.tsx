
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, type Patient as PatientUser } from "@/lib/auth";
import { mockDoctors, type MockDoctorRecord } from "@/lib/mock-data"; // Keep for doctor info if needed, or fetch from DB
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HeartPulse, CalendarDays, Video, MapPin, Stethoscope, Phone, Mail, ArrowRight, MessageSquare, Send, Bot } from "lucide-react"; // Added Bot
import Link from "next/link";
import { Skeleton } from "../ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context"; // Added

interface ChatMessage {
  id: string;
  text: string;
  sender: "patient" | "doctor";
  timestamp: Date;
}

export function PatientDashboardClient() {
  const router = useRouter();
  const { toast } = useToast();
  const { translate } = useLanguage(); // Added
  const [patient, setPatient] = useState<PatientUser | null>(null);
  const [assignedDoctor, setAssignedDoctor] = useState<MockDoctorRecord | null>(null); // Consider fetching doctor details from DB
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
        // In a real app, fetch doctor details by ID from the database
        const doctor = mockDoctors.find(d => d.id === currentPatient.assignedDoctorId) || null;
        setAssignedDoctor(doctor);
        if (doctor) {
          setDoctorChatMessages([
            {
              id: String(Date.now()),
              text: `Hello ${currentPatient.name}, I'm Dr. ${doctor.name.split(' ').pop()}. How can I help you today? (This chat is simulated)`,
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

    setTimeout(() => {
      const replyText = `Thanks for your message, ${patient.name}. I've received it. (Simulated reply from Dr. ${assignedDoctor.name.split(' ').pop()})`;
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
    { titleKey: "symptomChecker.title", descriptionKey: "symptomChecker.description", href: "/symptom-checker", icon: HeartPulse },
    { titleKey: "aiChatAssistant.title", descriptionKey: "aiChatAssistant.descriptionShort", href: "/ai-chat-assistant", icon: Bot }, // Added AI Chat Assistant
    { titleKey: "appointments.title", descriptionKey: "appointments.description", href: "/appointments", icon: CalendarDays },
    { titleKey: "telemedicine.title", descriptionKey: "telemedicine.description", href: "/telemedicine", icon: Video }, // Consider renaming if Telemedicine page is now just Doctor Chat
    { titleKey: "findCare.title", descriptionKey: "findCare.description", href: "/find-care", icon: MapPin },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"> {/* Adjusted for more cards */}
        {patientFeatures.map((feature) => (
          <Card key={feature.titleKey} className="shadow-md hover:shadow-lg transition-shadow flex flex-col">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                 <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">{translate(feature.titleKey)}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground">{translate(feature.descriptionKey)}</p>
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
                {translate('patientDashboard.yourDoctorTitle', 'Your Assigned Doctor')}
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
                  <Button onClick={() => router.push('/telemedicine')}>
                    {translate('patientDashboard.messageDoctorButton', 'Message Doctor')}
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/appointments')}>{translate('patientDashboard.requestAppointmentButton', 'Request Appointment')}</Button>
              </CardFooter>
          </Card>
        )}
        {!assignedDoctor && (
           <Card className="shadow-lg md:col-span-1">
              <CardHeader><CardTitle>{translate('patientDashboard.noDoctorTitle', 'No Assigned Doctor')}</CardTitle></CardHeader>
              <CardContent><p className="text-muted-foreground">{translate('patientDashboard.noDoctorDescription', 'You do not have an assigned doctor. You can use the "Find Care" feature to search for one.')}</p></CardContent>
          </Card>
        )}

        {/* The direct chat with doctor from this dashboard is now moved to the Telemedicine page */}
        {/* If you want a quick link to Telemedicine chat, it's handled by the feature card above */}

      </div>
    </div>
  );
}
