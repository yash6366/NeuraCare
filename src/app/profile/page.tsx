
"use client"; 

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { PageTitle } from "@/components/page-title";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UserCircle, BriefcaseMedical, Phone, Home, Mail, Save } from "lucide-react"; // Added Mail, Save
import { useLanguage } from "@/contexts/language-context"; 
import { getCurrentUser, updateCurrentUserInLocalStorage, type AppUser, type Patient, type Doctor } from "@/lib/auth"; 
import { updateUserProfile } from "@/lib/actions/user.actions"; // New server action
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast"; // For notifications

export default function ProfilePage() {
  const { translate } = useLanguage(); 
  const { toast } = useToast();
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state for editable fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(""); // Display only
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    if (currentUser) {
      setFullName(currentUser.name || "");
      setEmail(currentUser.email || "");
      setPhoneNumber(currentUser.phoneNumber || "");
      setAddress(currentUser.address || "");
    }
    setLoading(false);
  }, []);

  const handleSaveChanges = async () => {
    if (!user) return;
    setIsSaving(true);

    const result = await updateUserProfile(user.id, {
      name: fullName,
      phoneNumber,
      address,
    });

    if (result.success && result.updatedUser) {
      setUser(result.updatedUser); // Update local state with data from server
      updateCurrentUserInLocalStorage(result.updatedUser); // Update localStorage
      setFullName(result.updatedUser.name || "");
      setPhoneNumber(result.updatedUser.phoneNumber || "");
      setAddress(result.updatedUser.address || "");
      toast({
        title: translate('profile.toast.successTitle', 'Profile Updated'),
        description: translate('profile.toast.successDescription', 'Your profile has been successfully updated.'),
      });
    } else {
      toast({
        title: translate('profile.toast.errorTitle', 'Update Failed'),
        description: result.message || translate('profile.toast.errorDescription', 'Could not update your profile. Please try again.'),
        variant: "destructive",
      });
    }
    setIsSaving(false);
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
          <CardTitle className="text-2xl">{fullName || user.name}</CardTitle>
          <CardDescription className="flex items-center justify-center gap-2">
            <BriefcaseMedical className="h-4 w-4 text-muted-foreground" /> 
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
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={isSaving} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">
                <Mail className="inline h-4 w-4 mr-1 text-muted-foreground"/>
                {translate('profile.emailLabel', 'Email Address')}
              </Label>
              <Input id="email" type="email" value={email} readOnly disabled className="bg-muted/50 cursor-not-allowed" />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="phone">
              <Phone className="inline h-4 w-4 mr-1 text-muted-foreground"/>
              {translate('profile.phoneLabel', 'Phone Number')}
            </Label>
            <Input id="phone" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder={translate('profile.phonePlaceholder', 'e.g., +1 123-456-7890')} disabled={isSaving} />
            {user.role === 'patient' && (user as Patient).emergencyContactPhone && 
              <p className="text-xs text-muted-foreground">{translate('profile.emergencyContactNote', 'This is your emergency contact number.')}</p>
            }
          </div>
          <div className="space-y-1">
            <Label htmlFor="address">
              <Home className="inline h-4 w-4 mr-1 text-muted-foreground"/>
              {translate('profile.addressLabel', 'Address')}
            </Label>
            <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder={translate('profile.addressPlaceholder', 'e.g., 123 Health St, MedCity')} disabled={isSaving}/>
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveChanges} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Save className="mr-2 h-4 w-4 animate-spin" />
                  {translate('profile.savingButton', 'Saving...')}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {translate('profile.saveButton', 'Save Changes')}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
