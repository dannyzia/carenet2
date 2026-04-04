import type { ReactNode } from "react";
import { cn } from "@/frontend/theme/tokens";

export function Section15PageLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-20 px-1">
      <div>
        <h1 className="text-2xl" style={{ color: cn.text }}>
          {title}
        </h1>
        {subtitle ? (
          <p className="text-sm mt-1" style={{ color: cn.textSecondary }}>
            {subtitle}
          </p>
        ) : null}
      </div>
      {children}
    </div>
  );
}
