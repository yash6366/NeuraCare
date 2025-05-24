
import type { LucideIcon } from "lucide-react";
// Note: Translations for titles/descriptions will be passed directly if needed from parent pages

interface PageTitleProps {
  title: string; // Will now be the translated title passed from the page
  description?: string; // Will now be the translated description passed from the page
  icon?: LucideIcon;
}

export function PageTitle({ title, description, icon: Icon }: PageTitleProps) {
  return (
    <div className="mb-6 md:mb-8">
      <div className="flex items-center gap-3">
        {Icon && <Icon className="h-8 w-8 text-primary" />}
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
      </div>
      {description && (
        <p className="mt-2 text-lg text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

    