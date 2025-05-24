
"use client"; // Required for hooks

import { MainLayout } from "@/components/layout/main-layout";
import { PageTitle } from "@/components/page-title";
import { EmergencyClient } from "@/components/emergency/emergency-client";
import { AlertTriangle } from "lucide-react";
import { useLanguage } from "@/contexts/language-context"; // Added

export default function EmergencyPage() {
  const { translate } = useLanguage(); // Added

  return (
    <MainLayout>
      <PageTitle 
        title={translate('emergency.title', 'Emergency SOS Alert')}
        description={translate('emergency.description', 'Trigger an SOS alert to emergency services and designated contacts in critical situations.')}
        icon={AlertTriangle}
      />
      <EmergencyClient />
    </MainLayout>
  );
}

    