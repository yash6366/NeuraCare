
"use client"; // Required for hooks

import { MainLayout } from "@/components/layout/main-layout";
import { PageTitle } from "@/components/page-title";
import { MedicalRecordsClient } from "@/components/medical-records/medical-records-client";
import { FileText } from "lucide-react";
import { useLanguage } from "@/contexts/language-context"; // Added

export default function MedicalRecordsPage() {
  const { translate } = useLanguage(); // Added

  return (
    <MainLayout>
      <PageTitle 
        title={translate('medicalRecords.title', 'Medical Records')}
        description={translate('medicalRecords.description', 'Upload and manage your medical reports and documents securely.')}
        icon={FileText}
      />
      <MedicalRecordsClient />
    </MainLayout>
  );
}

    