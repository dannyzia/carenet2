import { Suspense } from "react";
import { Outlet, useNavigate } from "react-router";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { useAuth } from "@/frontend/auth/AuthContext";
import { LogOut } from "lucide-react";

/**
 * GatedLayout — shell for activation holding pages
 * Provides: minimal layout for users whose accounts are not yet approved
 * Shows app logo + Log Out button in the top-right so gated users can always exit
 */
export function GatedLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/auth/login");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#FEB4C5] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">CN</span>
          </div>
          <span className="font-semibold text-gray-900">CareNet</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Log Out</span>
        </button>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <Suspense fallback={<div className="w-full max-w-md"><PageSkeleton /></div>}>
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </Suspense>
      </main>
    </div>
  );
}
