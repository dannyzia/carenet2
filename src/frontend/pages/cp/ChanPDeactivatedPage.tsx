import { useTranslation } from "react-i18next";

export default function ChanPDeactivatedPage() {
  const { t } = useTranslation("cp");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl border border-gray-200 p-8 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-700 text-3xl">
          🚫
        </div>
        <h1 className="text-3xl font-semibold text-gray-900 mb-4">
          {t("deactivated.title")}
        </h1>
        <p className="text-gray-600 text-base mb-6">
          {t("deactivated.message")}
        </p>
        <p className="text-sm text-gray-500">
          {t("deactivated.contactSupport")}
        </p>
      </div>
    </div>
  );
}
