
"use client"; 

import { MainLayout } from "@/components/layout/main-layout";
import { PageTitle } from "@/components/page-title";
import { AiChatAssistantClient } from "@/components/ai-chat-assistant/ai-chat-assistant-client";
import { Bot } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

export default function AiChatAssistantPage() {
  const { translate } = useLanguage();

  return (
    <MainLayout>
      <PageTitle 
        title={translate('aiChatAssistant.title', 'AI Chat Assistant')}
        description={translate('aiChatAssistant.description', 'Engage with our intelligent AI for quick answers and assistance.')}
        icon={Bot}
      />
      <AiChatAssistantClient />
    </MainLayout>
  );
}
