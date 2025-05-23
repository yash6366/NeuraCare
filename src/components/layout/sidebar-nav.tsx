
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation"; // Added useRouter
import {
  LayoutDashboard,
  HeartPulse,
  CalendarDays,
  Video,
  AlertTriangle,
  MapPin,
  UserCircle,
  LogOut,
  Stethoscope, // For Doctor
  UserCheck, // For Patient
  FileText, // For Medical Records
} from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  useSidebar, // Import useSidebar to check mobile state
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { logoutUser, getCurrentUser, type AppUser } from "@/lib/auth"; // Added AppUser type
import { useEffect, useState } from "react";

// Base features accessible to most roles if not overridden
const baseMenuItems = [
  { href: "/symptom-checker", label: "Symptom Checker", icon: HeartPulse, roles: ['admin', 'patient'] },
  { href: "/appointments", label: "Appointments", icon: CalendarDays, badge: "3", roles: ['admin', 'doctor', 'patient'] },
  { href: "/telemedicine", label: "Telemedicine", icon: Video, roles: ['admin', 'doctor', 'patient'] },
  { href: "/medical-records", label: "Medical Records", icon: FileText, roles: ['patient'] },
  { href: "/emergency", label: "Emergency", icon: AlertTriangle, roles: ['admin', 'patient'] }, // Doctors might not need this directly on sidebar
  { href: "/find-care", label: "Find Care", icon: MapPin, roles: ['admin', 'patient'] },
];

const bottomMenuItems = [
  { href: "/profile", label: "Profile", icon: UserCircle, roles: ['admin', 'doctor', 'patient'] },
  // Logout is handled separately
];

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { setOpenMobile } = useSidebar(); // To close mobile sidebar on nav
  const [user, setUser] = useState<AppUser | null>(null);
  const [dynamicMenuItems, setDynamicMenuItems] = useState(baseMenuItems);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);

    if (currentUser) {
      let dashboardLink = { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ['admin'] };
      if (currentUser.role === 'doctor') {
        dashboardLink = { href: "/dashboard/doctor", label: "Doctor Dashboard", icon: Stethoscope, roles: ['doctor'] };
      } else if (currentUser.role === 'patient') {
        dashboardLink = { href: "/dashboard/patient", label: "Patient Dashboard", icon: UserCheck, roles: ['patient'] };
      }
      
      const filteredBaseItems = baseMenuItems.filter(item => item.roles.includes(currentUser.role));
      setDynamicMenuItems([dashboardLink, ...filteredBaseItems]);
    } else {
      // Default for logged-out state (though usually redirected)
      setDynamicMenuItems([{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ['admin'] }, ...baseMenuItems]);
    }
  }, [pathname]); // Re-run if path changes, e.g. after login

  const handleLogout = () => {
    logoutUser();
    if (typeof window !== "undefined" && window.innerWidth < 768) { // Check if mobile view for sidebar
        setOpenMobile(false);
    }
    router.push("/login");
  };
  
  const handleNavigation = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
        setOpenMobile(false);
    }
  };

  if (!user) { // Don't render sidebar nav if no user (e.g., on login page)
      // Or show a loading state, but typically MainLayout won't be used on login page.
      // For robustness, check if on a page that should have sidebar.
      if (pathname === '/login' || pathname === '/register' || pathname === '/') return null;
  }


  return (
    <>
      <SidebarMenu>
        {dynamicMenuItems.map((item) => (
          <SidebarMenuItem key={item.href} onClick={handleNavigation}>
            <Link href={item.href} passHref legacyBehavior>
              <SidebarMenuButton
                isActive={pathname === item.href || (item.href !== "/dashboard" && item.href !== "/dashboard/doctor" && item.href !== "/dashboard/patient" && pathname.startsWith(item.href))}
                tooltip={{ children: item.label, side: "right", align: "center" }}
              >
                <item.icon className={cn("h-5 w-5")} />
                <span>{item.label}</span>
                {item.badge && item.roles.includes(user?.role || '') && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
      
      <div className="mt-auto"> {/* Pushes bottom items to the end */}
        <SidebarMenu>
          {bottomMenuItems.filter(item => item.roles.includes(user?.role || '')).map((item) => (
            <SidebarMenuItem key={item.href} onClick={handleNavigation}>
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  tooltip={{ children: item.label, side: "right", align: "center" }}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
             <SidebarMenuButton
                onClick={handleLogout}
                tooltip={{ children: "Logout", side: "right", align: "center" }}
                className="text-destructive focus:text-destructive hover:bg-destructive/10 focus:bg-destructive/10"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </div>
    </>
  );
}
