import { MainLayout } from "@/components/layout/main-layout";
import { PageTitle } from "@/components/page-title";
import { SymptomCheckerClient } from "@/components/symptom-checker/symptom-checker-client";
import { HeartPulse } from "lucide-react";

export default function SymptomCheckerPage() {
  return (
    <MainLayout>
      <PageTitle 
        title="AI Symptom Checker" 
        description="Describe your symptoms to get AI-powered insights. This tool does not provide medical advice."
        icon={HeartPulse}
      />
      <SymptomCheckerClient />
    </MainLayout>
  );
}
