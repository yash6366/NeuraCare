"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, MapPin, CheckCircle, Siren, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

export function EmergencyClient() {
  const [ambulanceRequested, setAmbulanceRequested] = useState(false);
  const [trackingStatus, setTrackingStatus] = useState("");
  const [eta, setEta] = useState<number | null>(null); // ETA in minutes
  const [progress, setProgress] = useState(0);

  const { toast } = useToast();

  const handleRequestAmbulance = () => {
    setAmbulanceRequested(true);
    setTrackingStatus("Dispatching ambulance...");
    setEta(15); // Simulate initial ETA
    setProgress(10);
    toast({
      title: "Ambulance Requested",
      description: "Help is on the way. We are dispatching the nearest ambulance.",
      variant: "destructive"
    });
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (ambulanceRequested && eta !== null && eta > 0) {
      interval = setInterval(() => {
        setEta(prevEta => {
          const newEta = prevEta !== null ? prevEta - 1 : null;
          if (newEta !== null && newEta <= 0) {
            setTrackingStatus("Ambulance has arrived!");
            setProgress(100);
            clearInterval(interval);
            return 0;
          }
          if (newEta !== null) {
            const totalDuration = 15; // Assuming initial ETA was 15 mins
            setProgress(Math.min(100, ((totalDuration - newEta) / totalDuration) * 100));
            if (newEta < 5) setTrackingStatus("Ambulance arriving soon...");
            else if (newEta < 10) setTrackingStatus("Ambulance en route, nearby...");
            else setTrackingStatus("Ambulance dispatched and en route...");
          }
          return newEta;
        });
      }, 5000); // Update every 5 seconds for demo
    }
    return () => clearInterval(interval);
  }, [ambulanceRequested, eta]);

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-destructive">
            <Siren className="h-7 w-7" />
            Emergency Assistance
          </CardTitle>
          <CardDescription>
            In a critical situation? Request an ambulance immediately.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <AlertTriangle className="h-24 w-24 text-destructive mx-auto" />
          <p className="text-lg font-medium">
            If you are experiencing a medical emergency, please use this service or call your local emergency number.
          </p>
          {!ambulanceRequested ? (
            <Button
              size="lg"
              variant="destructive"
              className="w-full py-6 text-xl"
              onClick={handleRequestAmbulance}
            >
              <Siren className="mr-2 h-6 w-6" /> Request Ambulance NOW
            </Button>
          ) : (
            <Alert variant="default" className="bg-green-50 border-green-300 text-green-700">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <AlertTitle>Ambulance Requested!</AlertTitle>
              <AlertDescription>
                Help is on the way. Stay calm and follow any instructions from emergency services if they contact you.
              </AlertDescription>
            </Alert>
          )}
           <Alert variant="default" className="text-left">
            <Info className="h-4 w-4" />
            <AlertTitle>Important Information</AlertTitle>
            <AlertDescription>
              Provide your current location accurately if prompted. Keep your phone line open.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <MapPin className="h-7 w-7 text-primary" />
            Live Ambulance Tracking
          </CardTitle>
          <CardDescription>
            Monitor the status and ETA of your requested ambulance. (Simulated)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {ambulanceRequested ? (
            <>
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                <Image 
                  src="https://placehold.co/600x400.png" // Replace with actual map component if available
                  alt="Map showing ambulance location" 
                  width={600} 
                  height={400}
                  className="object-cover"
                  data-ai-hint="map ambulance" 
                />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold">{trackingStatus}</p>
                {eta !== null && eta > 0 && (
                  <p className="text-2xl text-primary font-bold">ETA: {eta} minutes</p>
                )}
                 {eta === 0 && (
                  <p className="text-2xl text-green-600 font-bold">Ambulance Arrived!</p>
                )}
              </div>
              <Progress value={progress} className="w-full" />
            </>
          ) : (
            <div className="text-center text-muted-foreground py-16">
              <MapPin className="h-16 w-16 mx-auto mb-4" />
              <p>Request an ambulance to activate live tracking.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
