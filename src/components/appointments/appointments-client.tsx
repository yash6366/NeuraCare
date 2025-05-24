
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Clock, User, Edit, Trash2, Mic, Send, ListChecks, PlusCircle, CheckCircle, XCircle, Stethoscope, Activity } from "lucide-react";
import { format, addDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { processVoiceCommand, type ProcessVoiceCommandOutput } from "@/ai/flows/voice-command-processing";
import { useLanguage } from "@/contexts/language-context";
import { getAllUsers } from "@/lib/actions/admin.actions";
import type { Doctor as DoctorType } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Skeleton } from "../ui/skeleton";

interface Appointment {
  id: string;
  type: string;
  patientName: string;
  dateTime: Date;
  status: "Confirmed" | "Pending" | "Cancelled";
  doctorId: string | null;
  doctorName: string | null;
}

export function AppointmentsClient() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeTab, setActiveTab] = useState("upcoming");
  const { translate } = useLanguage();
  const { toast } = useToast();

  // Form state for booking
  const [appointmentType, setAppointmentType] = useState("");
  const [patientName, setPatientName] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  // Voice command state
  const [voiceCommand, setVoiceCommand] = useState("");
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  const [availableDoctors, setAvailableDoctors] = useState<DoctorType[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);

  useEffect(() => {
    const generateInitialAppointments = (): Appointment[] => [
      { id: "1", type: translate('appointments.mock.generalCheckup', "General Checkup"), patientName: "Alice Smith", dateTime: addDays(new Date(), 3), status: "Confirmed", doctorId: "doc1", doctorName: "Dr. Stephen Strange" },
      { id: "2", type: translate('appointments.mock.dentalCleaning', "Dental Cleaning"), patientName: "Bob Johnson", dateTime: addDays(new Date(), 7), status: "Confirmed", doctorId: "doc2", doctorName: "Dr. Meredith Grey" },
      { id: "3", type: translate('appointments.mock.cardiology', "Cardiology Consultation"), patientName: "Carol Williams", dateTime: addDays(new Date(), 10), status: "Pending", doctorId: "doc1", doctorName: "Dr. Stephen Strange" },
    ];
    setAppointments(generateInitialAppointments());
    setSelectedDate(new Date());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [translate]); // Added translate to dependency array for mock data

  useEffect(() => {
    if (activeTab === "book" && availableDoctors.length === 0) {
      const fetchDoctors = async () => {
        setIsLoadingDoctors(true);
        try {
          const users = await getAllUsers();
          if (users) {
            const doctors = users.filter(u => u.role === 'doctor') as DoctorType[];
            setAvailableDoctors(doctors);
          } else {
            setAvailableDoctors([]);
            toast({ title: translate('appointments.toast.errorFetchingDoctors.title', "Error Fetching Doctors"), description: translate('appointments.toast.errorFetchingDoctors.description', "Could not load the list of doctors."), variant: "destructive"});
          }
        } catch (error) {
          console.error("Error fetching doctors for appointment booking:", error);
          setAvailableDoctors([]);
           toast({ title: translate('appointments.toast.errorFetchingDoctors.title', "Error Fetching Doctors"), description: translate('appointments.toast.errorFetchingDoctors.description', "Could not load the list of doctors."), variant: "destructive"});
        } finally {
          setIsLoadingDoctors(false);
        }
      };
      fetchDoctors();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, toast, translate]);


  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsBooking(true);
    if (!appointmentType || !patientName || !selectedDate || !selectedTime || !selectedDoctorId) {
      toast({ title: translate('appointments.toast.missingInfo.title', "Missing Information"), description: translate('appointments.toast.missingInfo.description', "Please fill all fields, including selecting a doctor."), variant: "destructive" });
      setIsBooking(false);
      return;
    }

    const [hours, minutes] = selectedTime.split(":").map(Number);
    const dateTime = new Date(selectedDate);
    dateTime.setHours(hours, minutes);

    const selectedDoctor = availableDoctors.find(doc => doc.id === selectedDoctorId);

    const newAppointment: Appointment = {
      id: String(Date.now()),
      type: appointmentType,
      patientName,
      dateTime,
      status: "Pending",
      doctorId: selectedDoctorId,
      doctorName: selectedDoctor ? selectedDoctor.name : translate('appointments.unknownDoctor', "Unknown Doctor"),
    };

    // Simulate API call
    setTimeout(() => {
      setAppointments(prev => [newAppointment, ...prev].sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime()));
      toast({ 
        title: translate('appointments.toast.requestSubmitted.title', "Appointment Requested"), 
        description: translate('appointments.toast.requestSubmitted.description', "Your request for {appointmentType} with {doctorName} has been submitted.").replace('{appointmentType}', appointmentType).replace('{doctorName}', newAppointment.doctorName || '')
      });
      setAppointmentType("");
      setPatientName("");
      // Keep selectedDate and Time as is for potential quick re-booking? Or reset? Let's reset for now.
      setSelectedDate(new Date());
      setSelectedTime("09:00");
      setSelectedDoctorId(null); 
      setIsBooking(false);
      setActiveTab("upcoming");
    }, 1000);
  };

  const handleCancelAppointment = (id: string) => {
    setAppointments(prev => prev.map(app => app.id === id ? { ...app, status: "Cancelled" } : app));
    toast({ title: translate('appointments.toast.cancelled.title', "Appointment Cancelled"), description: translate('appointments.toast.cancelled.description', "The appointment has been cancelled.") });
  };
  
  const handleProcessVoiceCommand = async () => {
    if (!voiceCommand.trim()) {
      toast({ title: translate('appointments.toast.noCommand.title', "No Command"), description: translate('appointments.toast.noCommand.description', "Please enter a voice command."), variant: "default" });
      return;
    }
    setIsProcessingVoice(true);
    try {
      const result = await processVoiceCommand({ voiceCommand, currentDate: new Date().toISOString() });
      toast({ title: translate('appointments.toast.voiceProcessed.title', "Voice Command Processed"), description: translate('appointments.toast.voiceProcessed.description', "Intent: {intent}").replace('{intent}', result.intent), variant: "default" });
      
      if (result.intent === "BOOK_APPOINTMENT") {
        if (result.appointmentType) setAppointmentType(result.appointmentType);
        if (result.patientName) setPatientName(result.patientName);
        if (result.dateTime) {
          const date = new Date(result.dateTime);
          setSelectedDate(date);
          setSelectedTime(format(date, "HH:mm"));
        }
        // Voice command cannot yet select doctor. User must select manually.
        setActiveTab("book"); 
      } else if (result.intent === "CANCEL_APPOINTMENT" && result.confirmationNumber) {
        toast({ title: translate('appointments.toast.cancelIntent.title', "Cancellation Intent"), description: translate('appointments.toast.cancelIntent.description', "Attempting to cancel appointment {confirmationNumber}. (Simulated)").replace('{confirmationNumber}',result.confirmationNumber ) });
      }
      setVoiceCommand("");
    } catch (error) {
      console.error("Error processing voice command:", error);
      toast({ title: translate('appointments.toast.voiceError.title', "Voice Command Error"), description: translate('appointments.toast.voiceError.description', "Could not process the voice command."), variant: "destructive" });
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const upcomingAppointments = appointments
    .filter(app => app.status !== "Cancelled" && app.dateTime >= new Date())
    .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
  const pastAppointments = appointments
    .filter(app => app.dateTime < new Date() || app.status === "Cancelled")
    .sort((a,b) => b.dateTime.getTime() - a.dateTime.getTime());

  if (!selectedDate) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>{translate('appointments.loading', "Loading appointments...")}</p>
      </div>
    ); 
  }

  return (
    <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="upcoming"><ListChecks className="mr-2 h-4 w-4 sm:hidden md:inline-block" />{translate('appointments.tabs.upcoming', "Upcoming")}</TabsTrigger>
        <TabsTrigger value="book"><PlusCircle className="mr-2 h-4 w-4 sm:hidden md:inline-block" />{translate('appointments.tabs.bookNew', "Book New")}</TabsTrigger>
        <TabsTrigger value="past">{translate('appointments.tabs.past', "Past")}</TabsTrigger>
      </TabsList>

      <TabsContent value="upcoming">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{translate('appointments.upcoming.title', "Upcoming Appointments")}</CardTitle>
            <CardDescription>{translate('appointments.upcoming.description', "View and manage your scheduled appointments.")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingAppointments.length > 0 ? upcomingAppointments.map(app => (
              <Card key={app.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 gap-4">
                <div>
                  <p className="font-semibold text-lg text-primary">{app.type}</p>
                  <p className="text-sm text-muted-foreground">{translate('appointments.patientNameLabel', "Patient")}: {app.patientName}</p>
                  {app.doctorName && <p className="text-sm text-muted-foreground">{translate('appointments.doctorNameLabel', "Doctor")}: {app.doctorName}</p>}
                  <p className="text-sm text-muted-foreground">
                    {format(app.dateTime, "PPPp")}
                  </p>
                   <p className={`text-sm font-medium ${app.status === "Confirmed" ? "text-green-600" : "text-orange-500"}`}>
                    {translate('appointments.statusLabel', "Status")}: {app.status} {app.status === "Confirmed" ? <CheckCircle className="inline h-4 w-4 ml-1" /> : <Clock className="inline h-4 w-4 ml-1" />}
                  </p>
                </div>
                <div className="flex gap-2 mt-2 sm:mt-0">
                  <Button variant="outline" size="sm"><Edit className="mr-1 h-4 w-4" /> {translate('appointments.buttons.reschedule', "Reschedule")}</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleCancelAppointment(app.id)}><Trash2 className="mr-1 h-4 w-4" /> {translate('appointments.buttons.cancel', "Cancel")}</Button>
                </div>
              </Card>
            )) : <p className="text-muted-foreground text-center py-8">{translate('appointments.upcoming.noAppointments', "No upcoming appointments.")}</p>}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="book">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{translate('appointments.bookNew.title', "Book a New Appointment")}</CardTitle>
            <CardDescription>{translate('appointments.bookNew.description', "Fill in the details or use voice commands to schedule your next visit.")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 border rounded-lg bg-primary/5">
              <Label htmlFor="voiceCommand" className="text-lg font-medium">{translate('appointments.voiceCommand.title', "Voice Command Scheduling")}</Label>
              <div className="flex gap-2 mt-2">
                <Input 
                  id="voiceCommand"
                  placeholder={translate('appointments.voiceCommand.placeholder', "e.g., 'Book a checkup for John Doe next Tuesday at 3 PM'")}
                  value={voiceCommand}
                  onChange={(e) => setVoiceCommand(e.target.value)}
                  disabled={isProcessingVoice}
                  className="flex-grow"
                />
                <Button onClick={handleVoiceInput} variant="outline" size="icon" disabled={isProcessingVoice} aria-label={translate('appointments.voiceCommand.micLabel', "Use Microphone")}>
                  <Mic className="h-5 w-5"/>
                </Button>
                <Button onClick={handleProcessVoiceCommand} disabled={isProcessingVoice}>
                  <Send className="mr-2 h-4 w-4" /> {isProcessingVoice ? translate('appointments.voiceCommand.processingButton', "Processing...") : translate('appointments.voiceCommand.processButton', "Process")}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{translate('appointments.voiceCommand.note', "Simulates voice input processing. Type your command.")}</p>
            </div>

            <form onSubmit={handleBookAppointment} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="appointmentType">{translate('appointments.form.appointmentTypeLabel', "Appointment Type")}</Label>
                   <Select value={appointmentType} onValueChange={setAppointmentType}>
                    <SelectTrigger id="appointmentType">
                      <SelectValue placeholder={translate('appointments.form.selectTypePlaceholder', "Select type")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General Checkup">{translate('appointments.types.generalCheckup', "General Checkup")}</SelectItem>
                      <SelectItem value="Dental Cleaning">{translate('appointments.types.dentalCleaning', "Dental Cleaning")}</SelectItem>
                      <SelectItem value="Cardiology Consultation">{translate('appointments.types.cardiology', "Cardiology Consultation")}</SelectItem>
                      <SelectItem value="Vision Test">{translate('appointments.types.visionTest', "Vision Test")}</SelectItem>
                      <SelectItem value="Pediatric Visit">{translate('appointments.types.pediatricVisit', "Pediatric Visit")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patientName">{translate('appointments.form.patientNameLabel', "Patient Name")}</Label>
                  <Input id="patientName" value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder={translate('appointments.form.patientNamePlaceholder', "Full Name")} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignDoctor">{translate('appointments.form.assignDoctorLabel', "Assign to Doctor")}</Label>
                {isLoadingDoctors ? (
                    <Skeleton className="h-10 w-full" />
                ) : availableDoctors.length > 0 ? (
                    <Select value={selectedDoctorId || ""} onValueChange={setSelectedDoctorId}>
                        <SelectTrigger id="assignDoctor">
                            <SelectValue placeholder={translate('appointments.form.selectDoctorPlaceholder', "Select a doctor")} />
                        </SelectTrigger>
                        <SelectContent>
                            {availableDoctors.map(doc => (
                                <SelectItem key={doc.id} value={doc.id}>
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={`https://placehold.co/40x40.png?text=${doc.name.charAt(0)}`} alt={doc.name} data-ai-hint="doctor professional"/>
                                            <AvatarFallback>{doc.name.substring(0,1).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        {doc.name} ({doc.specialty || translate('appointments.form.generalPractice', "General Practice")})
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <p className="text-sm text-muted-foreground">{translate('appointments.form.noDoctorsAvailable', "No doctors available for booking at the moment.")}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date">{translate('appointments.form.dateLabel', "Date")}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className="w-full justify-start text-left font-normal"
                        disabled={!selectedDate}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : <span>{translate('appointments.form.pickDatePlaceholder', "Pick a date")}</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                        disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) }
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">{translate('appointments.form.timeLabel', "Time")}</Label>
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger id="time">
                      <SelectValue placeholder={translate('appointments.form.selectTimePlaceholder', "Select time")} />
                    </SelectTrigger>
                    <SelectContent>
                      {["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00"].map(time => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isBooking || (availableDoctors.length === 0 && !isLoadingDoctors) }>
                {isBooking ? (<><Activity className="mr-2 h-4 w-4 animate-spin" /> {translate('appointments.buttons.requesting', "Requesting...")}</>) : translate('appointments.buttons.requestAppointment', "Request Appointment")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="past">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{translate('appointments.past.title', "Past Appointments")}</CardTitle>
            <CardDescription>{translate('appointments.past.description', "Review your appointment history.")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pastAppointments.length > 0 ? pastAppointments.map(app => (
              <Card key={app.id} className="p-4 bg-muted/50">
                <p className="font-semibold">{app.type}</p>
                <p className="text-sm text-muted-foreground">{translate('appointments.patientNameLabel', "Patient")}: {app.patientName}</p>
                {app.doctorName && <p className="text-sm text-muted-foreground">{translate('appointments.doctorNameLabel', "Doctor")}: {app.doctorName}</p>}
                <p className="text-sm text-muted-foreground">
                  {format(app.dateTime, "PPPp")} - {translate('appointments.statusLabel', "Status")}: {app.status === "Cancelled" ? <XCircle className="inline h-4 w-4 text-red-500 ml-1" /> : <CheckCircle className="inline h-4 w-4 text-green-500 ml-1" />} {app.status}
                </p>
              </Card>
            )) : <p className="text-muted-foreground text-center py-8">{translate('appointments.past.noAppointments', "No past appointments.")}</p>}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

function handleVoiceInput() {
  // Placeholder for actual voice input logic
  alert("Voice input simulation: In a real app, this would activate the microphone and use Speech-to-Text.");
}

