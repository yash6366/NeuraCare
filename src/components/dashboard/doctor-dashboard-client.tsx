
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, type Doctor as DoctorUser } from "@/lib/auth";
import { getAssignedPatients } from "@/lib/actions/doctor.actions"; // Import the new server action
import type { Patient } from "@/types"; // Use the Patient type from DB
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarDays, Users, Video, MessageSquarePlus, ArrowRight, Mail } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "../ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export function DoctorDashboardClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [doctor, setDoctor] = useState<DoctorUser | null>(null);
  const [myPatients, setMyPatients] = useState<Patient[]>([]); // Changed from MockPatientRecord to Patient
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'doctor') {
      router.replace('/login');
    } else {
      const currentDoctor = currentUser as DoctorUser;
      setDoctor(currentDoctor);
      setIsLoading(false); // Doctor info loaded

      // Fetch assigned patients
      const fetchPatients = async () => {
        setIsLoadingPatients(true);
        const patientsData = await getAssignedPatients(currentDoctor.id);
        if (patientsData) {
          setMyPatients(patientsData);
        } else {
          toast({
            title: "Error fetching patients",
            description: "Could not load your patient list from the database.",
            variant: "destructive",
          });
          setMyPatients([]); // Set to empty array on error
        }
        setIsLoadingPatients(false);
      };

      fetchPatients();
    }
  }, [router, toast]);

  if (isLoading || !doctor) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const quickAccessFeatures = [
    { title: "My Appointments", description: "View and manage your schedule.", href: "/appointments", icon: CalendarDays },
    { title: "Start Telemedicine Call", description: "Initiate video/audio consultations.", href: "/telemedicine", icon: Video },
    { title: "Patient Messages", description: "Respond to patient inquiries.", href: "#", icon: MessageSquarePlus }, // Placeholder
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {quickAccessFeatures.map(feature => (
           <Card key={feature.title} className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">{feature.title}</CardTitle>
              <feature.icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
              <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
                <Link href={feature.href}>Access <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> My Patients ({myPatients.length})
          </CardTitle>
          <CardDescription>Overview of your assigned patients from the database.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingPatients ? (
            <div className="flex justify-center items-center py-8">
              <Skeleton className="h-10 w-1/2" />
            </div>
          ) : myPatients.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="hidden md:table-cell">Date of Birth</TableHead>
                  <TableHead className="hidden md:table-cell">Last Visit</TableHead>
                  <TableHead>Upcoming Appointment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                       <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://placehold.co/40x40.png?text=${patient.name.charAt(0)}`} alt={patient.name} data-ai-hint="person silhouette" />
                        <AvatarFallback>{patient.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      {patient.name}
                    </TableCell>
                    <TableCell>{patient.email}</TableCell>
                    <TableCell className="hidden md:table-cell">N/A</TableCell> {/* Placeholder for now */}
                    <TableCell className="hidden md:table-cell">N/A</TableCell> {/* Placeholder for now */}
                    <TableCell>
                      {/* Placeholder for upcoming appointment - this data isn't in Patient model yet */}
                      <Badge variant="secondary">N/A</Badge> 
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">View Details</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">You currently have no patients assigned in the database.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
