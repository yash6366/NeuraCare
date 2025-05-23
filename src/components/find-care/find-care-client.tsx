"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Search, Hospital, Stethoscope, Phone, Navigation, Activity, Building } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { locationBasedRecommendations, type LocationBasedRecommendationsOutput } from "@/ai/flows/location-based-recommendations";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

type RecommendationType = "hospital" | "specialist";

export function FindCareClient() {
  const [recommendationType, setRecommendationType] = useState<RecommendationType>("hospital");
  const [specialty, setSpecialty] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<LocationBasedRecommendationsOutput["results"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    // Attempt to get user's current location on component mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          toast({ title: "Location Acquired", description: "Your current location has been successfully determined." });
        },
        (err) => {
          console.warn("Error getting location:", err);
          setError("Could not automatically determine your location. Please ensure location services are enabled or search manually (manual search not implemented in demo).");
           toast({ title: "Location Error", description: "Could not get your location. AI recommendations will use a default location.", variant: "default" });
           // Use a default location if user denies or error occurs, for demo purposes
           setUserLocation({ latitude: 34.0522, longitude: -118.2437 }); // Default to Los Angeles
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
      toast({ title: "Geolocation Not Supported", description: "AI recommendations will use a default location.", variant: "default" });
      setUserLocation({ latitude: 34.0522, longitude: -118.2437 }); // Default to Los Angeles
    }
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userLocation) {
      setError("Your location is not available. Cannot search for nearby care.");
      return;
    }
    if (recommendationType === "specialist" && !specialty.trim()) {
      setError("Please enter a specialty to search for.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const output = await locationBasedRecommendations({
        ...userLocation,
        recommendationType,
        specialty: recommendationType === "specialist" ? specialty : undefined,
      });
      // Simulate results if AI returns empty or few, for better demo.
      if (!output.results || output.results.length === 0) {
         const placeholderResults = [
            { name: "Demo General Hospital", address: "123 Health St, Cityville", distance: 2.5, contact: "555-1234" },
            { name: `Demo ${specialty || 'Cardiology'} Clinic`, address: "456 Care Ave, Cityville", distance: 3.1, contact: "555-5678" },
         ];
         setResults(placeholderResults);
         toast({ title: "Demo Results Shown", description: "AI returned no specific results, showing demo data."});
      } else {
        setResults(output.results);
      }
    } catch (err) {
      console.error("Find care AI error:", err);
      setError("An error occurred while finding care options. Please try again.");
      toast({
        title: "AI Error",
        description: "Could not fetch recommendations. The AI service might be unavailable.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-1 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Search className="h-7 w-7 text-primary" />
            Find Healthcare
          </CardTitle>
          <CardDescription>
            Discover hospitals or specialists near your current location.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="recommendationType">I'm looking for a...</Label>
              <Select
                value={recommendationType}
                onValueChange={(value) => setRecommendationType(value as RecommendationType)}
              >
                <SelectTrigger id="recommendationType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hospital"><Hospital className="inline mr-2 h-4 w-4" />Hospital</SelectItem>
                  <SelectItem value="specialist"><Stethoscope className="inline mr-2 h-4 w-4" />Specialist</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {recommendationType === "specialist" && (
              <div className="space-y-2">
                <Label htmlFor="specialty">Specialty</Label>
                <Input
                  id="specialty"
                  placeholder="e.g., Cardiologist, Dermatologist"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            )}
            
            {userLocation && (
                 <Alert variant="default" className="bg-primary/5 border-primary/20">
                    <MapPin className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-primary">Location Detected</AlertTitle>
                    <AlertDescription>
                        Latitude: {userLocation.latitude.toFixed(4)}, Longitude: {userLocation.longitude.toFixed(4)}. 
                        Don't see your location? Enable location services in your browser.
                    </AlertDescription>
                </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                 <Activity className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={isLoading || !userLocation} className="w-full">
              <Search className="mr-2 h-5 w-5" />
              {isLoading ? "Searching..." : "Find Care"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Building className="h-7 w-7 text-accent" />
            Nearby Options
          </CardTitle>
          <CardDescription>
            Here are some healthcare services based on your location and criteria.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex flex-col items-center justify-center space-y-3 p-8">
              <Activity className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Searching for nearby care options...</p>
            </div>
          )}
          {!isLoading && !results && !error && (
            <div className="text-center text-muted-foreground p-8">
              <p>Your search results will appear here.</p>
            </div>
          )}
          {results && results.length === 0 && !isLoading && (
             <div className="text-center text-muted-foreground p-8">
              <p>No specific results found for your criteria using AI. Consider broadening your search.</p>
            </div>
          )}
          {results && results.length > 0 && (
            <div className="space-y-4">
              {results.map((result, index) => (
                <Card key={index} className="overflow-hidden">
                  <div className="md:flex">
                    <div className="md:flex-shrink-0">
                      <Image 
                        className="h-48 w-full object-cover md:w-48" 
                        src={`https://placehold.co/300x200.png?id=${index}`} // Placeholder images
                        alt={result.name}
                        width={300}
                        height={200}
                        data-ai-hint="hospital building"
                      />
                    </div>
                    <div className="p-4 flex-grow">
                      <CardTitle className="text-xl hover:text-primary transition-colors">
                        <a href="#" onClick={(e) => e.preventDefault() /* Placeholder link */}>{result.name}</a>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{result.address}</p>
                      <div className="mt-2 space-y-1 text-sm">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-primary" /> Distance: {result.distance.toFixed(1)} km
                        </div>
                        {result.contact && (
                           <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-primary" /> Contact: {result.contact}
                          </div>
                        )}
                      </div>
                      <CardFooter className="p-0 pt-3">
                        <Button variant="outline" size="sm">
                          <Navigation className="mr-2 h-4 w-4" /> Get Directions
                        </Button>
                      </CardFooter>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
