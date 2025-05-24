
"use client"; // Required for hooks

import { MainLayout } from "@/components/layout/main-layout";
import { PageTitle } from "@/components/page-title";
import { FindCareClient } from "@/components/find-care/find-care-client";
import { MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/language-context"; // Added

export default function FindCarePage() {
  const { translate } = useLanguage(); // Added

  return (
    <MainLayout>
      <PageTitle 
        title={translate('findCare.title', 'Find Care Near You')}
        description={translate('findCare.description', 'Discover nearby hospitals and specialists based on your current location. AI-powered recommendations tailored for you.')}
        icon={MapPin}
      />
      <FindCareClient />
    </MainLayout>
  );
}

    