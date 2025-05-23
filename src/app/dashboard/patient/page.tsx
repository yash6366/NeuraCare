
import { MainLayout } from "@/components/layout/main-layout";
import { PageTitle } from "@/components/page-title";
import { PatientDashboardClient } from "@/components/dashboard/patient-dashboard-client";
import { UserCheck } from "lucide-react";

export default function PatientDashboardPage() {
  return (
    <MainLayout>
      <PageTitle 
        title="Patient Dashboard" 
        description="Access your health information, appointments, and connect with your doctor."
        icon={UserCheck}
      />
      <PatientDashboardClient />
    </MainLayout>
  );
}
