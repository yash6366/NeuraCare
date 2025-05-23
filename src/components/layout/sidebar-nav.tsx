"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  HeartPulse,
  CalendarDays,
  Video,
  AlertTriangle,
  MapPin,
  UserCircle,
  LogOut,
} from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/symptom-checker", label: "Symptom Checker", icon: HeartPulse },
  { href: "/appointments", label: "Appointments", icon: CalendarDays, badge: "3" },
  { href: "/telemedicine", label: "Telemedicine", icon: Video },
  { href: "/emergency", label: "Emergency", icon: AlertTriangle },
  { href: "/find-care", label: "Find Care", icon: MapPin },
];

const bottomMenuItems = [
  { href: "/profile", label: "Profile", icon: UserCircle },
  { href: "/login", label: "Logout", icon: LogOut }, // Should be a logout action
];


export function SidebarNav() {
  const pathname = usePathname();

  return (
    <>
      <SidebarMenu>
        {menuItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href} passHref legacyBehavior>
              <SidebarMenuButton
                isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
                tooltip={{ children: item.label, side: "right", align: "center" }}
              >
                <item.icon className={cn("h-5 w-5")} />
                <span>{item.label}</span>
                {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
      
      <div className="mt-auto"> {/* Pushes bottom items to the end */}
        <SidebarMenu>
          {bottomMenuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
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
        </SidebarMenu>
      </div>
    </>
  );
}
