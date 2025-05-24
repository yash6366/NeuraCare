
"use client"; // Required for hooks

import { MainLayout } from "@/components/layout/main-layout";
import { PageTitle } from "@/components/page-title";
import { TelemedicineClient } from "@/components/telemedicine/telemedicine-client";
import { Video } from "lucide-react";
import { useLanguage } from "@/contexts/language-context"; // Added

export default function TelemedicinePage() {
  const { translate } = useLanguage(); // Added

  return (
    <MainLayout>
      <PageTitle 
        title={translate('telemedicine.title', 'Telemedicine Services')}
        description={translate('telemedicine.description', 'Connect with healthcare providers remotely for consultations and get quick answers from our AI chatbot.')}
        icon={Video}
      />
      <TelemedicineClient />
    </MainLayout>
  );
}

    