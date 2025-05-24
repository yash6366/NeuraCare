
"use client"; 

import { useRouter } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Hospital, Bell, Settings, LogOut, UserCircle as UserIconLucide } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutUser, getCurrentUser } from "@/lib/auth";
import { useEffect, useState } from "react";
import type { AppUser } from "@/types";
import { LanguageSelector } from "./language-selector"; // Added
import { useLanguage } from "@/contexts/language-context"; // Added

export function Header() {
  const router = useRouter();
  const { translate } = useLanguage(); // Added
  const [user, setUser] = useState<AppUser | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const handleLogout = () => {
    logoutUser();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <SidebarTrigger />
      </div>
      <Link href="/dashboard" className="hidden items-center gap-2 md:flex mr-auto">
        <Hospital className="h-7 w-7 text-primary" />
        <span className="text-xl font-semibold">{translate('app.name', 'SmartCare Hub')}</span>
      </Link>
      
      <div className="flex items-center gap-2 sm:gap-4 ml-auto"> {/* Adjusted gap for responsiveness */}
        <LanguageSelector /> {/* Added */}
        <Button variant="ghost" size="icon" aria-label={translate('header.notifications', 'Notifications')}>
          <Bell className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" aria-label={translate('header.settings', 'Settings')}>
          <Settings className="h-5 w-5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src="https://placehold.co/100x100.png" alt="User Avatar" data-ai-hint="user avatar" />
                <AvatarFallback>{user?.name?.charAt(0)?.toUpperCase() || translate('header.userAvatarFallback', 'U')}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              {user ? user.name : translate('header.myAccount', 'My Account')}
              {user && <span className="block text-xs text-muted-foreground font-normal">{user.email} ({user.role})</span>}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile"><UserIconLucide className="mr-2 h-4 w-4" />{translate('sidebar.profile', 'Profile')}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <Settings className="mr-2 h-4 w-4" />{translate('header.settings', 'Settings')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive focus:bg-destructive/10">
              <LogOut className="mr-2 h-4 w-4" />
              {translate('header.logout', 'Logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

    