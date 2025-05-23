
"use client"; // Needs to be a client component to access localStorage and use router

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { PageTitle } from "@/components/page-title";
import { FeatureCard } from "@/components/dashboard/feature-card";
import { getCurrentUser, type AppUser } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LayoutDashboard,
  HeartPulse,
  CalendarDays,
  Video,
  AlertTriangle,
  MapPin,
  Users, // For admin view potentially
} from "lucide-react";

// Features for the admin/generic dashboard
const adminFeatures = [
  {
    title: "User Management (Simulated)",
    description: "Oversee all users and system settings.",
    href: "#", // Placeholder
    icon: Users,
  },
  {
    title: "Symptom Checker Insights",
    description: "View analytics from the symptom checker.",
    href: "/symptom-checker", // Can link to existing if relevant for admin
    icon: HeartPulse,
  },
  {
    title: "Appointment System Overview",
    description: "Monitor overall appointment statistics.",
    href: "/appointments", // Can link to existing
    icon: CalendarDays,
  },
  {
    title: "Telemedicine Platform Status",
    description: "Check the status of telemedicine services.",
    href: "/telemedicine",
    icon: Video,
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.replace("/login"); // Redirect to login if no user
    } else {
      setUser(currentUser);
      // Role-based redirection
      if (currentUser.role === "doctor") {
        router.replace("/dashboard/doctor");
      } else if (currentUser.role === "patient") {
        router.replace("/dashboard/patient");
      } else {
        // Admin or other roles stay here (or redirect to an admin-specific dashboard if one exists)
        setLoading(false);
      }
    }
  }, [router]);

  if (loading || !user || (user.role === 'doctor' || user.role === 'patient') ) {
    // Show loading skeleton or a blank page during redirection or if not admin
    return (
      <MainLayout>
        <div className="space-y-4 p-4">
          <Skeleton className="h-12 w-1/2" />
          <Skeleton className="h-8 w-3/4" />
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </MainLayout>
    );
  }
  
  // This content is shown for 'admin' role or if no specific redirect happens
  return (
    <MainLayout>
      <PageTitle 
        title="Admin Dashboard - SmartCare Hub" 
        description="System overview and management tools."
        icon={LayoutDashboard}
      />
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {adminFeatures.map((feature) => (
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
