import { MainLayout } from "@/components/layout/main-layout";
import { PageTitle } from "@/components/page-title";
import { AppointmentsClient } from "@/components/appointments/appointments-client";
import { CalendarDays } from "lucide-react";

export default function AppointmentsPage() {
  return (
    <MainLayout>
      <PageTitle 
        title="Manage Appointments" 
        description="Book new appointments, view upcoming schedules, and manage your bookings with ease."
        icon={CalendarDays}
      />
      <AppointmentsClient />
    </MainLayout>
  );
}
