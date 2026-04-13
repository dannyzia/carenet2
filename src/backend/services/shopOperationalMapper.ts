import type { ShopDashboardOrder, ShopDashboardStats } from "@/backend/models";
import type {
  OperationalDashboardAction,
  OperationalDashboardData,
  OperationalDashboardQueueRow,
  OperationalQueuePriority,
} from "@/backend/models/operationalDashboard.model";

export interface ShopOperationalInputs {
  orders: ShopDashboardOrder[];
  stats: ShopDashboardStats;
}

function orderPriority(status: string): OperationalQueuePriority {
  const s = status.toLowerCase();
  if (s.includes("pending") || s.includes("process")) return "high";
  if (s.includes("ship")) return "medium";
  return "low";
}

export function mapShopOperationalDashboard(input: ShopOperationalInputs): OperationalDashboardData {
  const actions: OperationalDashboardAction[] = [
    { id: "products", labelKey: "dashboard:shop.opsProducts", to: "/shop/products" },
    { id: "orders", labelKey: "dashboard:shop.opsOrders", to: "/shop/orders" },
    { id: "inventory", labelKey: "dashboard:shop.opsInventory", to: "/shop/inventory" },
    { id: "analytics", labelKey: "dashboard:shop.opsAnalytics", to: "/shop/analytics" },
  ];

  const queue: OperationalDashboardQueueRow[] = input.orders.slice(0, 12).map((o) => ({
    id: String(o.id),
    type: "",
    typeKey: "dashboard:shop.queueTypeOrder",
    priority: orderPriority(o.status),
    entity: o.product,
    reasonKey: "dashboard:shop.queueReasonOrder",
    reasonParams: { customer: o.customer, status: o.status },
    reason: "",
    time: o.date,
    href: "/shop/orders",
    primaryActionLabelKey: "dashboard:shop.queueOpenOrders",
  }));

  const queueWithSignals: OperationalDashboardQueueRow[] = [...queue];
  if (input.stats.newOrders > 0) {
    queueWithSignals.unshift({
      id: "signal-new-orders",
      type: "",
      typeKey: "dashboard:shop.queueTypeSignal",
      priority: "high",
      entity: "",
      entityKey: "dashboard:shop.queueNewOrdersTitle",
      entityParams: { count: input.stats.newOrders },
      reasonKey: "dashboard:shop.queueNewOrdersReason",
      reason: "",
      time: "—",
      href: "/shop/orders",
      primaryActionLabelKey: "dashboard:shop.queueOpenOrders",
    });
  }

  return { actions, queue: queueWithSignals, kpis: [] };
}
