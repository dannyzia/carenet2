import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Heart } from "lucide-react";
import { supabase, USE_SUPABASE } from "@/backend/services/supabase";
import { cn } from "@/frontend/theme/tokens";
import { roleDashboardPath } from "@/backend/navigation/roleAppPaths";

export default function OAuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!USE_SUPABASE) {
      navigate("/auth/login", { replace: true });
      return;
    }

    // Exchange the OAuth code for a session
    const processCallback = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("OAuth callback error:", error);
        navigate("/auth/login?error=oauth_failed", { replace: true });
        return;
      }

      if (data.session) {
        // Session created — redirect to role selection or dashboard
        const user = data.session.user;
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, active_role")
          .eq("id", user.id)
          .single();

        if (!profile?.active_role) {
          navigate("/auth/role-selection", { replace: true });
        } else {
          navigate(roleDashboardPath(profile.active_role as any), { replace: true });
        }
      } else {
        // No session — go to login
        navigate("/auth/login?error=no_session", { replace: true });
      }
    };

    processCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: cn.bgPage }}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 animate-pulse" style={{ background: "radial-gradient(143.86% 887.35% at -10.97% -22.81%, #FEB4C5 0%, #DB869A 100%)", boxShadow: "0px 4px 18px rgba(240,161,180,0.35)" }}>
        <Heart className="w-7 h-7 text-white" />
      </div>
      <p className="text-sm" style={{ color: cn.textSecondary }}>Completing sign in...</p>
    </div>
  );
}