/**
 * Shop Domain Models
 * Types for shop/marketplace features: products, orders, merchant, analytics
 */

// ─── Products ───
export interface ShopProduct {
  id: string; name: string; price: string; rating: number;
  img?: string; category: string; description?: string; inStock?: boolean;
}

export interface WishlistItem {
  id: string; name: string; price: string; rating: number; img?: string;
}

export interface MerchantProduct {
  id: number; name: string; category: string; price: string;
  stock: number; sales: number; rating: number;
}

export interface ShopFrontProduct {
  id: number; name: string; category: string; price: string; oldPrice: string;
  rating: number; reviews: number; image: string;
}

// ─── Orders ───
export interface MerchantOrder {
  id: string; customer: string; product: string; amount: string;
  status: string; date: string; payment: string;
}

export interface CustomerOrder {
  id: string; date: string; total: string; status: string; items: number; img: string;
}

export interface ShopDashboardOrder {
  id: string; customer: string; product: string; amount: string; status: string; date: string;
}

export interface ShopDashboardStats {
  totalSalesBdt: number;
  activeProducts: number;
  newOrders: number;
  totalCustomers: number;
  salesChangeLabel: string;
  salesChangePositive: boolean;
  productsChangeLabel: string;
  productsChangePositive: boolean;
  ordersChangeLabel: string;
  ordersChangePositive: boolean;
  customersChangeLabel: string;
  customersChangePositive: boolean;
}

// ─── Analytics ───
export interface SalesChartDataPoint { name: string; sales: number; orders: number; }
export interface CategoryDataPoint { name: string; value: number; }
export interface MerchantChartDataPoint { day: string; sales: number; }

// ─── Service Return Types (untyped methods) ───
export interface FulfillmentPendingItem {
  id: string; customer: string; items: number; total: number;
  ordered: string; priority: "high" | "normal" | "low";
}

export interface FulfillmentShippedItem {
  id: string; customer: string; items: number; total: number;
  shipped: string; tracking: string;
}

export interface MerchantFulfillmentData {
  pending: FulfillmentPendingItem[];
  shipped: FulfillmentShippedItem[];
}

export interface InventoryItem {
  id: string; name: string; sku: string; stock: number;
  threshold: number; price: number; category: string; status: string;
}

export interface ProductReviewItem {
  author: string; rating: number; text: string; date: string;
}

export interface ProductDetailData extends ShopProduct {
  reviews: ProductReviewItem[];
}

export interface CartItem {
  id: number; productId: string; name: string; price: number;
  quantity: number; image: string;
}

export interface OrderTrackingStep {
  step: string; time: string; done: boolean;
}

export interface OrderTrackingData {
  id: string; status: "placed" | "confirmed" | "shipped" | "out_for_delivery" | "delivered";
  items: Array<{ name: string; qty: number }>;
  timeline: OrderTrackingStep[];
  tracking: string; courier: string;
}

export interface ProductReviewDetail {
  id: string; author: string; rating: number; text: string; date: string; helpful: number;
}
