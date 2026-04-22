import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { messageService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { ChatPanel } from "@/frontend/components/shared/ChatPanel";
import { cn } from "@/frontend/theme/tokens";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";

export default function CaregiverMessagesPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.caregiverMessages", "Caregiver Messages"));

  const [searchParams] = useSearchParams();
  const toUserId = searchParams.get("to");

  const { data: conversations, loading, refetch } = useAsyncData(
    () => messageService.getConversations("caregiver")
  );

  if (loading || !conversations) return <PageSkeleton cards={3} />;

  return (
    <ChatPanel
      conversations={conversations}
      accentColor={cn.pink}
      accentGradient="radial-gradient(143.86% 887.35% at -10.97% -22.81%, #FEB4C5 0%, #DB869A 100%)"
      initialConvoId={toUserId || (conversations[0]?.id ?? null)}
      onConversationsUpdate={refetch}
    />
  );
}
