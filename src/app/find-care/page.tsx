import { MainLayout } from "@/components/layout/main-layout";
import { PageTitle } from "@/components/page-title";
import { FindCareClient } from "@/components/find-care/find-care-client";
import { MapPin } from "lucide-react";

export default function FindCarePage() {
  return (
    <MainLayout>
      <PageTitle 
        title="Find Care Near You" 
        description="Discover nearby hospitals and specialists based on your current location. AI-powered recommendations tailored for you."
        icon={MapPin}
      />
      <FindCareClient />
    </MainLayout>
  );
}
