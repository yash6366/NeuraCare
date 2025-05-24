
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, type Doctor as DoctorUser } from "@/lib/auth";
import { getAssignedPatients } from "@/lib/actions/doctor.actions";
import type { Patient, MedicalRecordClientType } from "@/types";
import { getMedicalRecordsForPatientByDoctor } from "@/lib/actions/medical.actions"; // New import
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarDays, Users, Video, MessageSquarePlus, ArrowRight, FileText, Eye, Activity, BriefcaseMedical } from "lucide-react"; // Added FileText, Eye, Activity
import Link from "next/link";
import { Skeleton } from "../ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image"; // For image previews in dialog
import { format } from "date-fns"; // For formatting dates

export function DoctorDashboardClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [doctor, setDoctor] = useState<DoctorUser | null>(null);
  const [myPatients, setMyPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);

  const [selectedPatientRecords, setSelectedPatientRecords] = useState<MedicalRecordClientType[] | null>(null);
  const [isRecordsDialogOpen, setIsRecordsDialogOpen] = useState(false);
  const [isLoadingRecordsDialog, setIsLoadingRecordsDialog] = useState(false);
  const [selectedPatientForRecords, setSelectedPatientForRecords] = useState<Patient | null>(null);


  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'doctor') {
      router.replace('/login');
    } else {
      const currentDoctor = currentUser as DoctorUser;
      setDoctor(currentDoctor);
      setIsLoading(false);

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
          setMyPatients([]);
        }
        setIsLoadingPatients(false);
      };
      fetchPatients();
    }
  }, [router, toast]);

  const handleViewPatientRecords = async (patient: Patient) => {
    if (!doctor) return;
    setSelectedPatientForRecords(patient);
    setIsRecordsDialogOpen(true);
    setIsLoadingRecordsDialog(true);
    setSelectedPatientRecords(null);

    const records = await getMedicalRecordsForPatientByDoctor(patient.id, doctor.id);
    if (records) {
      setSelectedPatientRecords(records);
    } else {
      toast({
        title: "Error Fetching Records",
        description: `Could not load medical records for ${patient.name}.`,
        variant: "destructive",
      });
      setSelectedPatientRecords([]);
    }
    setIsLoadingRecordsDialog(false);
  };

  const handleViewRecordFile = (record: MedicalRecordClientType) => {
    // This logic is similar to MedicalRecordsClient
    if (record.filePreview) {
      if (record.type === "image") {
        const imageWindow = window.open("", "_blank");
        if (imageWindow) {
          imageWindow.document.write(`<html><head><title>${record.name}</title></head><body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background-color:#f0f0f0;"><img src="${record.filePreview}" style="max-width:100%; max-height:100vh;" alt="${record.name}"></body></html>`);
        } else { toast({ title: "Popup Blocked"}); }
      } else if (record.type === "pdf") {
        const pdfWindow = window.open("", "_blank");
        if (pdfWindow) {
          pdfWindow.document.write(`<html><head><title>${record.name}</title><style>body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; } iframe { border: none; width: 100%; height: 100%; }</style></head><body><iframe src="${record.filePreview}"></iframe></body></html>`);
        } else { toast({ title: "Popup Blocked"}); }
      } else {
         toast({ title: "Preview Not Supported"});
      }
    } else {
      toast({ title: "No Preview Available" });
    }
  };


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
    { title: "Start Telemedicine Chat", description: "Initiate text consultations.", href: "/telemedicine", icon: MessageSquarePlus },
    // { title: "Patient Messages", description: "Respond to patient inquiries.", href: "#", icon: MessageSquarePlus },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2"> {/* Adjusted grid cols for 2 features */}
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
          <CardDescription>Overview of your assigned patients. Click to view their medical records.</CardDescription>
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
                  <TableHead className="hidden md:table-cell">Contact</TableHead>
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
                    <TableCell className="hidden md:table-cell">{patient.emergencyContactPhone || "N/A"}</TableCell>
                    <TableCell className="text-right space-x-2">
                       <Button variant="outline" size="sm" onClick={() => router.push('/telemedicine')}>
                        <MessageSquarePlus className="mr-1 h-4 w-4" /> Chat
                      </Button>
                      <Button variant="default" size="sm" onClick={() => handleViewPatientRecords(patient)}>
                        <FileText className="mr-1 h-4 w-4" /> View Records
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">You currently have no patients assigned.</p>
          )}
        </CardContent>
      </Card>

      {selectedPatientForRecords && (
        <Dialog open={isRecordsDialogOpen} onOpenChange={setIsRecordsDialogOpen}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BriefcaseMedical className="h-6 w-6 text-primary" />
                Medical Records for {selectedPatientForRecords.name}
              </DialogTitle>
              <DialogDescription>
                Viewing records for {selectedPatientForRecords.email}.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] p-1">
              {isLoadingRecordsDialog ? (
                <div className="flex justify-center items-center py-10">
                  <Activity className="h-8 w-8 animate-spin text-primary" />
                   <p className="ml-2 text-muted-foreground">Loading records...</p>
                </div>
              ) : selectedPatientRecords && selectedPatientRecords.length > 0 ? (
                <ul className="space-y-3 py-2 pr-3">
                  {selectedPatientRecords.map(record => (
                    <li key={record.id} className="p-3 border rounded-md flex items-center justify-between gap-3 hover:shadow-sm">
                      <div className="flex items-center gap-2.5 flex-grow min-w-0">
                        {record.type === "image" && record.filePreview ? (
                          <Image src={record.filePreview} alt={record.name} width={40} height={40} className="rounded object-cover h-10 w-10" data-ai-hint="medical report"/>
                        ) : record.type === "pdf" ? (
                          <FileText className="h-8 w-8 text-red-500 flex-shrink-0" />
                        ) : (
                          <FileText className="h-8 w-8 text-gray-400 flex-shrink-0" />
                        )}
                        <div className="flex-grow min-w-0">
                          <p className="font-medium text-sm truncate" title={record.name}>{record.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {record.fileTypeDetail.toUpperCase()} - {(record.size / 1024).toFixed(1)} KB - {format(new Date(record.uploadedAt), "PPp")}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleViewRecordFile(record)} disabled={!record.filePreview && record.type !== 'other'}>
                        <Eye className="mr-1 h-4 w-4" /> View
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-center py-8">No medical records found for this patient.</p>
              )}
            </ScrollArea>
            <DialogFooter className="sm:justify-end">
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Close
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
