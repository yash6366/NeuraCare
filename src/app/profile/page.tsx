
"use client"; 

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { PageTitle } from "@/components/page-title";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UserCircle, Briefcase, Phone, Home } from "lucide-react";
import { useLanguage } from "@/contexts/language-context"; 
import { getCurrentUser, type AppUser, type Patient, type Doctor } from "@/lib/auth"; // Updated imports
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
  const { translate } = useLanguage(); 
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state - these would be updated by user input
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    if (currentUser) {
      setFullName(currentUser.name);
      setEmail(currentUser.email);
      // Placeholder data for phone and address, as they are not stored in AppUser currently
      setPhoneNumber((currentUser as Patient)?.emergencyContactPhone || translate('profile.phonePlaceholder', 'e.g., +1 123-456-7890'));
      setAddress(translate('profile.addressPlaceholder', 'e.g., 123 Health St, MedCity'));
    }
    setLoading(false);
  }, [translate]);

  const handleSaveChanges = () => {
    // In a real app, this would save changes to the backend
    // For this prototype, we can update the state or show a toast
    // Example: user.name = fullName; user.email = email; etc.
    // localStorage.setItem('smartcare_user', JSON.stringify(user)); // If updating local storage
    alert(translate('profile.saveChangesAlert', 'Changes saved (simulated)!'));
  };

  if (loading) {
    return (
      <MainLayout>
        <PageTitle 
          title={translate('profile.title', 'User Profile')} 
          description={translate('profile.description', 'Manage your personal information and preferences.')}
          icon={UserCircle}
        />
        <Card className="max-w-2xl mx-auto shadow-lg">
          <CardHeader className="text-center items-center">
            <Skeleton className="w-24 h-24 rounded-full mb-4" />
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-6 p-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1"><Skeleton className="h-6 w-24 mb-1" /><Skeleton className="h-10 w-full" /></div>
                <div className="space-y-1"><Skeleton className="h-6 w-24 mb-1" /><Skeleton className="h-10 w-full" /></div>
             </div>
            <div className="space-y-1"><Skeleton className="h-6 w-24 mb-1" /><Skeleton className="h-10 w-full" /></div>
            <div className="space-y-1"><Skeleton className="h-6 w-24 mb-1" /><Skeleton className="h-10 w-full" /></div>
            <div className="flex justify-end pt-4"><Skeleton className="h-10 w-32" /></div>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
         <PageTitle 
          title={translate('profile.title', 'User Profile')} 
          description={translate('profile.description', 'Manage your personal information and preferences.')}
          icon={UserCircle}
        />
        <Card className="max-w-2xl mx-auto shadow-lg">
          <CardHeader><CardTitle>{translate('profile.error.userNotFoundTitle', 'User Not Found')}</CardTitle></CardHeader>
          <CardContent><p>{translate('profile.error.userNotFoundDescription', 'Please log in to view your profile.')}</p></CardContent>
        </Card>
      </MainLayout>
    );
  }

  const userRoleDisplay = user.role.charAt(0).toUpperCase() + user.role.slice(1);

  return (
    <MainLayout>
      <PageTitle 
        title={translate('profile.title', 'User Profile')} 
        description={translate('profile.description', 'Manage your personal information and preferences.')}
        icon={UserCircle}
      />
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader className="items-center text-center">
          <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-primary">
            <AvatarImage src={`https://placehold.co/100x100.png?text=${user.name.charAt(0)}`} alt={translate('profile.avatarAlt', 'User Avatar')} data-ai-hint="user avatar" />
            <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl">{user.name}</CardTitle>
          <CardDescription className="flex items-center justify-center gap-2">
            <Briefcase className="h-4 w-4 text-muted-foreground" /> 
            <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'doctor' ? 'secondary' : 'default'}>
              {translate(`profile.role.${user.role}`, userRoleDisplay)}
            </Badge>
            {user.role === 'doctor' && (user as Doctor).specialty && (
              <span className="text-sm text-muted-foreground">({(user as Doctor).specialty})</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="fullName">{translate('profile.fullNameLabel', 'Full Name')}</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">{translate('profile.emailLabel', 'Email Address')}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="phone">
              <Phone className="inline h-4 w-4 mr-1 text-muted-foreground"/>
              {translate('profile.phoneLabel', 'Phone Number')}
            </Label>
            <Input id="phone" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder={translate('profile.phonePlaceholder', 'e.g., +1 123-456-7890')} />
            {user.role === 'patient' && (user as Patient).emergencyContactPhone && 
              <p className="text-xs text-muted-foreground">{translate('profile.emergencyContactNote', 'This is your emergency contact number.')}</p>
            }
          </div>
          <div className="space-y-1">
            <Label htmlFor="address">
              <Home className="inline h-4 w-4 mr-1 text-muted-foreground"/>
              {translate('profile.addressLabel', 'Address')}
            </Label>
            <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder={translate('profile.addressPlaceholder', 'e.g., 123 Health St, MedCity')} />
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveChanges}>{translate('profile.saveButton', 'Save Changes')}</Button>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
