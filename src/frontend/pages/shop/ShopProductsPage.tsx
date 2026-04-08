import { useState } from "react";
import { cn } from "@/frontend/theme/tokens";
import { Plus, Search, Filter, MoreVertical, Edit, Trash, Eye, Package, Star, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { shopService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

export default function ShopProductsPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.shopProducts", "Shop Products"));

  const [searchTerm, setSearchTerm] = useState("");
  const { data: products, loading } = useAsyncData(() => shopService.getMerchantProducts());

  if (loading || !products) return <PageSkeleton cards={3} />;

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center"><div><h1 className="text-2xl font-bold text-gray-800">Products Management</h1><p className="text-gray-500">Manage your inventory and product listings.</p></div><Link to="/shop/inventory" className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium shadow-lg hover:opacity-90 transition-all no-underline cn-touch-target" style={{ background: "radial-gradient(143.86% 887.35% at -10.97% -22.81%, #FFAB91 0%, #E64A19 100%)" }}><Plus className="w-5 h-5" /><span>Add Product</span></Link></div>
        <div className="flex gap-3 items-center"><div className="flex-1 relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" placeholder="Search products..." className="input-field pl-10 h-11" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div><button className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-600 font-medium"><Filter className="w-4 h-4" /><span>Filter</span></button></div>
        <div className="finance-card"><div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-gray-50 text-gray-500 text-xs font-medium uppercase tracking-wider"><th className="px-6 py-4">Product</th><th className="px-6 py-4">Category</th><th className="px-6 py-4">Price</th><th className="px-6 py-4">Stock</th><th className="px-6 py-4">Sales</th><th className="px-6 py-4">Rating</th><th className="px-6 py-4">Actions</th></tr></thead><tbody className="divide-y divide-gray-100">{products.map((product) => (<tr key={product.id} className="table-row"><td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400"><Package className="w-5 h-5" /></div><span className="text-sm font-medium text-gray-800">{product.name}</span></div></td><td className="px-6 py-4 text-sm text-gray-600">{product.category}</td><td className="px-6 py-4 text-sm font-bold text-gray-800">{product.price}</td><td className="px-6 py-4"><div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${product.stock < 10 ? "bg-red-500" : "bg-green-500"}`} /><span className="text-sm text-gray-600">{product.stock} units</span></div></td><td className="px-6 py-4 text-sm text-gray-600">{product.sales}</td><td className="px-6 py-4"><div className="flex items-center gap-1 text-orange-400"><Star className="w-4 h-4 fill-current" /><span className="text-sm font-medium">{product.rating}</span></div></td><td className="px-6 py-4"><div className="flex items-center gap-2"><button aria-label="Edit product" className="p-2 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-blue-600"><Edit className="w-4 h-4" /></button><button aria-label="Delete product" className="p-2 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-red-600"><Trash className="w-4 h-4" /></button></div></td></tr>))}</tbody></table></div></div>
      </div>
    </>
  );
}