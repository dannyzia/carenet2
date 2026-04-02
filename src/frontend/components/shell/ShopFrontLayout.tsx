import { Suspense } from "react";
import { Outlet } from "react-router";
import { PublicNavBar } from "@/frontend/components/navigation/PublicNavBar";
import { PublicFooter } from "@/frontend/components/navigation/PublicFooter";
import { BottomNav } from "@/frontend/components/navigation/BottomNav";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";

/**
 * ShopFrontLayout — shell for customer-facing shop pages (browse, cart, checkout).
 * Mirrors PublicLayout: top bar + BottomNav so “Menu” opens the public drawer (no header hamburger).
 */
export function ShopFrontLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <PublicNavBar />
      <main className="flex-1 pb-16 md:pb-0">
        <Suspense fallback={<div className="p-6 max-w-5xl mx-auto"><PageSkeleton /></div>}>
          <Outlet />
        </Suspense>
      </main>
      <PublicFooter />
      <BottomNav />
    </div>
  );
}