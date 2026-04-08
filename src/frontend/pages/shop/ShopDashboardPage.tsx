import { cn } from "@/frontend/theme/tokens";
import { Package, ShoppingBag, TrendingUp, Users, ArrowUpRight, ArrowDownRight, UserPlus } from "lucide-react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { shopService } from "@/backend/services/shop.service";
import { PageSkeleton } from "@/frontend/components/PageSkeleton";
import { formatBdtAmount } from "@/frontend/utils/dashboardFormat";
import i18n from "@/frontend/i18n";

export default function ShopDashboardPage() {
  const { t } = useTranslation(["dashboard", "common"]);
  useDocumentTitle(t("common:pageTitles.shopDashboard", "Dashboard"));

  const locale = i18n.language || "en";
  const currencySym = t("dashboard:shared.currencySymbol");

  const { data: recentOrders, loading: lO } = useAsyncData(() => shopService.getShopDashboardOrders());
  const { data: stats, loading: lS } = useAsyncData(() => shopService.getDashboardStats());

  if (lO || lS || !recentOrders || !stats) return <PageSkeleton cards={4} />;

  const statCards = [
    { label: t("dashboard:shop.totalSales"), value: formatBdtAmount(stats.totalSalesBdt, locale, currencySym), icon: ShoppingBag, change: stats.salesChangeLabel, positive: stats.salesChangePositive, to: "/shop/orders" },
    { label: t("dashboard:shop.activeProducts"), value: String(stats.activeProducts), icon: Package, change: stats.productsChangeLabel, positive: stats.productsChangePositive, to: "/shop/products" },
    { label: t("dashboard:shop.newOrders"), value: String(stats.newOrders), icon: TrendingUp, change: stats.ordersChangeLabel, positive: stats.ordersChangePositive, to: "/shop/orders" },
    { label: t("dashboard:shop.totalCustomers"), value: String(stats.totalCustomers), icon: Users, change: stats.customersChangeLabel, positive: stats.customersChangePositive, to: "/shop/analytics" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: cn.text }}>{t("dashboard:shop.title")}</h1>
          <p className="text-sm mt-1" style={{ color: cn.textSecondary }}>{t("dashboard:shop.welcome")}</p>
        </div>
        <button
          type="button"
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-sm cn-touch-target shrink-0"
          style={{ background: "var(--cn-gradient-shop)" }}
        >
          <UserPlus className="w-4 h-4" aria-hidden /> {t("dashboard:shop.inviteManager")}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <Link
            key={idx}
            to={stat.to}
            className="cn-stat-card block no-underline hover:shadow-md transition-shadow cn-touch-target focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cn-pink)] focus-visible:ring-offset-2"
            aria-label={`${stat.label}: ${stat.value}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 rounded-lg" style={{ background: cn.orangeBg }}>
                <stat.icon className="w-5 h-5" style={{ color: cn.orange }} aria-hidden />
              </div>
              <div className={`flex items-center text-xs font-medium ${stat.positive ? "text-green-600" : "text-red-600"}`}>
                {stat.positive ? <ArrowUpRight className="w-3 h-3 mr-1" aria-hidden /> : <ArrowDownRight className="w-3 h-3 mr-1" aria-hidden />}
                {stat.change}
              </div>
            </div>
            <h3 className="text-2xl font-bold" style={{ color: cn.text }}>{stat.value}</h3>
            <p className="text-sm" style={{ color: cn.textSecondary }}>{stat.label}</p>
          </Link>
        ))}
      </div>

      <div className="cn-card-flat overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: cn.borderLight }}>
          <h2 className="text-lg font-bold" style={{ color: cn.text }}>{t("dashboard:shop.recentOrders")}</h2>
          <Link to="/shop/orders" className="text-sm font-medium cn-touch-target hover:underline" style={{ color: cn.orange }}>
            {t("dashboard:shared.viewAll")}
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs font-medium uppercase tracking-wider" style={{ background: cn.bgInput, color: cn.textSecondary }}>
                <th className="px-6 py-3">{t("dashboard:shop.orderId")}</th>
                <th className="px-6 py-3">{t("dashboard:shop.customer")}</th>
                <th className="px-6 py-3">{t("dashboard:shop.product")}</th>
                <th className="px-6 py-3">{t("dashboard:shop.amount")}</th>
                <th className="px-6 py-3">{t("dashboard:shop.status")}</th>
                <th className="px-6 py-3">{t("dashboard:shop.date")}</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: cn.borderLight }}>
              {recentOrders.map((order) => (
                <tr key={order.id} className="cn-table-row">
                  <td className="px-6 py-4 text-sm font-medium" style={{ color: cn.text }}>{order.id}</td>
                  <td className="px-6 py-4 text-sm" style={{ color: cn.textSecondary }}>{order.customer}</td>
                  <td className="px-6 py-4 text-sm" style={{ color: cn.textSecondary }}>{order.product}</td>
                  <td className="px-6 py-4 text-sm font-bold" style={{ color: cn.text }}>{order.amount}</td>
                  <td className="px-6 py-4">
                    <span
                      className="cn-badge text-xs"
                      style={{
                        background: order.status === "Delivered" ? cn.greenBg : order.status === "Processing" ? "rgba(59, 130, 246, 0.15)" : cn.amberBg,
                        color: order.status === "Delivered" ? cn.green : order.status === "Processing" ? "#2563eb" : cn.amber,
                      }}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: cn.textSecondary }}>{order.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
