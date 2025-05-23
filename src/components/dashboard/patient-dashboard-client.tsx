
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, type Patient as PatientUser } from "@/lib/auth";
import { mockDoctors, type MockDoctorRecord } from "@/lib/mock-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HeartPulse, CalendarDays, Video, MapPin, Stethoscope, Phone, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "../ui/skeleton";

export function PatientDashboardClient() {
  const router = useRouter();
  const [patient, setPatient] = useState<PatientUser | null>(null);
  const [assignedDoctor, setAssignedDoctor] = useState<MockDoctorRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      }
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading || !patient) {
    return (
       <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <Skeleton className="h-40 w-full md:w-1/2" />
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
            <div className="sm:ml-auto flex flex-col gap-2 pt-4 sm:pt-0">
                <Button>Message Doctor (Simulated)</Button>
                <Button variant="outline">Request Appointment</Button>
            </div>
          </CardContent>
        </Card>
      )}
      {!assignedDoctor && (
         <Card className="shadow-lg">
            <CardHeader><CardTitle>No Assigned Doctor</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground">You do not have an assigned doctor. You can use the "Find Care" feature to search for one.</p></CardContent>
        </Card>
      )}
    </div>
  );
}
