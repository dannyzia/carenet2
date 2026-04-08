import type {
  ShopProduct, WishlistItem,
  MerchantProduct, MerchantOrder, ShopFrontProduct, CustomerOrder,
  SalesChartDataPoint, CategoryDataPoint, MerchantChartDataPoint,
  ShopDashboardOrder, ShopDashboardStats, MerchantFulfillmentData, InventoryItem,
  CartItem, OrderTrackingData, ProductReviewDetail,
} from "@/backend/models";

/** Shop product listings */
export const MOCK_SHOP_PRODUCTS: ShopProduct[] = [
  { id: "1", name: "Digital Blood Pressure Monitor", price: "৳3,500", rating: 4.8, img: "https://images.unsplash.com/photo-1631549448991-43a482fb302d?auto=format&fit=crop&q=80&w=400&h=400", category: "Monitoring", inStock: true },
  { id: "2", name: "Foldable Wheelchair", price: "৳12,500", rating: 4.6, img: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80&w=400&h=400", category: "Mobility", inStock: true },
  { id: "3", name: "Pulse Oximeter", price: "৳1,200", rating: 4.7, img: "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&q=80&w=400&h=400", category: "Monitoring", inStock: true },
  { id: "4", name: "Hospital Bed (Manual)", price: "৳28,000", rating: 4.5, img: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&q=80&w=400&h=400", category: "Furniture", inStock: false },
  { id: "5", name: "Adult Diaper Pack (30pc)", price: "৳1,800", rating: 4.4, img: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&q=80&w=400&h=400", category: "Daily Care", inStock: true },
  { id: "6", name: "First Aid Kit (Premium)", price: "৳2,500", rating: 4.9, img: "https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&q=80&w=400&h=400", category: "Safety", inStock: true },
];

/** User's wishlist */
export const MOCK_WISHLIST: WishlistItem[] = [
  { id: "1", name: "Digital Blood Pressure Monitor", price: "৳3,500", rating: 4.8, img: "https://images.unsplash.com/photo-1631549448991-43a482fb302d?auto=format&fit=crop&q=80&w=400&h=400" },
  { id: "2", name: "Foldable Wheelchair", price: "৳12,500", rating: 4.6, img: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80&w=400&h=400" },
];

// ─── Merchant Products (ShopProductsPage) ───
export const MOCK_MERCHANT_PRODUCTS: MerchantProduct[] = [
  { id: 1, name: "Digital Blood Pressure Monitor", category: "Medical Devices", price: "\u09F32,450", stock: 12, sales: 85, rating: 4.8 },
  { id: 2, name: "Orthopedic Neck Pillow", category: "Sleep Aids", price: "\u09F31,800", stock: 5, sales: 42, rating: 4.5 },
  { id: 3, name: "Portable Pulse Oximeter", category: "Medical Devices", price: "\u09F31,200", stock: 24, sales: 156, rating: 4.9 },
  { id: 4, name: "Ergonomic Walking Stick", category: "Mobility Aids", price: "\u09F3850", stock: 18, sales: 34, rating: 4.2 },
  { id: 5, name: "Wheelchair - Standard", category: "Mobility Aids", price: "\u09F312,500", stock: 3, sales: 12, rating: 4.7 },
];

// ─── Merchant Orders (ShopOrdersPage) ───
export const MOCK_MERCHANT_ORDERS: MerchantOrder[] = [
  { id: "ORD-7234", customer: "Anisur Rahman", product: "Digital BP Monitor", amount: "\u09F32,450", status: "Delivered", date: "Mar 14, 2026", payment: "Paid" },
  { id: "ORD-7235", customer: "Fatima Begum", product: "Orthopedic Pillow", amount: "\u09F31,800", status: "Processing", date: "Mar 14, 2026", payment: "Paid" },
  { id: "ORD-7236", customer: "Dr. Kamal", product: "Pulse Oximeter", amount: "\u09F31,200", status: "Shipped", date: "Mar 13, 2026", payment: "Unpaid" },
  { id: "ORD-7237", customer: "Sumi Akter", product: "Walking Stick", amount: "\u09F3850", status: "Delivered", date: "Mar 13, 2026", payment: "Paid" },
  { id: "ORD-7238", customer: "Zakir Hossain", product: "Wheelchair - Standard", amount: "\u09F312,500", status: "Cancelled", date: "Mar 12, 2026", payment: "Refunded" },
];

// ─── Shop-Front Product List (ProductListPage) ───
export const MOCK_SHOPFRONT_PRODUCTS: ShopFrontProduct[] = [
  { id: 1, name: "Digital Blood Pressure Monitor", category: "Medical", price: "\u09F32,450", oldPrice: "\u09F32,800", rating: 4.8, reviews: 124, image: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?q=80&w=400&h=400&auto=format&fit=crop" },
  { id: 2, name: "Orthopedic Neck Pillow", category: "Sleep Aids", price: "\u09F31,800", oldPrice: "\u09F32,200", rating: 4.5, reviews: 86, image: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?q=80&w=400&h=400&auto=format&fit=crop" },
  { id: 3, name: "Portable Pulse Oximeter", category: "Medical", price: "\u09F31,200", oldPrice: "\u09F31,500", rating: 4.9, reviews: 256, image: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?q=80&w=400&h=400&auto=format&fit=crop" },
  { id: 4, name: "Ergonomic Walking Stick", category: "Mobility", price: "\u09F3850", oldPrice: "\u09F31,000", rating: 4.2, reviews: 42, image: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?q=80&w=400&h=400&auto=format&fit=crop" },
  { id: 5, name: "Wheelchair - Standard", category: "Mobility", price: "\u09F312,500", oldPrice: "\u09F315,000", rating: 4.7, reviews: 18, image: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?q=80&w=400&h=400&auto=format&fit=crop" },
  { id: 6, name: "Glucose Monitoring System", category: "Medical", price: "\u09F33,200", oldPrice: "\u09F33,800", rating: 4.6, reviews: 64, image: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?q=80&w=400&h=400&auto=format&fit=crop" },
];

// ─── Customer Order History (CustomerOrderHistoryPage) ───
export const MOCK_CUSTOMER_ORDERS: CustomerOrder[] = [
  { id: "ORD-55421", date: "Mar 14, 2026", total: "\u09F37,100", status: "In Transit", items: 3, img: "https://images.unsplash.com/photo-1631549448991-43a482fb302d?auto=format&fit=crop&q=80&w=100&h=100" },
  { id: "ORD-55310", date: "Feb 28, 2026", total: "\u09F31,200", status: "Delivered", items: 1, img: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&q=80&w=100&h=100" },
  { id: "ORD-55201", date: "Jan 15, 2026", total: "\u09F312,500", status: "Delivered", items: 5, img: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&q=80&w=100&h=100" },
];

// ─── Shop Analytics Chart Data ───
export const MOCK_SHOP_SALES_DATA: SalesChartDataPoint[] = [
  { name: "Mon", sales: 4000, orders: 24 }, { name: "Tue", sales: 3000, orders: 18 },
  { name: "Wed", sales: 2000, orders: 12 }, { name: "Thu", sales: 2780, orders: 16 },
  { name: "Fri", sales: 1890, orders: 10 }, { name: "Sat", sales: 2390, orders: 14 },
  { name: "Sun", sales: 3490, orders: 20 },
];
export const MOCK_SHOP_CATEGORY_DATA: CategoryDataPoint[] = [
  { name: "Medical", value: 400 }, { name: "Mobility", value: 300 },
  { name: "Daily Living", value: 200 }, { name: "Nutrition", value: 100 },
];

// ─── Merchant Analytics Chart Data ───
export const MOCK_MERCHANT_ANALYTICS_DATA: MerchantChartDataPoint[] = [
  { day: "Mon", sales: 12000 }, { day: "Tue", sales: 18000 },
  { day: "Wed", sales: 15000 }, { day: "Thu", sales: 22000 },
  { day: "Fri", sales: 35000 }, { day: "Sat", sales: 45000 },
  { day: "Sun", sales: 38000 },
];

export const MOCK_SHOP_DASHBOARD_STATS: ShopDashboardStats = {
  totalSalesBdt: 124_500,
  activeProducts: 48,
  newOrders: 12,
  totalCustomers: 850,
  salesChangeLabel: "+12.5%",
  salesChangePositive: true,
  productsChangeLabel: "+2",
  productsChangePositive: true,
  ordersChangeLabel: "-5%",
  ordersChangePositive: false,
  customersChangeLabel: "+18%",
  customersChangePositive: true,
};

// ─── Shop Dashboard Orders ───
export const MOCK_SHOP_DASHBOARD_ORDERS: ShopDashboardOrder[] = [
  { id: "ORD-7234", customer: "Anisur Rahman", product: "Digital BP Monitor", amount: "\u09F32,450", status: "Delivered", date: "Mar 14, 2026" },
  { id: "ORD-7235", customer: "Fatima Begum", product: "Orthopedic Pillow", amount: "\u09F31,800", status: "Processing", date: "Mar 14, 2026" },
  { id: "ORD-7236", customer: "Dr. Kamal", product: "Pulse Oximeter", amount: "\u09F31,200", status: "Shipped", date: "Mar 13, 2026" },
  { id: "ORD-7237", customer: "Sumi Akter", product: "Walking Stick", amount: "\u09F3850", status: "Delivered", date: "Mar 13, 2026" },
];

// ─── Merchant Fulfillment ───
export const MOCK_MERCHANT_FULFILLMENT: MerchantFulfillmentData = {
  pending: [
    { id: "ORD-4401", customer: "Fatima R.", items: 3, total: 2850, ordered: "Mar 14, 2:30 PM", priority: "high" as const },
    { id: "ORD-4398", customer: "Zubayer A.", items: 1, total: 950, ordered: "Mar 14, 11:00 AM", priority: "normal" as const },
  ],
  shipped: [
    { id: "ORD-4395", customer: "Rashed H.", items: 2, total: 1800, shipped: "Mar 13", tracking: "DX-990211" },
  ],
};

export const MOCK_INVENTORY: InventoryItem[] = [
  { id: "p1", name: "Digital Blood Pressure Monitor", sku: "BP-001", stock: 24, threshold: 10, price: 2500, category: "Devices", status: "Healthy" },
  { id: "p2", name: "Glucometer Test Strips (50pk)", sku: "GT-050", stock: 8, threshold: 15, price: 850, category: "Consumables", status: "Low Stock" },
  { id: "p3", name: "Wheelchair (Foldable)", sku: "WC-001", stock: 3, threshold: 5, price: 12000, category: "Mobility", status: "Low Stock" },
  { id: "p4", name: "Pulse Oximeter", sku: "PO-001", stock: 42, threshold: 10, price: 1200, category: "Devices", status: "Healthy" },
  { id: "p5", name: "Adult Diaper Pack (20)", sku: "AD-020", stock: 56, threshold: 20, price: 650, category: "Consumables", status: "Healthy" },
];

export const MOCK_CART_ITEMS: CartItem[] = [
  { id: 1, productId: "p1", name: "Digital Blood Pressure Monitor", price: 2500, quantity: 1, image: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&q=80&w=200" },
  { id: 2, productId: "p4", name: "Pulse Oximeter", price: 1200, quantity: 2, image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=200" },
];

export const MOCK_ORDER_TRACKING: OrderTrackingData = {
  id: "ORD-4395", status: "shipped" as const,
  items: [{ name: "Digital BP Monitor", qty: 1 }, { name: "Glucometer", qty: 1 }],
  timeline: [
    { step: "Order Placed", time: "Mar 13, 10:00 AM", done: true },
    { step: "Payment Confirmed", time: "Mar 13, 10:05 AM", done: true },
    { step: "Shipped", time: "Mar 14, 9:00 AM", done: true },
    { step: "Out for Delivery", time: "Estimated Mar 16", done: false },
    { step: "Delivered", time: "", done: false },
  ],
  tracking: "DX-990211", courier: "Pathao Courier",
};

export const MOCK_PRODUCT_REVIEWS: ProductReviewDetail[] = [
  { id: "r1", author: "Rashed H.", rating: 5, text: "Excellent quality. Works perfectly for my mother.", date: "Mar 10", helpful: 12 },
  { id: "r2", author: "Nusrat J.", rating: 4, text: "Good product but delivery was slow.", date: "Mar 08", helpful: 5 },
  { id: "r3", author: "Aminul I.", rating: 5, text: "Best price on CareNet shop.", date: "Mar 05", helpful: 8 },
  { id: "r4", author: "Fatima R.", rating: 3, text: "Average. Expected better packaging.", date: "Mar 02", helpful: 2 },
];