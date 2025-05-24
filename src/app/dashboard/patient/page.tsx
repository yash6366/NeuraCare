
"use client"; // Required for hooks

import { MainLayout } from "@/components/layout/main-layout";
import { PageTitle } from "@/components/page-title";
import { PatientDashboardClient } from "@/components/dashboard/patient-dashboard-client";
import { UserCheck } from "lucide-react";
import { useLanguage } from "@/contexts/language-context"; // Added

export default function PatientDashboardPage() {
  const { translate } = useLanguage(); // Added

  return (
    <MainLayout>
      <PageTitle 
        title={translate('dashboard.patient.title', 'Patient Dashboard')}
        description={translate('dashboard.patient.description', 'Access your health information, appointments, and connect with your doctor.')}
        icon={UserCheck}
      />
      <PatientDashboardClient />
    </MainLayout>
  );
}

    