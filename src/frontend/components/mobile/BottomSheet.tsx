import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/frontend/theme/tokens";

/**
 * BottomSheet — Reusable mobile bottom sheet for filters, actions, confirmations.
 * Slides up from bottom on mobile; renders as centered modal on desktop.
 * Supports drag-to-dismiss gesture via a drag handle.
 */

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxHeight?: number;
  showHandle?: boolean;
}

export function BottomSheet({ open, onClose, title, children, maxHeight = 85, showHandle = true }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setDragY(0);
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) setDragY(dy);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (dragY > 100) {
      onClose();
    }
    setDragY(0);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
        style={{ opacity: isDragging ? 0.3 : 1 }}
      />

      <div
        ref={sheetRef}
        className="relative z-10 w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl overflow-hidden"
        style={{
          maxHeight: `${maxHeight}vh`,
          transform: `translateY(${dragY}px)`,
          transition: isDragging ? "none" : "transform 0.3s ease",
          boxShadow: "0 -8px 30px rgba(0,0,0,0.12)",
        }}
      >
        {showHandle && (
          <div
            className="flex justify-center pt-3 pb-1 cursor-grab sm:hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="w-10 h-1 rounded-full" style={{ background: cn.border }} />
          </div>
        )}

        {title && (
          <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: cn.borderLight }}>
            <h3 className="text-sm" style={{ color: cn.text }}>{title}</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg cn-touch-target" style={{ color: cn.textSecondary }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="overflow-y-auto p-5" style={{ maxHeight: `calc(${maxHeight}vh - 80px)` }}>
          {children}
        </div>
      </div>
    </div>
  );
}