import React, { useMemo } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { useDocumentTitle } from "@/frontend/hooks";
import {
  Shield,
  Clock,
  Users,
  Star,
  Phone,
  Mail,
} from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { cn } from "@/frontend/theme/tokens";

export default function HomePage() {
  const { t, i18n } = useTranslation("common");
  useDocumentTitle(t("pageTitles.home", "Home"));

  /** Stats labels — keys under `home.stats.*` (run `npm run i18n:refresh` then `translate`) */
  const stats = [
    {
      value: "10,000+",
      labelKey: "home.stats.verifiedCaregivers",
      labelDefault: "Verified Caregivers",
      icon: Shield,
    },
    {
      value: "24/7",
      labelKey: "home.stats.support",
      labelDefault: "Support Available",
      icon: Clock,
    },
    {
      value: "98%",
      labelKey: "home.stats.satisfaction",
      labelDefault: "Satisfaction Rate",
      icon: Star,
    },
    {
      value: "5000+",
      labelKey: "home.stats.families",
      labelDefault: "Happy Families",
      icon: Users,
    },
  ];

  /** Feature cards — literal `t("…")` keys so i18next-parser can extract */
  const features = useMemo(
    () => [
      {
        emoji: "\u{1F6E1}\uFE0F",
        icon: Shield,
        title: t("home.features.verified.title", "Verified Caregivers"),
        description: t(
          "home.features.verified.description",
          "Background-checked, certified, and trusted professionals—screened through police verification, health checks, and psychological evaluation."
        ),
      },
      {
        emoji: "\u{1F3E2}",
        icon: Users,
        title: t("home.features.agency.title", "Vetted Agency Network"),
        description: t(
          "home.features.agency.description",
          "Licensed, high-performing agencies with proven reliability and compliance standards."
        ),
      },
      {
        emoji: "\u{1F4CD}",
        icon: Clock,
        title: t("home.features.tracking.title", "Real-Time Care Tracking"),
        description: t(
          "home.features.tracking.description",
          "Full visibility into caregiver schedules and service delivery—bringing transparency and accountability."
        ),
      },
      {
        emoji: "\u{1F9E9}",
        icon: Shield,
        title: t("home.features.platform.title", "Single Integrated Platform"),
        description: t(
          "home.features.platform.description",
          "Discover, book, manage, communicate, pay, and track—everything from one powerful dashboard."
        ),
      },
    ],
    [t, i18n.language]
  );

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
                <Link to="/experience" className="no-underline w-full sm:w-auto">
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

      {/* Features Section */}
      <div
        id="features-section"
        className="px-6 py-12"
        style={{ backgroundColor: cn.bgPage }}
      >
        <div className="max-w-4xl mx-auto">
          <h2
            className="mb-8 md:mb-12 text-center text-3xl md:text-4xl lg:text-5xl"
            style={{ color: cn.text }}
          >
            {t("home.features.sectionTitle", "Why CareNet?")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => {
              return (
                <div
                  key={index}
                  className="finance-card p-6 md:p-8 transition-all hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 text-2xl"
                      style={{
                        background:
                          "radial-gradient(143.86% 887.35% at -10.97% -22.81%, #FEB4C5 0%, #DB869A 100%)",
                        boxShadow: "0px 4px 18px rgba(240, 161, 180, 0.35)",
                      }}
                    >
                      {feature.emoji}
                    </div>
                    <h3
                      className="text-lg md:text-xl pt-2"
                      style={{ color: cn.text }}
                    >
                      {feature.title}
                    </h3>
                  </div>
                  <p
                    className="text-sm md:text-base leading-relaxed"
                    style={{ color: cn.textSecondary }}
                  >
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="px-6 py-12 pb-8" style={{ backgroundColor: cn.bgPage }}>
        <div className="max-w-4xl mx-auto">
          <div
            className="finance-card p-4 sm:p-6 md:p-8"
            style={{ background: "rgba(254, 180, 197, 0.02)" }}
          >
            <h2
              className="mb-6 text-center text-2xl md:text-3xl"
              style={{ color: cn.text }}
            >
              {t("home.contact.title", "Need Help?")}
            </h2>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Phone
                  className="w-6 h-6 flex-shrink-0"
                  style={{ color: "#FEB4C5" }}
                />
                <div className="flex-1 w-full sm:w-auto">
                  <p className="text-sm mb-1" style={{ color: cn.textSecondary }}>
                    {t("home.contact.hotline", "Hotline")}
                  </p>
                  <p
                    className="text-base sm:text-lg break-words"
                    style={{ color: cn.text }}
                  >
                    +8801742957397
                  </p>
                </div>
                <Button
                  asChild
                  size="lg"
                  className="w-full sm:w-auto h-12 px-4 sm:px-6"
                  style={{
                    background:
                      "radial-gradient(143.86% 887.35% at -10.97% -22.81%, #7CE577 0%, #5FB865 100%)",
                    color: "white",
                    boxShadow: "0px 4px 18px rgba(124, 229, 119, 0.35)",
                    fontWeight: "500",
                  }}
                >
                  <a
                    href="sms:+8801742957397"
                    className="flex items-center justify-center"
                  >
                    <Phone className="w-5 h-5 mr-2" />
                    {t("home.contact.sendSms", "Send SMS")}
                  </a>
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Mail
                  className="w-6 h-6 flex-shrink-0"
                  style={{ color: "#FEB4C5" }}
                />
                <div className="flex-1 w-full sm:w-auto">
                  <p className="text-sm mb-1" style={{ color: cn.textSecondary }}>
                    {t("home.contact.emailLabel", "Email")}
                  </p>
                  <p
                    className="text-base sm:text-lg break-words"
                    style={{ color: cn.text }}
                  >
                    carenet@digital-papyrus.xyz
                  </p>
                </div>
                <Button
                  asChild
                  size="lg"
                  className="w-full sm:w-auto h-12 px-4 sm:px-6"
                  style={{
                    background:
                      "radial-gradient(143.86% 887.35% at -10.97% -22.81%, #FEB4C5 0%, #DB869A 100%)",
                    color: "white",
                    boxShadow: "0px 4px 18px rgba(240, 161, 180, 0.35)",
                    fontWeight: "500",
                  }}
                >
                  <a
                    href="mailto:carenet@digital-papyrus.xyz"
                    className="flex items-center justify-center"
                  >
                    <Mail className="w-5 h-5 mr-2" />
                    {t("home.contact.emailNow", "Email Now")}
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: "\r\n        .finance-card {\r\n          background: var(--cn-bg-card);\r\n          backdrop-filter: blur(8px);\r\n          border: 1px solid var(--cn-border-light);\r\n          border-radius: 1rem;\r\n          box-shadow: var(--cn-shadow-card);\r\n          transition: all 0.3s ease;\r\n        }\r\n        .finance-card:hover {\r\n          transform: translateY(-4px);\r\n          box-shadow: var(--cn-shadow-card-hover);\r\n        }\r\n        .finance-card:hover:active {\r\n          transform: translateY(0);\r\n        }\r\n      " }} />
    </div>
  );
}
