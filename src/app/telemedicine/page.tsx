import { MainLayout } from "@/components/layout/main-layout";
import { PageTitle } from "@/components/page-title";
import { TelemedicineClient } from "@/components/telemedicine/telemedicine-client";
import { Video } from "lucide-react";

export default function TelemedicinePage() {
  return (
    <MainLayout>
      <PageTitle 
        title="Telemedicine Services" 
        description="Connect with healthcare providers remotely for consultations and get quick answers from our AI chatbot."
        icon={Video}
      />
      <TelemedicineClient />
    </MainLayout>
  );
}
