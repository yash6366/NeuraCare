
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { User, KeyRound, Hospital } from "lucide-react"; 
import { useToast } from "@/hooks/use-toast";
import { loginUser } from "@/lib/auth"; 
import { useLanguage } from "@/contexts/language-context"; 

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { translate } = useLanguage(); 
  const [email, setEmail] = useState("admin123@gmail.com"); 
  const [password, setPassword] = useState("Admin@123"); 
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const user = await loginUser(email.trim().toLowerCase(), password.trim()); // Email to lowercase

      if (user) {
        toast({
          title: translate('login.toast.successTitle', 'Login Successful'),
          description: translate('login.toast.successDescription', 'Welcome back, {userName}! Redirecting...').replace('{userName}', user.name),
        });
        router.push("/dashboard"); 
      } else {
        toast({
          title: translate('login.toast.failureTitle', 'Login Failed'),
          description: translate('login.toast.failureDescription', 'Invalid email or password. Please try again.'),
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: translate('login.toast.errorTitle', 'Login Error'),
        description: error.message || translate('login.toast.errorDescription', 'An unexpected error occurred. Please try again.'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <Hospital className="h-16 w-16 text-primary" />
        </div>
        <CardTitle className="text-3xl font-bold">{translate('login.title', 'SmartCare Hub Login')}</CardTitle>
        <CardDescription>{translate('login.description', 'Access your intelligent healthcare companion.')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">{translate('login.emailLabel', 'Email')}</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
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
            <Label htmlFor="password">{translate('login.passwordLabel', 'Password')}</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10"
                disabled={isLoading}
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? translate('login.buttonLoading', 'Logging in...') : translate('login.button', 'Login')}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-4 pt-6">
        <div className="text-sm text-muted-foreground">
          {translate('login.registerLink').split('Register here')[0]}
          <Link href="/register" className="font-medium text-primary hover:underline">
            {translate('login.registerLink').split('? ')[1] || 'Register here'}
          </Link>
        </div>
        <p className="px-8 pt-2 text-center text-sm text-muted-foreground">
          By clicking continue, you agree to our{" "}
          <a href="#" className="underline underline-offset-4 hover:text-primary">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="underline underline-offset-4 hover:text-primary">
            Privacy Policy
          </a>
          .
        </p>
        {/* Demo Note section removed */}
      </CardFooter>
    </Card>
  );
}
