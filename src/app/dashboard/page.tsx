import { MainLayout } from "@/components/layout/main-layout";
import { PageTitle } from "@/components/page-title";
import { FeatureCard } from "@/components/dashboard/feature-card";
import {
  LayoutDashboard,
  HeartPulse,
  CalendarDays,
  Video,
  AlertTriangle,
  MapPin,
} from "lucide-react";

const features = [
  {
    title: "Symptom Checker",
    description: "Get AI-powered insights into your symptoms. Describe how you feel and get potential condition suggestions.",
    href: "/symptom-checker",
    icon: HeartPulse,
  },
  {
    title: "Appointments",
    description: "Manage your medical appointments. Book, reschedule, or cancel with ease, even using voice commands.",
    href: "/appointments",
    icon: CalendarDays,
  },
  {
    title: "Telemedicine",
    description: "Connect with healthcare professionals remotely. Access video/audio consultations and AI chatbots.",
    href: "/telemedicine",
    icon: Video,
  },
  {
    title: "Emergency Response",
    description: "Quickly request emergency assistance. Book an ambulance and track its arrival in real-time.",
    href: "/emergency",
    icon: AlertTriangle,
  },
  {
    title: "Find Care Near You",
    description: "Discover nearby hospitals and specialists based on your current location. Get relevant suggestions instantly.",
    href: "/find-care",
    icon: MapPin,
  },
];

export default function DashboardPage() {
  return (
    <MainLayout>
      <PageTitle 
        title="Welcome to SmartCare Hub" 
        description="Your intelligent healthcare companion, always ready to assist."
        icon={LayoutDashboard}
      />
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <FeatureCard
            key={feature.title}
            title={feature.title}
            description={feature.description}
            href={feature.href}
            icon={feature.icon}
          />
        ))}
      </div>
    </MainLayout>
  );
}
