import { MainLayout } from "@/components/layout/main-layout";
import { PageTitle } from "@/components/page-title";
import { EmergencyClient } from "@/components/emergency/emergency-client";
import { AlertTriangle } from "lucide-react";

export default function EmergencyPage() {
  return (
    <MainLayout>
      <PageTitle 
        title="Emergency SOS Alert" 
        description="Trigger an SOS alert to emergency services and designated contacts in critical situations."
        icon={AlertTriangle}
      />
      <EmergencyClient />
    </MainLayout>
  );
}
