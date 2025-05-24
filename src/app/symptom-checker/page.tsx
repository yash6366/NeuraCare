
"use client"; // Required for hooks

import { MainLayout } from "@/components/layout/main-layout";
import { PageTitle } from "@/components/page-title";
import { SymptomCheckerClient } from "@/components/symptom-checker/symptom-checker-client";
import { HeartPulse } from "lucide-react";
import { useLanguage } from "@/contexts/language-context"; // Added

export default function SymptomCheckerPage() {
  const { translate } = useLanguage(); // Added

  return (
    <MainLayout>
      <PageTitle 
        title={translate('symptomChecker.title', 'AI Symptom Checker')}
        description={translate('symptomChecker.description', 'Describe your symptoms to get AI-powered insights. This tool does not provide medical advice.')}
        icon={HeartPulse}
      />
      <SymptomCheckerClient />
    </MainLayout>
  );
}

    