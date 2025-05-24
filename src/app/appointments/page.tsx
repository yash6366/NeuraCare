
"use client"; // Required for hooks

import { MainLayout } from "@/components/layout/main-layout";
import { PageTitle } from "@/components/page-title";
import { AppointmentsClient } from "@/components/appointments/appointments-client";
import { CalendarDays } from "lucide-react";
import { useLanguage } from "@/contexts/language-context"; // Added

export default function AppointmentsPage() {
  const { translate } = useLanguage(); // Added

  return (
    <MainLayout>
      <PageTitle 
        title={translate('appointments.title', 'Manage Appointments')} 
        description={translate('appointments.description', 'Book new appointments, view upcoming schedules, and manage your bookings with ease.')}
        icon={CalendarDays}
      />
      <AppointmentsClient />
    </MainLayout>
  );
}

    