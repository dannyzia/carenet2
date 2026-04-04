import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, ZoomIn, ZoomOut, RotateCw, ExternalLink } from "lucide-react";
import { uploadService } from "@/backend/services";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { Button } from "@/frontend/components/ui/button";
import { useTranslation } from "react-i18next";

export default function MedicalDocumentViewerPage() {
  const { t } = useTranslation("common");
  useDocumentTitle(t("pageTitles.medicalDocumentViewer", "Document viewer"));

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  const { data: file, loading } = useAsyncData(
    () => (id ? uploadService.getFile(id) : Promise.resolve(undefined)),
    [id],
  );

  if (!id) {
    return (
      <div className="p-6 text-sm text-muted-foreground">{t("documentViewer.missingId")}</div>
    );
  }

  if (loading) return <PageSkeleton cards={1} />;
  if (!file?.url) {
    return (
      <div className="p-6 max-w-md mx-auto space-y-4">
        <p className="text-sm text-muted-foreground">{t("documentViewer.notFound")}</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          {t("documentViewer.goBack")}
        </Button>
      </div>
    );
  }

  const isImage = file.mimeType.startsWith("image/");
  const isPdf = file.mimeType === "application/pdf" || file.fileName.toLowerCase().endsWith(".pdf");

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-black/95 text-white" data-testid="medical-document-viewer">
      <header
        className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-white/10 shrink-0"
        style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top, 0px))" }}
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10"
          onClick={() => navigate(-1)}
          aria-label={t("documentViewer.goBack")}
        >
          <ArrowLeft className="size-4 mr-1" />
          {t("documentViewer.goBack")}
        </Button>
        <span className="text-sm font-medium truncate flex-1 min-w-[8rem]" title={file.fileName}>
          {file.fileName}
        </span>
        {isImage ? (
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
              onClick={() => setScale((s) => Math.min(4, s + 0.25))}
            >
              <ZoomIn className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
              onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
            >
              <ZoomOut className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
              onClick={() => setRotation((r) => (r + 90) % 360)}
            >
              <RotateCw className="size-4" />
            </Button>
          </>
        ) : null}
        <Button type="button" variant="ghost" size="sm" className="text-white hover:bg-white/10" asChild>
          <a href={file.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-4 mr-1 inline" />
            {t("documentViewer.openTab")}
          </a>
        </Button>
      </header>

      <div className="flex-1 overflow-auto flex items-center justify-center p-4 touch-pan-y">
        {isImage ? (
          <img
            src={file.url}
            alt=""
            className="max-w-none select-none"
            style={{
              transform: `rotate(${rotation}deg) scale(${scale})`,
              transition: "transform 0.2s ease-out",
            }}
            draggable={false}
          />
        ) : isPdf ? (
          <iframe title={file.fileName} src={file.url} className="w-full h-full min-h-[70vh] bg-white rounded-lg" />
        ) : (
          <div className="text-center space-y-4 max-w-sm">
            <p className="text-sm text-white/80">{t("documentViewer.previewUnavailable")}</p>
            <Button asChild>
              <a href={file.url} target="_blank" rel="noopener noreferrer">
                {t("documentViewer.openTab")}
              </a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
