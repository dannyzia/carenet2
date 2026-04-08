/**
 * Shop Service — business logic layer
 */
import type {
  ShopProduct, WishlistItem,
  MerchantProduct, MerchantOrder, ShopFrontProduct, CustomerOrder,
  SalesChartDataPoint, CategoryDataPoint, MerchantChartDataPoint,
  ShopDashboardOrder, ShopDashboardStats, MerchantFulfillmentData, InventoryItem,
  ProductDetailData, CartItem, OrderTrackingData, ProductReviewDetail,
} from "@/backend/models";
import { loadMockBarrel } from "@/backend/api/mock/loadMockBarrel";
import { USE_SUPABASE, sbRead, sb, currentUserId, useInAppMockDataset } from "./_sb";
import { EMPTY_SHOP_DASHBOARD_STATS } from "./liveEmptyDefaults";
import { demoOfflineDelayAndPick } from "./demoOfflineMock";

function emptyProductDetail(id: string): ProductDetailData {
  return { id, name: "", price: "", rating: 0, category: "", reviews: [] };
}

function emptyOrderTracking(orderId: string): OrderTrackingData {
  return { id: orderId || "", status: "placed", items: [], timeline: [], tracking: "", courier: "" };
}

const emptyMerchantFulfillment: MerchantFulfillmentData = { pending: [], shipped: [] };

function mapProduct(d: any): ShopProduct {
  return {
    id: d.id, name: d.name, category: d.category, description: d.description,
    price: d.price, oldPrice: d.old_price, stock: d.stock, sales: d.sales,
    rating: d.rating, reviews: d.reviews, image: d.image || "",
    inStock: d.in_stock,
  };
}

