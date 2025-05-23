
import { MainLayout } from "@/components/layout/main-layout";
import { PageTitle } from "@/components/page-title";
import { MedicalRecordsClient } from "@/components/medical-records/medical-records-client";
import { FileText } from "lucide-react";

export default function MedicalRecordsPage() {
  return (
    <MainLayout>
      <PageTitle 
        title="Medical Records" 
        description="Upload and manage your medical reports and documents securely."
        icon={FileText}
      />
      <MedicalRecordsClient />
    </MainLayout>
  );
}
