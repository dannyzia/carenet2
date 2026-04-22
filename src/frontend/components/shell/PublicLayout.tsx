import { Suspense } from "react";
import { Outlet } from "react-router";
import { PublicNavBar } from "@/frontend/components/navigation/PublicNavBar";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { BottomNav } from "@/frontend/components/navigation/BottomNav";

/**
 * PublicLayout — shell for public-facing pages
 * Provides: PublicNavBar + BottomNav (no footer - mobile app feel)
 */
export function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <PublicNavBar />
      <main className="flex-1 cn-bottom-spacer">
        <Suspense fallback={<div className="p-6 max-w-5xl mx-auto"><PageSkeleton /></div>}>
          <Outlet />
        </Suspense>
      </main>
      <BottomNav />
    </div>
  );
}