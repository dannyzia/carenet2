import { useState, useEffect, useRef } from "react";
import { AlertTriangle, CheckCircle, X } from "lucide-react";
import i18n from "@/frontend/i18n";

interface ActivationConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (note?: string) => Promise<void>;
  type: "approve" | "reject";
  userName: string;
  userRole: string;
}

export function ActivationConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  type,
  userName,
  userRole,
}: ActivationConfirmModalProps) {
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus trap and Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };

    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements?.[0] as HTMLElement;
    const lastElement = focusableElements?.[focusableElements.length - 1] as HTMLElement;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("keydown", handleTab);
    firstElement?.focus();

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("keydown", handleTab);
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const isReject = type === "reject";
  const icon = isReject ? (
    <AlertTriangle className="w-12 h-12 text-red-500" />
  ) : (
    <CheckCircle className="w-12 h-12 text-green-500" />
  );

  const handleConfirm = async () => {
    if (isReject && !note.trim()) {
      return; // Note is required for rejection
    }
    setIsSubmitting(true);
    try {
      await onConfirm(note.trim() || undefined);
      setNote("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div ref={modalRef} className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            {icon}
            <h2 id="modal-title" className="text-xl font-bold text-gray-900">
              {isReject
                ? i18n.t("activation.modal.rejectTitle", { ns: "common" })
                : i18n.t("activation.modal.approveTitle", { ns: "common" })}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={i18n.t("common.close", { ns: "common" })}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          {isReject
            ? i18n.t("activation.modal.rejectConfirm", { ns: "common" })
            : i18n.t("activation.modal.approveConfirm", { ns: "common" })}
        </p>

        {isReject && (
          <div className="mb-6">
            <label htmlFor="rejection-note" className="block text-sm font-medium text-gray-700 mb-2">
              {i18n.t("activation.modal.rejectNoteLabel", { ns: "common" })}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <textarea
              id="rejection-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={i18n.t("activation.modal.rejectNotePlaceholder", { ns: "common" })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              required
              aria-required="true"
            />
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
          >
            {i18n.t("activation.modal.cancel", { ns: "common" })}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting || (isReject && !note.trim())}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-white transition-colors disabled:opacity-50 ${
              isReject
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {isSubmitting
              ? i18n.t("activation.queue.loading", { ns: "common" })
              : i18n.t("activation.modal.confirm", { ns: "common" })}
          </button>
        </div>
      </div>
    </div>
  );
}
