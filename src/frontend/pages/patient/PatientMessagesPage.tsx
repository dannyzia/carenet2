import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { messageService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { ChatPanel } from "@/frontend/components/shared/ChatPanel";
import { cn } from "@/frontend/theme/tokens";
import { useSearchParams } from "react-router";
import { Phone, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function PatientMessagesPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.patientMessages", "Patient Messages"));

  const [searchParams] = useSearchParams();
  const toUserId = searchParams.get("to");

  const { data: conversations, loading } = useAsyncData(
    () => messageService.getConversations("patient")
  );

  if (loading || !conversations) return <PageSkeleton cards={3} />;

  return (
    <div className="space-y-5">
      <ChatPanel
        conversations={conversations}
        accentColor="#0288D1"
        accentGradient="var(--cn-gradient-patient, linear-gradient(135deg, #0288D1 0%, #01579B 100%))"
        initialConvoId={toUserId || (conversations[0]?.id ?? null)}
      />
      {/* Emergency contact card */}
      <div
        className="rounded-xl p-4 flex items-center gap-3"
        style={{ background: "rgba(239,68,68,0.05)", borderLeft: "3px solid #EF4444" }}
      >
        <Shield className="w-5 h-5" style={{ color: "#EF4444" }} />
        <div className="flex-1">
          <p className="text-sm" style={{ color: cn.text }}>Emergency Contact</p>
          <p className="text-xs" style={{ color: cn.textSecondary }}>Call 999 or contact your caregiver directly</p>
        </div>
        <a href="tel:999" className="p-2.5 rounded-xl text-white cn-touch-target" style={{ background: "#EF4444" }} aria-label="Call emergency">
          <Phone className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
