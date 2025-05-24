
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, User, KeyRound, Hospital } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { loginUser } from "@/lib/auth"; 
import { useLanguage } from "@/contexts/language-context"; // Added

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { translate } = useLanguage(); // Added
  const [email, setEmail] = useState("admin123@gmail.com"); 
  const [password, setPassword] = useState("Admin@123"); 
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const user = await loginUser(email.trim(), password.trim());

      if (user) {
        toast({
          title: "Login Successful", // Consider translating toast messages too
          description: `Welcome back, ${user.name}! Redirecting...`,
        });
        router.push("/dashboard"); 
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid email or password. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Login Error",
        description: error.message || "An unexpected error occurred. Please try again.",
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
            {isLoading ? "Logging in..." : translate('login.button', 'Login')}
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
        <div className="relative w-full my-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or log in using
            </span>
          </div>
        </div>
        <Button variant="outline" className="w-full" onClick={() => toast({ title: "Feature not implemented", description: "Face Recognition login is a conceptual feature."})} disabled={isLoading}>
          <Eye className="mr-2 h-5 w-5" />
          Face Recognition
        </Button>
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
         <div className="text-xs text-muted-foreground mt-4 space-y-1 text-center">
          <p className="font-semibold">Demo Note:</p>
          <p>To log in, users (including Admins) must first be registered via the 'Register here' link. The example credentials below can be used for registration if they don't already exist in the database.</p>
          <p>Example Admin: admin123@gmail.com / Admin@123</p>
          <p>Example Doctor: doctor.strange@example.com / Doctor@123</p>
          <p>Example Patient: patient.doe@example.com / Patient@123</p>
        </div>
      </CardFooter>
    </Card>
  );
}

    