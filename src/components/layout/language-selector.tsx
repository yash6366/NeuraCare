
"use client";

import { useLanguage } from "@/contexts/language-context";
import type { LanguageCode } from "@/contexts/language-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Languages } from "lucide-react";

export function LanguageSelector() {
  const { language, setLanguage, supportedLanguages, translate } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="language-select" className="sr-only">
        {translate('languageSelector.label', 'Select Language')}
      </Label>
      <Select
        value={language}
        onValueChange={(value) => setLanguage(value as LanguageCode)}
      >
        <SelectTrigger id="language-select" className="w-auto h-9 border-none focus:ring-0 focus:ring-offset-0 shadow-none bg-transparent hover:bg-accent/50 px-2 py-1">
          <div className="flex items-center gap-1.5">
            <Languages className="h-4 w-4" />
            <SelectValue placeholder={translate('languageSelector.label', 'Select Language')} />
          </div>
        </SelectTrigger>
        <SelectContent>
          {supportedLanguages.map((lang) => (
            <SelectItem key={lang.value} value={lang.value}>
              {lang.nativeLabel || lang.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

    