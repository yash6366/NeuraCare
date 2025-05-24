
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, type Doctor as DoctorUser } from "@/lib/auth";
import { getAssignedPatients } from "@/lib/actions/doctor.actions";
import type { Patient, MedicalRecordClientType } from "@/types";
import { getMedicalRecordsForPatientByDoctor } from "@/lib/actions/medical.actions";
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
import { CalendarDays, Users, Video, MessageSquarePlus, ArrowRight, FileText, Eye, Activity, BriefcaseMedical, Notebook, Clock, ListTodo } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "../ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { format, addDays, addWeeks, addHours } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/language-context";

interface SimulatedAppointmentForDoctor {
  id: string;
  patientName: string;
  appointmentType: string;
  dateTime: Date;
  status: "Confirmed" | "Pending";
}

export function DoctorDashboardClient() {
  const router = useRouter();
  const { toast } = useToast();
  const { translate } = useLanguage();
  const [doctor, setDoctor] = useState<DoctorUser | null>(null);
  const [myPatients, setMyPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);

  const [selectedPatientRecords, setSelectedPatientRecords] = useState<MedicalRecordClientType[] | null>(null);
  const [simulatedAppointments, setSimulatedAppointments] = useState<SimulatedAppointmentForDoctor[]>([]);
  const [doctorNotes, setDoctorNotes] = useState("");
  const [isPatientDetailsDialogOpen, setIsPatientDetailsDialogOpen] = useState(false);
  const [isLoadingPatientDetails, setIsLoadingPatientDetails] = useState(false);
  const [selectedPatientForDetails, setSelectedPatientForDetails] = useState<Patient | null>(null);
  
  const [myUpcomingAppointments, setMyUpcomingAppointments] = useState<SimulatedAppointmentForDoctor[]>([]);

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
            title: translate('doctorDashboard.toast.errorFetchingPatients.title', "Error fetching patients"),
            description: translate('doctorDashboard.toast.errorFetchingPatients.description', "Could not load your patient list from the database."),
            variant: "destructive",
          });
          setMyPatients([]);
        }
        setIsLoadingPatients(false);
      };
      fetchPatients();

      // Simulate fetching doctor's appointments
      // In a real app, this would be an API call to fetch appointments for currentDoctor.id
      const now = new Date();
      const simulatedDoctorAppointments: SimulatedAppointmentForDoctor[] = [
        { id: 'docAppt1', patientName: 'Alice Smith', appointmentType: translate('appointments.mock.generalCheckup', "General Checkup"), dateTime: addHours(addDays(now, 1), 2), status: 'Confirmed' },
        { id: 'docAppt2', patientName: 'Bob Johnson', appointmentType: translate('appointments.mock.dentalCleaning', "Dental Cleaning"), dateTime: addHours(addDays(now, 2), 4), status: 'Pending' },
        { id: 'docAppt3', patientName: 'Carol Williams', appointmentType: translate('appointments.mock.cardiology', "Cardiology Consultation"), dateTime: addHours(addDays(now, 3), 1), status: 'Confirmed' },
      ];
      setMyUpcomingAppointments(simulatedDoctorAppointments);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, toast, translate]);

  const generateSimulatedAppointmentsForPatientDialog = (patientName: string): SimulatedAppointmentForDoctor[] => {
    const now = new Date();
    return [
      { id: 'appt1', patientName: patientName, appointmentType: translate('doctorDashboard.simulatedAppointments.checkup', "General Checkup"), dateTime: addDays(now, 7), status: 'Confirmed' },
      { id: 'appt2', patientName: patientName, appointmentType: translate('doctorDashboard.simulatedAppointments.followUp', "Follow-up Visit"), dateTime: addWeeks(now, 3), status: 'Confirmed' },
    ];
  };

  const handleViewPatientDetails = async (patient: Patient) => {
    if (!doctor) return;
    setSelectedPatientForDetails(patient);
    setIsPatientDetailsDialogOpen(true);
    setIsLoadingPatientDetails(true);
    setSelectedPatientRecords(null);
    setDoctorNotes(""); 
    setSimulatedAppointments(generateSimulatedAppointmentsForPatientDialog(patient.name));


    const records = await getMedicalRecordsForPatientByDoctor(patient.id, doctor.id);
    if (records) {
      setSelectedPatientRecords(records);
    } else {
      toast({
        title: translate('doctorDashboard.toast.errorFetchingRecords.title', "Error Fetching Records"),
        description: translate('doctorDashboard.toast.errorFetchingRecords.description', "Could not load medical records for {patientName}.").replace('{patientName}', patient.name),
        variant: "destructive",
      });
      setSelectedPatientRecords([]);
    }
    setIsLoadingPatientDetails(false);
  };

  const handleViewRecordFile = (record: MedicalRecordClientType) => {
    if (record.filePreview) {
      if (record.type === "image") {
        const imageWindow = window.open("", "_blank");
        if (imageWindow) {
          imageWindow.document.write(`<html><head><title>${record.name}</title></head><body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background-color:#f0f0f0;"><img src="${record.filePreview}" style="max-width:100%; max-height:100vh;" alt="${record.name}"></body></html>`);
        } else { toast({ title: translate('doctorDashboard.toast.popupBlocked.title', "Popup Blocked")}); }
      } else if (record.type === "pdf") {
        const pdfWindow = window.open("", "_blank");
        if (pdfWindow) {
          pdfWindow.document.write(`<html><head><title>${record.name}</title><style>body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; } iframe { border: none; width: 100%; height: 100%; }</style></head><body><iframe src="${record.filePreview}"></iframe></body></html>`);
        } else { toast({ title: translate('doctorDashboard.toast.popupBlocked.title', "Popup Blocked")}); }
      } else {
         toast({ title: translate('doctorDashboard.toast.previewNotSupported.title', "Preview Not Supported")});
      }
    } else {
      toast({ title: translate('doctorDashboard.toast.noPreviewAvailable.title', "No Preview Available") });
    }
  };

  const handleSaveNotes = () => {
    toast({
        title: translate('doctorDashboard.toast.notesSaved.title', "Notes Saved (Simulated)"),
        description: translate('doctorDashboard.toast.notesSaved.description', "In a real application, these notes would be saved to the database."),
    });
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
    { titleKey: "doctorDashboard.quickAccess.myAppointments.title", descriptionKey: "doctorDashboard.quickAccess.myAppointments.description", href: "/appointments", icon: CalendarDays },
    { titleKey: "doctorDashboard.quickAccess.telemedicine.title", descriptionKey: "doctorDashboard.quickAccess.telemedicine.description", href: "/telemedicine", icon: MessageSquarePlus },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {quickAccessFeatures.map(feature => (
           <Card key={feature.titleKey} className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">{translate(feature.titleKey)}</CardTitle>
              <feature.icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{translate(feature.descriptionKey)}</p>
              <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
                <Link href={feature.href}>{translate('doctorDashboard.quickAccess.accessButton', "Access")} <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="h-6 w-6 text-primary" /> {translate('doctorDashboard.upcomingAppointments.title', "My Upcoming Appointments")}
          </CardTitle>
          <CardDescription>
            {translate('doctorDashboard.upcomingAppointments.description', "Your scheduled appointments. (Simulated data - would be fetched from DB in a full app)")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {myUpcomingAppointments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{translate('doctorDashboard.appointmentsTable.patientName', "Patient Name")}</TableHead>
                  <TableHead>{translate('doctorDashboard.appointmentsTable.type', "Type")}</TableHead>
                  <TableHead>{translate('doctorDashboard.appointmentsTable.dateTime', "Date & Time")}</TableHead>
                  <TableHead>{translate('doctorDashboard.appointmentsTable.status', "Status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myUpcomingAppointments.map((appt) => (
                  <TableRow key={appt.id}>
                    <TableCell className="font-medium">{appt.patientName}</TableCell>
                    <TableCell>{appt.appointmentType}</TableCell>
                    <TableCell>{format(appt.dateTime, "PPpp")}</TableCell>
                    <TableCell>
                      <Badge variant={appt.status === "Confirmed" ? "default" : "secondary"}>{appt.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">{translate('doctorDashboard.upcomingAppointments.none', "No upcoming appointments scheduled.")}</p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> {translate('doctorDashboard.myPatients.title', "My Patients")} ({myPatients.length})
          </CardTitle>
          <CardDescription>{translate('doctorDashboard.myPatients.description', "Overview of your assigned patients. Click to view their details.")}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingPatients ? (
            <div className="flex justify-center items-center py-8">
                <Activity className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">{translate('doctorDashboard.myPatients.loading', "Loading patients...")}</p>
            </div>
          ) : myPatients.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{translate('doctorDashboard.table.name', "Name")}</TableHead>
                  <TableHead>{translate('doctorDashboard.table.email', "Email")}</TableHead>
                  <TableHead className="hidden md:table-cell">{translate('doctorDashboard.table.contact', "Contact")}</TableHead>
                  <TableHead className="text-right">{translate('doctorDashboard.table.actions', "Actions")}</TableHead>
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
                        <MessageSquarePlus className="mr-1 h-4 w-4" /> {translate('doctorDashboard.actions.chat', "Chat")}
                      </Button>
                      <Button variant="default" size="sm" onClick={() => handleViewPatientDetails(patient)}>
                        <FileText className="mr-1 h-4 w-4" /> {translate('doctorDashboard.actions.viewDetails', "View Details")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">{translate('doctorDashboard.myPatients.noPatients', "You currently have no patients assigned.")}</p>
          )}
        </CardContent>
      </Card>

      {selectedPatientForDetails && (
        <Dialog open={isPatientDetailsDialogOpen} onOpenChange={setIsPatientDetailsDialogOpen}>
          <DialogContent className="sm:max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <BriefcaseMedical className="h-6 w-6 text-primary" />
                {translate('doctorDashboard.patientDetailsDialog.title', "Patient Details: {patientName}").replace('{patientName}', selectedPatientForDetails.name)}
              </DialogTitle>
              <DialogDescription>
                {translate('doctorDashboard.patientDetailsDialog.description', "Viewing details for {patientEmail}.").replace('{patientEmail}', selectedPatientForDetails.email)}
              </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="flex-grow p-1 -mx-1 overflow-y-auto">
              {isLoadingPatientDetails ? (
                <div className="flex justify-center items-center py-10">
                  <Activity className="h-8 w-8 animate-spin text-primary" />
                   <p className="ml-2 text-muted-foreground">{translate('doctorDashboard.patientDetailsDialog.loading', "Loading patient details...")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4">
                  {/* Section 1: Simulated Upcoming Appointments & Notes */}
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Clock className="h-5 w-5 text-blue-600" />
                          {translate('doctorDashboard.patientDetailsDialog.patientAppointments.title', "Patient's Upcoming Appointments (Simulated)")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {simulatedAppointments.length > 0 ? (
                          <ul className="space-y-2 text-sm">
                            {simulatedAppointments.map(appt => (
                              <li key={appt.id} className="p-2 border rounded-md bg-blue-500/5">
                                <p className="font-medium text-blue-700">{appt.appointmentType}</p>
                                <p className="text-xs text-muted-foreground">{format(appt.dateTime, "PPpp")}</p>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-muted-foreground text-sm">{translate('doctorDashboard.patientDetailsDialog.upcomingAppointments.none', "No upcoming appointments simulated.")}</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                           <Notebook className="h-5 w-5 text-green-600" />
                           {translate('doctorDashboard.patientDetailsDialog.notes.title', "Doctor's Notes (Simulated)")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <Label htmlFor="doctor-notes" className="sr-only">{translate('doctorDashboard.patientDetailsDialog.notes.label', "Notes")}</Label>
                        <Textarea
                          id="doctor-notes"
                          value={doctorNotes}
                          onChange={(e) => setDoctorNotes(e.target.value)}
                          placeholder={translate('doctorDashboard.patientDetailsDialog.notes.placeholder', "Type your notes here...")}
                          rows={5}
                          className="text-sm"
                        />
                        <Button onClick={handleSaveNotes} size="sm" variant="secondary" className="mt-2">
                          {translate('doctorDashboard.patientDetailsDialog.notes.saveButton', "Save Notes (Simulated)")}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Section 2: Medical Records */}
                  <Card className="lg:row-span-2">
                    <CardHeader>
                       <CardTitle className="flex items-center gap-2 text-lg">
                         <FileText className="h-5 w-5 text-red-600" />
                         {translate('doctorDashboard.patientDetailsDialog.medicalRecords.title', "Medical Records")}
                       </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedPatientRecords && selectedPatientRecords.length > 0 ? (
                        <ul className="space-y-3 py-2 pr-3">
                          {selectedPatientRecords.map(record => (
                            <li key={record.id} className="p-3 border rounded-md flex items-center justify-between gap-3 hover:shadow-sm">
                              <div className="flex items-center gap-2.5 flex-grow min-w-0">
                                {record.type === "image" && record.filePreview ? (
                                  <Image src={record.filePreview} alt={record.name} width={40} height={40} className="rounded object-cover h-10 w-10" data-ai-hint="medical scan"/>
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
                                <Eye className="mr-1 h-4 w-4" /> {translate('doctorDashboard.actions.view', "View")}
                              </Button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground text-center py-8 text-sm">{translate('doctorDashboard.patientDetailsDialog.medicalRecords.none', "No medical records found for this patient.")}</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </ScrollArea>
            <DialogFooter className="sm:justify-end pt-4 border-t">
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  {translate('doctorDashboard.patientDetailsDialog.closeButton', "Close")}
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

