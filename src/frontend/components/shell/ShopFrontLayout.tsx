import { Suspense } from "react";
import { Outlet } from "react-router";
import { PublicNavBar } from "@/frontend/components/navigation/PublicNavBar";
import { BottomNav } from "@/frontend/components/navigation/BottomNav";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";

/**
 * ShopFrontLayout — shell for customer-facing shop pages (browse, cart, checkout)
 */
export function ShopFrontLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <PublicNavBar />
      <main className="flex-1 cn-bottom-spacer md:pb-0">
        <Suspense fallback={<div className="p-6 max-w-5xl mx-auto"><PageSkeleton /></div>}>
          <Outlet />
        </Suspense>
      </main>
      <BottomNav />
    </div>
  );
}