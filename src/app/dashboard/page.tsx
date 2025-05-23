
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { PageTitle } from "@/components/page-title";
import { FeatureCard } from "@/components/dashboard/feature-card";
import { getCurrentUser, type AppUser, type Doctor, type Patient } from "@/lib/auth"; // Adjusted imports
import { getAllUsers } from "@/lib/actions/admin.actions"; // New server action
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  HeartPulse,
  CalendarDays,
  Video,
  Users,
  BriefcaseMedical, // For Doctors list
  UserCog, // For Patients list
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";


const adminFeatures = [
  {
    title: "Symptom Checker Insights",
    description: "View analytics from the symptom checker.",
    href: "/symptom-checker",
    icon: HeartPulse,
  },
  {
    title: "Appointment System Overview",
    description: "Monitor overall appointment statistics.",
    href: "/appointments",
    icon: CalendarDays,
  },
  {
    title: "Telemedicine Platform Status",
    description: "Check the status of telemedicine services.",
    href: "/telemedicine",
    icon: Video,
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.replace("/login");
    } else {
      setUser(currentUser);
      if (currentUser.role && currentUser.role === "doctor") {
        router.replace("/dashboard/doctor");
      } else if (currentUser.role && currentUser.role === "patient") {
        router.replace("/dashboard/patient");
      } else if (currentUser.role && currentUser.role === "admin") {
        // Admin stays here, fetch all users
        const fetchUsers = async () => {
          setIsLoadingUsers(true);
          const usersData = await getAllUsers();
          if (usersData) {
            setAllUsers(usersData);
          } else {
            toast({
              title: "Error fetching users",
              description: "Could not load the user list from the database.",
              variant: "destructive",
            });
            setAllUsers([]);
          }
          setIsLoadingUsers(false);
        };
        fetchUsers();
        setLoading(false);
      } else {
        // Other unexpected roles, also redirect or handle
        console.warn("Unexpected user role or missing role:", currentUser?.role);
        router.replace("/login"); 
      }
    }
  }, [router, toast]);

  if (loading || !user || (user.role !== 'admin')) {
    return (
      <MainLayout>
        <div className="space-y-4 p-4">
          <Skeleton className="h-12 w-1/2" />
          <Skeleton className="h-8 w-3/4" />
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
          <Skeleton className="h-64 w-full mt-6" />
          <Skeleton className="h-64 w-full mt-6" />
        </div>
      </MainLayout>
    );
  }

  const doctors = allUsers.filter(u => u.role === 'doctor') as Doctor[];
  const patients = allUsers.filter(u => u.role === 'patient') as Patient[];
  
  const doctorNameMap = doctors.reduce((acc, doctor) => {
    acc[doctor.id] = doctor.name;
    return acc;
  }, {} as Record<string, string>);


  return (
    <MainLayout>
      <PageTitle 
        title="Admin Dashboard - SmartCare Hub" 
        description="System overview and management tools."
        icon={LayoutDashboard}
      />
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {adminFeatures.map((feature) => (
          <FeatureCard
            key={feature.title}
            title={feature.title}
            description={feature.description}
            href={feature.href}
            icon={feature.icon}
          />
        ))}
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BriefcaseMedical className="h-6 w-6 text-primary" /> Doctors ({doctors.length})</CardTitle>
            <CardDescription>List of all registered doctors.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingUsers ? <Skeleton className="h-20 w-full" /> : doctors.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Specialty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {doctors.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                         <Avatar className="h-8 w-8">
                           <AvatarImage src={`https://placehold.co/40x40.png?text=${doc.name.charAt(0)}`} alt={doc.name} data-ai-hint="doctor professional" />
                           <AvatarFallback>{doc.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                         </Avatar>
                        {doc.name}
                      </TableCell>
                      <TableCell>{doc.email}</TableCell>
                      <TableCell><Badge variant="secondary">{doc.specialty || 'N/A'}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : <p className="text-muted-foreground text-center py-4">No doctors registered yet.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserCog className="h-6 w-6 text-primary" /> Patients ({patients.length})</CardTitle>
            <CardDescription>List of all registered patients.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingUsers ? <Skeleton className="h-20 w-full" /> : patients.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Assigned Doctor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((pat) => (
                    <TableRow key={pat.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                         <Avatar className="h-8 w-8">
                           <AvatarImage src={`https://placehold.co/40x40.png?text=${pat.name.charAt(0)}`} alt={pat.name} data-ai-hint="person silhouette" />
                           <AvatarFallback>{pat.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                         </Avatar>
                        {pat.name}
                      </TableCell>
                      <TableCell>{pat.email}</TableCell>
                      <TableCell>
                        {pat.assignedDoctorId ? (doctorNameMap[pat.assignedDoctorId] || <Badge variant="outline">ID: {pat.assignedDoctorId.substring(0,8)}...</Badge>) : <Badge variant="outline">Unassigned</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : <p className="text-muted-foreground text-center py-4">No patients registered yet.</p>}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
