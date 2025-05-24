
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
import { CalendarIcon, Clock, User, Edit, Trash2, Mic, Send, ListChecks, PlusCircle, CheckCircle, XCircle } from "lucide-react";
import { format, addDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { processVoiceCommand, type ProcessVoiceCommandOutput } from "@/ai/flows/voice-command-processing";

interface Appointment {
  id: string;
  type: string;
  patientName: string;
  dateTime: Date;
  status: "Confirmed" | "Pending" | "Cancelled";
}

// Moved initialAppointments generation inside useEffect to avoid hydration issues

export function AppointmentsClient() {
  const [appointments, setAppointments] = useState<Appointment[]>([]); // Initialize as empty
  const [activeTab, setActiveTab] = useState("upcoming");

  // Form state for booking
  const [appointmentType, setAppointmentType] = useState("");
  const [patientName, setPatientName] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined); // Initialize as undefined
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [isBooking, setIsBooking] = useState(false);

  // Voice command state
  const [voiceCommand, setVoiceCommand] = useState("");
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    // Generate initial appointments and set selectedDate on client mount
    const generateInitialAppointments = (): Appointment[] => [
      { id: "1", type: "General Checkup", patientName: "Alice Smith", dateTime: addDays(new Date(), 3), status: "Confirmed" },
      { id: "2", type: "Dental Cleaning", patientName: "Bob Johnson", dateTime: addDays(new Date(), 7), status: "Confirmed" },
      { id: "3", type: "Cardiology Consultation", patientName: "Carol Williams", dateTime: addDays(new Date(), 10), status: "Pending" },
    ];
    setAppointments(generateInitialAppointments());
    setSelectedDate(new Date());
  }, []); // Empty dependency array ensures this runs once on mount (client-side)


  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsBooking(true);
    if (!appointmentType || !patientName || !selectedDate || !selectedTime) {
      toast({ title: "Missing Information", description: "Please fill all fields.", variant: "destructive" });
      setIsBooking(false);
      return;
    }

    const [hours, minutes] = selectedTime.split(":").map(Number);
    const dateTime = new Date(selectedDate);
    dateTime.setHours(hours, minutes);

    const newAppointment: Appointment = {
      id: String(Date.now()),
      type: appointmentType,
      patientName,
      dateTime,
      status: "Pending",
    };

    // Simulate API call
    setTimeout(() => {
      setAppointments(prev => [newAppointment, ...prev].sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime()));
      toast({ title: "Appointment Requested", description: `Your request for ${appointmentType} has been submitted.` });
      setAppointmentType("");
      setPatientName("");
      setSelectedDate(new Date());
      setSelectedTime("09:00");
      setIsBooking(false);
      setActiveTab("upcoming");
    }, 1000);
  };

  const handleCancelAppointment = (id: string) => {
    setAppointments(prev => prev.map(app => app.id === id ? { ...app, status: "Cancelled" } : app));
    toast({ title: "Appointment Cancelled", description: "The appointment has been cancelled." });
  };
  
  const handleProcessVoiceCommand = async () => {
    if (!voiceCommand.trim()) {
      toast({ title: "No Command", description: "Please enter a voice command.", variant: "default" });
      return;
    }
    setIsProcessingVoice(true);
    try {
      const result = await processVoiceCommand({ voiceCommand, currentDate: new Date().toISOString() });
      toast({ title: "Voice Command Processed", description: `Intent: ${result.intent}`, variant: "default" });
      
      if (result.intent === "BOOK_APPOINTMENT") {
        if (result.appointmentType) setAppointmentType(result.appointmentType);
        if (result.patientName) setPatientName(result.patientName);
        if (result.dateTime) {
          const date = new Date(result.dateTime);
          setSelectedDate(date);
          setSelectedTime(format(date, "HH:mm"));
        }
        setActiveTab("book"); // Switch to book tab to show populated fields
      } else if (result.intent === "CANCEL_APPOINTMENT" && result.confirmationNumber) {
        // In a real app, search for appointment by confirmationNumber and cancel it.
        toast({ title: "Cancellation Intent", description: `Attempting to cancel appointment ${result.confirmationNumber}. (Simulated)` });
      }
      setVoiceCommand("");
    } catch (error) {
      console.error("Error processing voice command:", error);
      toast({ title: "Voice Command Error", description: "Could not process the voice command.", variant: "destructive" });
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

  if (!selectedDate) { // Render a loading state or null until selectedDate is initialized
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading appointments...</p>
      </div>
    ); 
  }

  return (
    <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="upcoming"><ListChecks className="mr-2 h-4 w-4 sm:hidden md:inline-block" />Upcoming</TabsTrigger>
        <TabsTrigger value="book"><PlusCircle className="mr-2 h-4 w-4 sm:hidden md:inline-block" />Book New</TabsTrigger>
        <TabsTrigger value="past">Past</TabsTrigger>
      </TabsList>

      <TabsContent value="upcoming">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardDescription>View and manage your scheduled appointments.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingAppointments.length > 0 ? upcomingAppointments.map(app => (
              <Card key={app.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 gap-4">
                <div>
                  <p className="font-semibold text-lg text-primary">{app.type}</p>
                  <p className="text-sm text-muted-foreground">With: {app.patientName}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(app.dateTime, "PPPp")}
                  </p>
                   <p className={`text-sm font-medium ${app.status === "Confirmed" ? "text-green-600" : "text-orange-500"}`}>
                    Status: {app.status} {app.status === "Confirmed" ? <CheckCircle className="inline h-4 w-4 ml-1" /> : <Clock className="inline h-4 w-4 ml-1" />}
                  </p>
                </div>
                <div className="flex gap-2 mt-2 sm:mt-0">
                  <Button variant="outline" size="sm"><Edit className="mr-1 h-4 w-4" /> Reschedule</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleCancelAppointment(app.id)}><Trash2 className="mr-1 h-4 w-4" /> Cancel</Button>
                </div>
              </Card>
            )) : <p className="text-muted-foreground text-center py-8">No upcoming appointments.</p>}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="book">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Book a New Appointment</CardTitle>
            <CardDescription>Fill in the details or use voice commands to schedule your next visit.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 border rounded-lg bg-primary/5">
              <Label htmlFor="voiceCommand" className="text-lg font-medium">Voice Command Scheduling</Label>
              <div className="flex gap-2 mt-2">
                <Input 
                  id="voiceCommand"
                  placeholder="e.g., 'Book a checkup for John Doe next Tuesday at 3 PM'" 
                  value={voiceCommand}
                  onChange={(e) => setVoiceCommand(e.target.value)}
                  disabled={isProcessingVoice}
                  className="flex-grow"
                />
                <Button onClick={handleVoiceInput} variant="outline" size="icon" disabled={isProcessingVoice} aria-label="Use Microphone">
                  <Mic className="h-5 w-5"/>
                </Button>
                <Button onClick={handleProcessVoiceCommand} disabled={isProcessingVoice}>
                  <Send className="mr-2 h-4 w-4" /> {isProcessingVoice ? "Processing..." : "Process"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Simulates voice input processing. Type your command.</p>
            </div>

            <form onSubmit={handleBookAppointment} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="appointmentType">Appointment Type</Label>
                   <Select value={appointmentType} onValueChange={setAppointmentType}>
                    <SelectTrigger id="appointmentType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General Checkup">General Checkup</SelectItem>
                      <SelectItem value="Dental Cleaning">Dental Cleaning</SelectItem>
                      <SelectItem value="Cardiology Consultation">Cardiology Consultation</SelectItem>
                      <SelectItem value="Vision Test">Vision Test</SelectItem>
                      <SelectItem value="Pediatric Visit">Pediatric Visit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patientName">Patient Name</Label>
                  <Input id="patientName" value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="Full Name" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className="w-full justify-start text-left font-normal"
                        disabled={!selectedDate} // Disable if selectedDate is not yet initialized
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                        disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) } // Disable past dates
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger id="time">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00"].map(time => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isBooking}>
                {isBooking ? "Requesting..." : "Request Appointment"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="past">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Past Appointments</CardTitle>
            <CardDescription>Review your appointment history.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pastAppointments.length > 0 ? pastAppointments.map(app => (
              <Card key={app.id} className="p-4 bg-muted/50">
                <p className="font-semibold">{app.type}</p>
                <p className="text-sm text-muted-foreground">With: {app.patientName}</p>
                <p className="text-sm text-muted-foreground">
                  {format(app.dateTime, "PPPp")} - Status: {app.status === "Cancelled" ? <XCircle className="inline h-4 w-4 text-red-500 ml-1" /> : <CheckCircle className="inline h-4 w-4 text-green-500 ml-1" />} {app.status}
                </p>
              </Card>
            )) : <p className="text-muted-foreground text-center py-8">No past appointments.</p>}
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

