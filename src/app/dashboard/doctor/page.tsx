
import { MainLayout } from "@/components/layout/main-layout";
import { PageTitle } from "@/components/page-title";
import { DoctorDashboardClient } from "@/components/dashboard/doctor-dashboard-client";
import { Stethoscope } from "lucide-react";

export default function DoctorDashboardPage() {
  return (
    <MainLayout>
      <PageTitle 
        title="Doctor Dashboard" 
        description="Manage your patients, appointments, and consultations."
        icon={Stethoscope}
      />
      <DoctorDashboardClient />
    </MainLayout>
  );
}