export const shopService = {
  /** Get all products, optionally filtered by category */
  async getProducts(category?: string): Promise<ShopProduct[]> {
    if (USE_SUPABASE) {
      const key = `shop:products:${category || "all"}`;
      return sbRead(key, async () => {
        let q = sb().from("shop_products").select("*").order("sales", { ascending: false });
        if (category) q = q.eq("category", category);
        const { data, error } = await q;
        if (error) throw error;
        return (data || []).map(mapProduct);
      });
    }
    return demoOfflineDelayAndPick(200, [] as ShopProduct[], (m) =>
      !category ? m.MOCK_SHOP_PRODUCTS : m.MOCK_SHOP_PRODUCTS.filter((p) => p.category === category),
    );
  },

  /** Get product by ID */
  async getProductById(id: string): Promise<ShopProduct | undefined> {
    if (USE_SUPABASE) {
      return sbRead(`shop:product:${id}`, async () => {
        const { data, error } = await sb().from("shop_products").select("*").eq("id", id).single();
        if (error) return undefined;
        return mapProduct(data);
      });
    }
    return demoOfflineDelayAndPick(200, undefined as ShopProduct | undefined, (m) =>
      m.MOCK_SHOP_PRODUCTS.find((p) => p.id === id),
    );
  },

  /** Get user's wishlist */
  async getWishlist(): Promise<WishlistItem[]> {
    if (USE_SUPABASE) {
      return sbRead("shop:wishlist", async () => {
        const userId = await currentUserId();
        const { data, error } = await sb().from("wishlists")
          .select("*, shop_products(*)")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id,
          product: d.shop_products ? mapProduct(d.shop_products) : undefined,
          productId: d.product_id,
          addedAt: d.created_at,
        }));
      });
    }
    return demoOfflineDelayAndPick(200, [], (m) => m.MOCK_WISHLIST);
  },

  async getMerchantProducts(): Promise<MerchantProduct[]> {
    if (USE_SUPABASE) {
      return sbRead("shop:merchant-products", async () => {
        const userId = await currentUserId();
        const { data, error } = await sb().from("shop_products")
          .select("*")
          .eq("merchant_id", userId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id, name: d.name, category: d.category, price: d.price,
          stock: d.stock, sales: d.sales, rating: d.rating, status: d.in_stock ? "active" : "inactive",
          image: d.image || "",
        }));
      });
    }
    return demoOfflineDelayAndPick(200, [], (m) => m.MOCK_MERCHANT_PRODUCTS);
  },

  async getMerchantOrders(): Promise<MerchantOrder[]> {
    if (USE_SUPABASE) {
      return sbRead("shop:merchant-orders", async () => {
        const userId = await currentUserId();
        const { data, error } = await sb().from("shop_orders")
          .select("*")
          .eq("merchant_id", userId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id, customer: d.customer_name, items: d.items_count,
          total: d.total, status: d.status, date: d.created_at,
        }));
      });
    }
    return demoOfflineDelayAndPick(200, [], (m) => m.MOCK_MERCHANT_ORDERS);
  },

  async getShopFrontProducts(): Promise<ShopFrontProduct[]> {
    if (USE_SUPABASE) {
      return sbRead("shop:front", async () => {
        const { data, error } = await sb().from("shop_products")
          .select("*")
          .eq("in_stock", true)
          .order("sales", { ascending: false })
          .limit(20);
        if (error) throw error;
        return (data || []).map(mapProduct);
      });
    }
    return demoOfflineDelayAndPick(200, [], (m) => m.MOCK_SHOPFRONT_PRODUCTS);
  },

  async getCustomerOrders(): Promise<CustomerOrder[]> {
    if (USE_SUPABASE) {
      return sbRead("shop:my-orders", async () => {
        const userId = await currentUserId();
        const { data, error } = await sb().from("shop_orders")
          .select("*")
          .eq("customer_id", userId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id, items: d.items_count, total: d.total,
          status: d.status, date: d.created_at, tracking: d.tracking,
        }));
      });
    }
    return demoOfflineDelayAndPick(200, [], (m) => m.MOCK_CUSTOMER_ORDERS);
  },

  // ─── Analytics (aggregation — keep mock for now, will be Supabase views/RPCs) ───
  async getShopSalesData(): Promise<SalesChartDataPoint[]> {
    if (USE_SUPABASE) {
      return sbRead("shop:sales", async () => {
        const { data, error } = await sb().from("shop_orders")
          .select("created_at, total")
          .order("created_at", { ascending: true });
        if (error) throw error;
        const byMonth: Record<string, number> = {};
        (data || []).forEach((d: any) => {
          const month = d.created_at ? String(d.created_at).slice(0, 7) : "unknown";
          byMonth[month] = (byMonth[month] || 0) + Number(d.total || 0);
        });
        return Object.entries(byMonth).map(([month, total]) => ({ month, total }));
      });
    }
    return demoOfflineDelayAndPick(200, [], (m) => m.MOCK_SHOP_SALES_DATA);
  },

  async getShopCategoryData(): Promise<CategoryDataPoint[]> {
    if (USE_SUPABASE) {
      return sbRead("shop:category", async () => {
        const { data, error } = await sb().from("shop_products")
          .select("category, id, stock");
        if (error) throw error;
        const byCategory: Record<string, { count: number; stock: number }> = {};
        (data || []).forEach((d: any) => {
          const cat = d.category || "Other";
          if (!byCategory[cat]) byCategory[cat] = { count: 0, stock: 0 };
          byCategory[cat].count++;
          byCategory[cat].stock += d.stock || 0;
        });
        return Object.entries(byCategory).map(([category, v]) => ({
          category,
          count: v.count,
          stock: v.stock,
        }));
      });
    }
    return demoOfflineDelayAndPick(200, [], (m) => m.MOCK_SHOP_CATEGORY_DATA);
  },

  async getMerchantAnalyticsData(): Promise<MerchantChartDataPoint[]> {
    if (USE_SUPABASE) {
      return sbRead("shop:merchant-analytics", async () => {
        const userId = await currentUserId();
        const { data, error } = await sb().from("shop_orders")
          .select("created_at, total, status")
          .eq("merchant_id", userId)
          .order("created_at", { ascending: true });
        if (error) throw error;
        const byMonth: Record<string, { revenue: number; orders: number }> = {};
        (data || []).forEach((d: any) => {
          const month = d.created_at ? String(d.created_at).slice(0, 7) : "unknown";
          if (!byMonth[month]) byMonth[month] = { revenue: 0, orders: 0 };
          byMonth[month].revenue += Number(d.total || 0);
          byMonth[month].orders++;
        });
        return Object.entries(byMonth).map(([month, v]) => ({
          month,
          revenue: v.revenue,
          orders: v.orders,
        }));
      });
    }
    return demoOfflineDelayAndPick(200, [], (m) => m.MOCK_MERCHANT_ANALYTICS_DATA);
  },

  async getShopDashboardOrders(): Promise<ShopDashboardOrder[]> {
    if (USE_SUPABASE) {
      return sbRead("shop:dashboard-orders", async () => {
        const userId = await currentUserId();
        const { data, error } = await sb().from("shop_orders")
          .select("*")
          .eq("merchant_id", userId)
          .order("created_at", { ascending: false })
          .limit(50);
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id,
          customer: d.customer_name || "Customer",
          total: d.total,
          status: d.status,
          date: d.created_at,
          items: d.items_count || 0,
        }));
      });
    }
    return demoOfflineDelayAndPick(200, [], (m) => m.MOCK_SHOP_DASHBOARD_ORDERS);
  },

  async getDashboardStats(): Promise<ShopDashboardStats> {
    if (USE_SUPABASE) {
      return sbRead("shop:dashboard-stats", async () => {
        const userId = await currentUserId();
        const demoBase = useInAppMockDataset()
          ? (await loadMockBarrel()).MOCK_SHOP_DASHBOARD_STATS
          : EMPTY_SHOP_DASHBOARD_STATS;
        const { data: products, error: pe } = await sb().from("shop_products").select("stock").eq("merchant_id", userId);
        const { data: orders, error: oe } = await sb().from("shop_orders").select("total, status").eq("merchant_id", userId);
        if (pe || oe) {
          return useInAppMockDataset() ? demoBase : EMPTY_SHOP_DASHBOARD_STATS;
        }
        const activeProducts = (products || []).filter((p: { stock?: number }) => (p.stock ?? 0) > 0).length;
        const totalSalesBdt = (orders || []).reduce((s: number, o: { total?: number }) => s + Number(o.total || 0), 0);
        const newOrders = (orders || []).filter((o: { status?: string }) =>
          ["pending", "processing", "confirmed"].includes(String(o.status || "").toLowerCase())
        ).length;
        if (useInAppMockDataset()) {
          return {
            ...demoBase,
            totalSalesBdt: totalSalesBdt || demoBase.totalSalesBdt,
            activeProducts: activeProducts || demoBase.activeProducts,
            newOrders: newOrders || demoBase.newOrders,
          };
        }
        return {
          ...EMPTY_SHOP_DASHBOARD_STATS,
          totalSalesBdt,
          activeProducts,
          newOrders,
        };
      });
    }
    return demoOfflineDelayAndPick(200, EMPTY_SHOP_DASHBOARD_STATS, (m) => m.MOCK_SHOP_DASHBOARD_STATS);
  },

  async getMerchantFulfillment(): Promise<MerchantFulfillmentData> {
    if (USE_SUPABASE) {
      return sbRead("shop:merchant-fulfillment", async () => {
        const userId = await currentUserId();
        const { data, error } = await sb().from("shop_orders")
          .select("*")
          .eq("merchant_id", userId)
          .in("status", ["confirmed", "shipped"])
          .order("created_at", { ascending: false });
        if (error) throw error;
        return {
          orders: (data || []).map((d: any) => ({
            id: d.id,
            customer: d.customer_name || "Customer",
            total: d.total,
            status: d.status,
            date: d.created_at,
            items: d.items_count || 0,
          })),
          total: data?.length || 0,
        };
      });
    }
    return demoOfflineDelayAndPick(200, emptyMerchantFulfillment, (m) => m.MOCK_MERCHANT_FULFILLMENT);
  },

  async getInventory(): Promise<InventoryItem[]> {
    if (USE_SUPABASE) {
      return sbRead("shop:inventory", async () => {
        const userId = await currentUserId();
        const { data, error } = await sb().from("shop_products")
          .select("id, name, sku, stock, threshold, category, price")
          .eq("merchant_id", userId)
          .order("stock", { ascending: true });
        if (error) throw error;
        return (data || []).map((d: any) => ({
          id: d.id, name: d.name, sku: d.sku || "", stock: d.stock,
          threshold: d.threshold || 10, category: d.category, price: d.price,
          status: d.stock <= 0 ? "out_of_stock" : d.stock <= (d.threshold || 10) ? "low_stock" : "in_stock",
        }));
      });
    }
    return demoOfflineDelayAndPick(200, [], (m) => m.MOCK_INVENTORY);
  },

  async getProductDetail(id: string): Promise<ProductDetailData> {
    if (USE_SUPABASE) {
      return sbRead(`shop:product-detail:${id}`, async () => {
        const { data: product, error: pErr } = await sb().from("shop_products")
          .select("*")
          .eq("id", id)
          .single();
        if (pErr) throw pErr;
        const { data: reviews, error: rErr } = await sb().from("product_reviews")
          .select("*")
          .eq("product_id", id)
          .order("created_at", { ascending: false });
        if (rErr) throw rErr;
        return {
          ...mapProduct(product),
          reviews: (reviews || []).map((r: any) => ({
            id: r.id,
            userId: r.user_id,
            userName: r.user_name || "Anonymous",
            rating: r.rating,
            text: r.text || "",
            date: r.created_at,
          })),
        };
      });
    }
    return demoOfflineDelayAndPick(200, emptyProductDetail(id), (m) => {
      const product = m.MOCK_SHOP_PRODUCTS.find((p) => p.id === id) ?? m.MOCK_SHOP_PRODUCTS[0];
      return { ...product, reviews: m.MOCK_PRODUCT_REVIEWS };
    });
  },

  async getCartItems(): Promise<CartItem[]> {
    if (USE_SUPABASE) {
      return sbRead("shop:cart", async () => {
        return [];
      });
    }
    return demoOfflineDelayAndPick(200, [], (m) => m.MOCK_CART_ITEMS);
  },

  async getOrderTracking(orderId: string): Promise<OrderTrackingData> {
    if (USE_SUPABASE) {
      return sbRead(`order-track:${orderId}`, async () => {
        const { data, error } = await sb().from("shop_orders")
          .select("*")
          .eq("id", orderId)
          .single();
        if (error) throw error;
        return {
          id: data.id, status: data.status, tracking: data.tracking,
          courier: data.courier, updatedAt: data.updated_at,
          steps: [], // TODO: order_tracking_steps table
        };
      });
    }
    return demoOfflineDelayAndPick(200, emptyOrderTracking(orderId), (m) => ({
      ...m.MOCK_ORDER_TRACKING,
      id: orderId || m.MOCK_ORDER_TRACKING.id,
    }));
  },

  async getProductReviews(productId: string): Promise<ProductReviewDetail[]> {
    if (USE_SUPABASE) {
      return sbRead(`shop:reviews:${productId}`, async () => {
        const { data, error } = await sb().from("product_reviews")
          .select("*")
          .eq("product_id", productId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map((r: any) => ({
          id: r.id,
          userId: r.user_id,
          userName: r.user_name || "Anonymous",
          rating: r.rating,
          text: r.text || "",
          date: r.created_at,
        }));
      });
    }
    return demoOfflineDelayAndPick(200, [], (m) => m.MOCK_PRODUCT_REVIEWS);
  },
};
