
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Siren, Info, MessageSquare } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

export function EmergencyClient() {
  const [sosActivated, setSosActivated] = useState(false);

  const { toast } = useToast();

  const handleSosActivation = () => {
    setSosActivated(true);
    toast({
      title: "SOS Alert Activated",
      description: "Simulated SMS alerts sent to emergency services and designated family members.",
      variant: "destructive"
    });
    // In a real app, you'd trigger actual SMS sending here.
  };

  return (
    <div className="flex justify-center">
      <Card className="shadow-lg max-w-lg w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-destructive">
            <Siren className="h-7 w-7" />
            Emergency SOS Alert
          </CardTitle>
          <CardDescription>
            In a critical situation? Press the SOS button to alert emergency services and your contacts.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <AlertTriangle className="h-24 w-24 text-destructive mx-auto" />
          <p className="text-lg font-medium">
            Pressing the SOS button will simulate sending an immediate alert. Use only in genuine emergencies.
          </p>
          {!sosActivated ? (
            <Button
              size="lg"
              variant="destructive"
              className="w-full py-6 text-xl animate-pulse"
              onClick={handleSosActivation}
            >
              <Siren className="mr-2 h-6 w-6" /> SOS
            </Button>
          ) : (
            <Alert variant="default" className="bg-green-50 border-green-300 text-green-700">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <AlertTitle>SOS Alert Activated!</AlertTitle>
              <AlertDescription>
                Simulated SMS alerts have been dispatched. Help is on the way (simulated). Stay calm.
              </AlertDescription>
            </Alert>
          )}
           <Alert variant="default" className="text-left">
            <Info className="h-4 w-4" />
            <AlertTitle>Important Information</AlertTitle>
            <AlertDescription>
              This service simulates sending alerts. Ensure your location services are enabled for accurate information sharing in a real scenario. Keep your phone line open.
            </AlertDescription>
          </Alert>
           <Alert variant="default" className="text-left">
            <MessageSquare className="h-4 w-4" />
            <AlertTitle>For Family Members & Ambulance Services (Simulated)</AlertTitle>
            <AlertDescription>
              In a real application, recipients would receive an SMS with the user's name, location (if available), and an emergency message.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
