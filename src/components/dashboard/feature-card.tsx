import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface FeatureCardProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

export function FeatureCard({ title, description, href, icon: Icon }: FeatureCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Icon className="h-7 w-7 text-primary" />
        </div>
        <div className="flex-1">
          <CardTitle className="text-xl">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <CardDescription className="text-base">{description}</CardDescription>
      </CardContent>
      <CardContent>
         <Link href={href} passHref legacyBehavior>
            <Button variant="outline" className="w-full mt-auto">
              Access Feature <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
      </CardContent>
    </Card>
  );
}
