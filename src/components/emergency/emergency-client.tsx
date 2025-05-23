
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Siren, Info, MessageSquare, MapPin } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { sendSosSmsAction } from "@/lib/actions/emergency.actions";
import { getCurrentUser } from "@/lib/auth";

interface LocationData {
  latitude: number;
  longitude: number;
}

export function EmergencyClient() {
  const [sosActivated, setSosActivated] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const { toast } = useToast();

  const getLocation = (): Promise<LocationData | null> => {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
            setLocationError(null);
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (err) => {
            console.warn("Error getting location for SOS:", err);
            setLocationError("Could not automatically determine your location. SOS will be sent without location.");
            toast({
              title: "Location Error",
              description: "Could not get your location. SOS will be sent without it.",
              variant: "default",
            });
            resolve(null);
          },
          { timeout: 10000 } // 10 seconds timeout
        );
      } else {
        setLocationError("Geolocation is not supported by your browser. SOS will be sent without location.");
        toast({
            title: "Location Not Supported",
            description: "Geolocation not supported. SOS will be sent without it.",
            variant: "default"
        });
        resolve(null);
      }
    });
  };

  const handleSosActivation = async () => {
    setIsSending(true);
    setLocationError(null); // Reset location error
    
    // Attempt to get location first
    const location = await getLocation();
    
    const currentUser = getCurrentUser();
    const userName = currentUser?.name;

    const result = await sendSosSmsAction(userName, location);

    if (result.success) {
      setSosActivated(true);
      toast({
        title: "SOS Alert Sent",
        description: result.message,
        variant: "default", // Changed from destructive as it's a success
      });
    } else {
      setSosActivated(false); // Keep button active if failed
      toast({
        title: "SOS Alert Failed",
        description: result.message || "Could not send SOS alert. Please try again or call emergency services directly.",
        variant: "destructive",
      });
      if (result.error) {
        console.error("Twilio Error Details:", result.error);
      }
    }
    setIsSending(false);
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
            In a critical situation? Press the SOS button to alert emergency services and your contacts via SMS.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <AlertTriangle className="h-24 w-24 text-destructive mx-auto" />
          <p className="text-lg font-medium">
            Pressing the SOS button will attempt to send an SMS alert. Use only in genuine emergencies.
          </p>
          {!sosActivated ? (
            <Button
              size="lg"
              variant="destructive"
              className="w-full py-6 text-xl animate-pulse"
              onClick={handleSosActivation}
              disabled={isSending}
            >
              {isSending ? (
                <>
                  <Siren className="mr-2 h-6 w-6 animate-ping" /> Sending SOS...
                </>
              ) : (
                <>
                  <Siren className="mr-2 h-6 w-6" /> SOS
                </>
              )}
            </Button>
          ) : (
            <Alert variant="default" className="bg-green-50 border-green-300 text-green-700">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <AlertTitle>SOS Alert Successfully Sent!</AlertTitle>
              <AlertDescription>
                SMS alerts have been dispatched to emergency contacts. If you do not receive confirmation or help shortly, please call emergency services directly.
              </AlertDescription>
            </Alert>
          )}

          {locationError && (
            <Alert variant="destructive" className="text-left mt-4">
              <MapPin className="h-4 w-4" />
              <AlertTitle>Location Issue</AlertTitle>
              <AlertDescription>{locationError}</AlertDescription>
            </Alert>
          )}

          <Alert variant="default" className="text-left">
            <Info className="h-4 w-4" />
            <AlertTitle>Important Information</AlertTitle>
            <AlertDescription>
              This service attempts to send SMS alerts. Ensure your phone has signal. For accurate location sharing, enable location services. Keep your phone line open.
            </AlertDescription>
          </Alert>
           <Alert variant="default" className="text-left">
            <MessageSquare className="h-4 w-4" />
            <AlertTitle>SMS Content</AlertTitle>
            <AlertDescription>
              Recipients will receive an SMS with your name (if logged in), your approximate location (if enabled and found), and an emergency message.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
