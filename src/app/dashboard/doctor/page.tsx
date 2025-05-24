
"use client"; // Required for hooks

import { MainLayout } from "@/components/layout/main-layout";
import { PageTitle } from "@/components/page-title";
import { DoctorDashboardClient } from "@/components/dashboard/doctor-dashboard-client";
import { Stethoscope } from "lucide-react";
import { useLanguage } from "@/contexts/language-context"; // Added

export default function DoctorDashboardPage() {
  const { translate } = useLanguage(); // Added

  return (
    <MainLayout>
      <PageTitle 
        title={translate('dashboard.doctor.title', 'Doctor Dashboard')}
        description={translate('dashboard.doctor.description', 'Manage your patients, appointments, and consultations.')}
        icon={Stethoscope}
      />
      <DoctorDashboardClient />
    </MainLayout>
  );
}

    