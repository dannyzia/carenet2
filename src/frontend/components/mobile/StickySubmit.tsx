import { cn } from "@/frontend/theme/tokens";

/**
 * StickySubmit — Sticky bottom submit button for forms.
 * Sticks to the bottom of the viewport on mobile, inline on desktop.
 */

interface StickySubmitProps {
  label: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  secondaryLabel?: string;
  onSecondaryClick?: () => void;
  gradient?: string;
  loading?: boolean;
}

export function StickySubmit({
  label,
  onClick,
  type = "button",
  disabled = false,
  secondaryLabel,
  onSecondaryClick,
  gradient = "var(--cn-gradient-caregiver)",
  loading = false,
}: StickySubmitProps) {
  return (
    <>
      <div className="h-[var(--cn-sticky-submit-height)] md:hidden" />

      <div
        className="fixed bottom-0 left-0 right-0 z-40 p-4 md:static md:p-0 md:mt-6"
        style={{
          background: `linear-gradient(transparent, ${cn.bgCard} 20%)`,
        }}
      >
        <div className="flex gap-3 max-w-2xl mx-auto">
          {secondaryLabel && (
            <button
              type="button"
              onClick={onSecondaryClick}
              className="flex-1 md:flex-none py-3.5 px-6 rounded-xl border text-sm cn-touch-target"
              style={{ borderColor: cn.border, color: cn.text }}
            >
              {secondaryLabel}
            </button>
          )}
          <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className="flex-1 py-3.5 px-6 rounded-xl text-white text-sm cn-touch-target transition-all disabled:opacity-50"
            style={{ background: gradient }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              label
            )}
          </button>
        </div>
      </div>
    </>
  );
}