
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { User, KeyRound, Mail, UserPlus, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { registerUserWithCredentials } from "@/lib/actions/auth.actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/language-context"; 

export function RegisterForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { translate } = useLanguage(); 
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<'patient' | 'doctor'>("patient"); // Default to patient, admin removed
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!fullName || !email || !password || !confirmPassword) {
      toast({
        title: translate('register.toast.failureTitle', 'Registration Failed'),
        description: translate('register.toast.fillAllFields', 'Please fill in all required fields.'),
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: translate('register.toast.failureTitle', 'Registration Failed'),
        description: translate('register.toast.passwordsDontMatch', 'Passwords do not match.'),
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const result = await registerUserWithCredentials({ 
      fullName, 
      email, 
      password, 
      role,
      emergencyContactPhone: role === 'patient' ? emergencyContactPhone : undefined 
    });

    if (result.success) {
      toast({
        title: translate('register.toast.successTitle', 'Registration Successful'),
        description: result.message || translate('register.toast.successDescription', 'Your account has been created. Please log in.'),
      });
      router.push("/login");
    } else {
      toast({
        title: translate('register.toast.failureTitle', 'Registration Failed'),
        description: result.message || translate('register.toast.errorDescription', 'An error occurred. Please try again.'),
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <UserPlus className="h-16 w-16 text-primary" />
        </div>
        <CardTitle className="text-3xl font-bold">{translate('register.title', 'Create Account')}</CardTitle>
        <CardDescription>{translate('register.description', 'Join SmartCare Hub today.')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="fullName">{translate('register.fullNameLabel', 'Full Name')}</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="pl-10"
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{translate('register.emailLabel', 'Email')}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10"
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{translate('register.passwordLabel', 'Password')}</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="•••••••• (min. 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{translate('register.confirmPasswordLabel', 'Confirm Password')}</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="pl-10"
                disabled={isLoading}
              />
            </div>
          </div>
           <div className="space-y-2">
            <Label htmlFor="role">{translate('register.roleLabel', 'Register as')}</Label>
            <Select value={role} onValueChange={(value) => setRole(value as 'patient' | 'doctor')} disabled={isLoading}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="patient">{translate('register.role.patient','Patient')}</SelectItem>
                <SelectItem value="doctor">{translate('register.role.doctor','Doctor')}</SelectItem>
                {/* Admin role removed from selectable options */}
              </SelectContent>
            </Select>
          </div>

          {role === 'patient' && (
            <div className="space-y-2">
              <Label htmlFor="emergencyContactPhone">{translate('register.emergencyContactLabel', 'Emergency Contact Phone (Optional)')}</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="emergencyContactPhone"
                  type="tel"
                  placeholder="+12345678900"
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? translate('register.buttonLoading', 'Registering...') : translate('register.button', 'Create Account')}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-2 pt-6">
        <div className="text-sm text-muted-foreground">
          {translate('register.loginLink').split('Log in')[0]}
          <Link href="/login" className="font-medium text-primary hover:underline">
             {translate('register.loginLink').split('? ')[1] || 'Log in'}
          </Link>
        </div>
         <p className="px-8 text-center text-sm text-muted-foreground pt-2">
          By clicking create account, you agree to our{" "}
          <a href="#" className="underline underline-offset-4 hover:text-primary">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="underline underline-offset-4 hover:text-primary">
            Privacy Policy
          </a>
          .
        </p>
      </CardFooter>
    </Card>
  );
}
