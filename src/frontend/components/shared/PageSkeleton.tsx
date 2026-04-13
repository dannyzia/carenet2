/**
 * PageSkeleton — Full-page loading skeleton with animated shimmer.
 * Provides consistent loading UX across all async-loaded pages.
 */

interface PageSkeletonProps {
  /** Number of card skeletons to show (default: 3) */
  cards?: number;
  /** Show the page header skeleton (default: true) */
  header?: boolean;
  /** Compact operational dashboard: title row + action chips + queue list */
  variant?: "default" | "dashboard";
}

export function PageSkeleton({ cards = 3, header = true, variant = "default" }: PageSkeletonProps) {
  if (variant === "dashboard") {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="h-8 w-56 max-w-full rounded-lg" style={{ background: "rgba(219,134,154,0.15)" }} />
            <div className="h-4 w-40 max-w-full rounded-md" style={{ background: "rgba(132,132,132,0.1)" }} />
          </div>
          <div className="h-8 w-24 rounded-full shrink-0" style={{ background: "rgba(232,168,56,0.2)" }} />
        </div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 w-28 rounded-xl" style={{ background: "rgba(95,184,101,0.12)" }} />
          ))}
        </div>
        <div
          className="rounded-xl border overflow-hidden"
          style={{ borderColor: "rgba(132,132,132,0.12)", background: "rgba(255,255,255,0.5)" }}
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-14 px-4 border-b last:border-b-0 flex items-center gap-3"
              style={{ borderColor: "rgba(132,132,132,0.08)" }}
            >
              <div className="h-3 flex-1 rounded" style={{ background: "rgba(132,132,132,0.08)" }} />
              <div className="h-3 w-16 rounded shrink-0" style={{ background: "rgba(132,132,132,0.06)" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-pulse">
      {header && (
        <div className="space-y-3">
          <div className="h-7 w-48 rounded-lg" style={{ background: "rgba(219,134,154,0.15)" }} />
          <div className="h-4 w-72 rounded-md" style={{ background: "rgba(132,132,132,0.1)" }} />
        </div>
      )}
      {Array.from({ length: cards }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{
        background: "rgba(255,255,255,0.95)",
        border: "1px solid rgba(255,255,255,0.4)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
      }}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full" style={{ background: "rgba(219,134,154,0.12)" }} />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-32 rounded" style={{ background: "rgba(83,83,83,0.08)" }} />
          <div className="h-3 w-48 rounded" style={{ background: "rgba(132,132,132,0.06)" }} />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded" style={{ background: "rgba(132,132,132,0.06)" }} />
        <div className="h-3 w-3/4 rounded" style={{ background: "rgba(132,132,132,0.04)" }} />
      </div>
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-6 w-16 rounded-full" style={{ background: "rgba(95,184,101,0.08)" }} />
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="flex gap-4 py-3 px-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-3 flex-1 rounded" style={{ background: "rgba(132,132,132,0.08)" }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-3 px-4 rounded-xl" style={{ background: i % 2 === 0 ? "rgba(245,247,250,0.5)" : "transparent" }}>
          {[1, 2, 3, 4].map((j) => (
            <div key={j} className="h-3 flex-1 rounded" style={{ background: "rgba(132,132,132,0.05)" }} />
          ))}
        </div>
      ))}
    </div>
  );
}
