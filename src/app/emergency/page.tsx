import { MainLayout } from "@/components/layout/main-layout";
import { PageTitle } from "@/components/page-title";
import { EmergencyClient } from "@/components/emergency/emergency-client";
import { AlertTriangle } from "lucide-react";

export default function EmergencyPage() {
  return (
    <MainLayout>
      <PageTitle 
        title="Emergency Response" 
        description="Request immediate medical assistance and track ambulance arrival. For critical emergencies only."
        icon={AlertTriangle}
      />
      <EmergencyClient />
    </MainLayout>
  );
}
