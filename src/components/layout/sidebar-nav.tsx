
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation"; 
import {
  LayoutDashboard,
  HeartPulse,
  CalendarDays,
  Video,
  AlertTriangle,
  MapPin,
  UserCircle,
  LogOut,
  Stethoscope, 
  UserCheck, 
  FileText,
  Bot, 
  HelpCircle, // Added HelpCircle icon
} from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  useSidebar, 
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { logoutUser, getCurrentUser, type AppUser } from "@/lib/auth"; 
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/language-context";

// Base features accessible to most roles if not overridden
const baseMenuItemsConfig = [
  { translationKey: 'sidebar.symptomChecker', href: "/symptom-checker", icon: HeartPulse, roles: ['admin', 'patient'] },
  { translationKey: 'sidebar.aiChatAssistant', href: "/ai-chat-assistant", icon: Bot, roles: ['admin', 'patient'] },
  { translationKey: 'sidebar.healthInformation', href: "/health-information", icon: HelpCircle, roles: ['admin', 'patient'] }, // Added Health Info Hub
  { translationKey: 'sidebar.appointments', href: "/appointments", icon: CalendarDays, badge: "3", roles: ['admin', 'doctor', 'patient'] },
  { translationKey: 'sidebar.telemedicine', href: "/telemedicine", icon: Video, roles: ['admin', 'doctor', 'patient'] },
  { translationKey: 'sidebar.medicalRecords', href: "/medical-records", icon: FileText, roles: ['patient'] },
  { translationKey: 'sidebar.emergency', href: "/emergency", icon: AlertTriangle, roles: ['admin', 'patient'] }, 
  { translationKey: 'sidebar.findCare', href: "/find-care", icon: MapPin, roles: ['admin', 'patient'] },
];

const bottomMenuItemsConfig = [
  { translationKey: 'sidebar.profile', href: "/profile", icon: UserCircle, roles: ['admin', 'doctor', 'patient'] },
];

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { setOpenMobile } = useSidebar(); 
  const { translate } = useLanguage(); 
  const [user, setUser] = useState<AppUser | null>(null);
  const [dynamicMenuItems, setDynamicMenuItems] = useState<Array<typeof baseMenuItemsConfig[0] & {label: string}>>([]);
  const [dynamicBottomMenuItems, setDynamicBottomMenuItems] = useState<Array<typeof bottomMenuItemsConfig[0] & {label: string}>>([]);


  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);

    let dashboardLinkConfig = { translationKey: 'sidebar.dashboard', href: "/dashboard", icon: LayoutDashboard, roles: ['admin'] };
    if (currentUser?.role === 'doctor') {
      dashboardLinkConfig = { translationKey: 'sidebar.doctorDashboard', href: "/dashboard/doctor", icon: Stethoscope, roles: ['doctor'] };
    } else if (currentUser?.role === 'patient') {
      dashboardLinkConfig = { translationKey: 'sidebar.patientDashboard', href: "/dashboard/patient", icon: UserCheck, roles: ['patient'] };
    }
    
    const translatedDashboardLink = { ...dashboardLinkConfig, label: translate(dashboardLinkConfig.translationKey) };

    const filteredBaseItems = baseMenuItemsConfig
      .filter(item => currentUser?.role && item.roles.includes(currentUser.role))
      .map(item => ({ ...item, label: translate(item.translationKey) }));
    
    setDynamicMenuItems([translatedDashboardLink, ...filteredBaseItems]);

    const filteredBottomItems = bottomMenuItemsConfig
      .filter(item => currentUser?.role && item.roles.includes(currentUser.role))
      .map(item => ({ ...item, label: translate(item.translationKey) }));
    setDynamicBottomMenuItems(filteredBottomItems);

  }, [pathname, user?.role, translate]); 

  const handleLogout = () => {
    logoutUser();
    if (typeof window !== "undefined" && window.innerWidth < 768) { 
        setOpenMobile(false);
    }
    router.push("/login");
  };
  
  const handleNavigation = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
        setOpenMobile(false);
    }
  };

  if (!user) { 
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
                {(item as any).badge && item.roles.includes(user?.role || '') && <SidebarMenuBadge>{(item as any).badge}</SidebarMenuBadge>}
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
      
      <div className="mt-auto"> 
        <SidebarMenu>
          {dynamicBottomMenuItems.map((item) => (
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
                tooltip={{ children: translate('sidebar.logout', 'Logout'), side: "right", align: "center" }}
                className="text-destructive focus:text-destructive hover:bg-destructive/10 focus:bg-destructive/10"
              >
                <LogOut className="h-5 w-5" />
                <span>{translate('sidebar.logout', 'Logout')}</span>
              </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </div>
    </>
  );
}
