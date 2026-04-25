import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { useDocumentTitle } from "@/frontend/hooks";
import { Button } from "@/frontend/components/ui/button";
import { cn } from "@/frontend/theme/tokens";

export default function HomePage() {
  const { t } = useTranslation("common");
  useDocumentTitle(t("pageTitles.home", "Home"));

  return (
    <div className="min-h-screen" style={{ backgroundColor: cn.bgPage }}>

      {/* Hero Section */}
      <div
        className="relative overflow-hidden"
        style={{ backgroundColor: "#FFF5F7" }}
      >
        {/* Background Pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(254, 180, 197, 0.05) 0%, rgba(254, 180, 197, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(254, 180, 197, 0.05) 0%, rgba(254, 180, 197, 0.05) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(254, 180, 197, 0.05) 0%, rgba(254, 180, 197, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(254, 180, 197, 0.05) 0%, rgba(254, 180, 197, 0.05) 0%, transparent 50%)`,
          }}
        />

        {/* Hero Content */}
        <div className="relative z-10 px-6 py-16 md:py-24 dark:bg-[#0F172A]">
          {/* Dark mode decorative gradient orbs */}
          <div className="hidden dark:block absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-[rgba(233,154,175,0.12)] blur-3xl" />
            <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-[rgba(114,204,120,0.10)] blur-3xl" />
          </div>
          <div className="relative max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1
                className="mb-4 text-5xl md:text-6xl dark:text-white"
                style={{ color: cn.textHeading }}
              >
                {t("home.hero.brand", "CareNet")}
              </h1>
              <p
                className="mb-8 text-xl md:text-2xl dark:text-slate-300"
                style={{ color: cn.textSecondary }}
              >
                {t("home.hero.tagline", "Quality care, connected")}
              </p>
              <p
                className="mb-6 text-base md:text-lg dark:text-slate-200"
                style={{ color: cn.text }}
              >
                {t(
                  "home.hero.subtitle",
                  "Bangladesh's trusted platform for connecting families with verified caregivers and professional agencies"
                )}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
                <Link to="/auth/demo-access" className="no-underline w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="px-8 h-12 w-full sm:w-auto dark:shadow-[0px_4px_24px_rgba(2,136,209,0.28)]"
                    style={{
                      background: "var(--cn-gradient-patient)",
                      color: "white",
                      boxShadow: "0px 4px 18px rgba(2, 136, 209, 0.38)",
                      fontWeight: "500",
                      border: "none",
                    }}
                  >
                    {t("home.hero.experienceApp", "Experience the App")}
                  </Button>
                </Link>
                <Link to="/auth/login" className="no-underline w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="px-8 h-12 w-full sm:w-auto dark:shadow-[0px_4px_24px_rgba(233,154,175,0.3)]"
                    style={{
                      background: "var(--cn-gradient-caregiver)",
                      color: "white",
                      boxShadow: "0px 4px 18px rgba(240, 161, 180, 0.35)",
                      fontWeight: "500",
                    }}
                  >
                    {t("home.hero.signInRegister", "Sign in / Register")}
                  </Button>
                </Link>
                <Link to="/marketplace">
                  <Button
                    size="lg"
                    className="px-8 h-12 w-full sm:w-auto dark:shadow-[0px_4px_24px_rgba(114,204,120,0.3)]"
                    style={{
                      background: "var(--cn-gradient-guardian)",
                      color: "white",
                      boxShadow: "0px 4px 18px rgba(124, 229, 119, 0.35)",
                      fontWeight: "500",
                      border: "none",
                    }}
                  >
                    {t("home.hero.jobPortal", "Job Portal")}
                  </Button>
                </Link>
                <Link to="/shop">
                  <Button
                    size="lg"
                    className="px-8 h-12 w-full sm:w-auto dark:shadow-[0px_4px_24px_rgba(255,110,64,0.3)]"
                    style={{
                      background: "var(--cn-gradient-shop)",
                      color: "white",
                      boxShadow: "0px 4px 18px rgba(230, 74, 25, 0.35)",
                      fontWeight: "500",
                      border: "none",
                    }}
                  >
                    {t("home.hero.careShop", "Care Shop")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
