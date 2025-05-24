
"use client"; // Required for hooks

import { MainLayout } from "@/components/layout/main-layout";
import { PageTitle } from "@/components/page-title";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UserCircle } from "lucide-react";
import { useLanguage } from "@/contexts/language-context"; // Added

export default function ProfilePage() {
  const { translate } = useLanguage(); // Added

  return (
    <MainLayout>
      <PageTitle 
        title={translate('profile.title', 'User Profile')} 
        description={translate('profile.description', 'Manage your personal information and preferences.')}
        icon={UserCircle}
      />
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader className="text-center">
          <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-primary">
            <AvatarImage src="https://placehold.co/100x100.png" alt="User Avatar" data-ai-hint="user avatar" />
            <AvatarFallback>{translate('profile.avatarUserFallback', 'SC')}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl">John Doe (Demo User)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="fullName">{translate('profile.fullNameLabel', 'Full Name')}</Label>
              <Input id="fullName" defaultValue="John Doe" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">{translate('profile.emailLabel', 'Email Address')}</Label>
              <Input id="email" type="email" defaultValue="john.doe@example.com" />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="phone">{translate('profile.phoneLabel', 'Phone Number')}</Label>
            <Input id="phone" type="tel" defaultValue="+1 (555) 123-4567" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="address">{translate('profile.addressLabel', 'Address')}</Label>
            <Input id="address" defaultValue="123 Main St, Anytown, USA" />
          </div>
          <div className="flex justify-end pt-4">
            <Button>{translate('profile.saveButton', 'Save Changes')}</Button>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
}

    