
"use client"; // Required for hooks

import { MainLayout } from "@/components/layout/main-layout";
import { PageTitle } from "@/components/page-title";
import { HealthInformationClient } from "@/components/health-information/health-information-client"; // We will create this next
import { HelpCircle } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

export default function HealthInformationPage() {
  const { translate } = useLanguage();

  return (
    <MainLayout>
      <PageTitle 
        title={translate('healthInformation.title', 'Health Information Hub')}
        description={translate('healthInformation.description', 'Ask health-related questions and get AI-powered information. This is not medical advice.')}
        icon={HelpCircle}
      />
      <HealthInformationClient />
    </MainLayout>
  );
}
