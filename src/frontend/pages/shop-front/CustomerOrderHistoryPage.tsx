"use client";

import React from "react";
import { Search, RefreshCcw } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/frontend/components/ui/button";
import { PageHero } from "@/frontend/components/shared/PageHero";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { shopService } from "@/backend/services";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import { useTranslation } from "react-i18next";

export default function OrderHistoryPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.orderHistory", "Order History"));

  const {
    data: orders,
    loading,
    error,
    refetch,
  } = useAsyncData(() => shopService.getCustomerOrders());

  if (loading) {
    return <PageSkeleton cards={3} />;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="finance-card p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Order History Unavailable</h1>
          <p className="mt-3 text-sm text-gray-500">
            We could not load your orders right now. Please try again.
          </p>
          <Button className="mt-6" onClick={refetch}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const orderList = orders ?? [];

  if (orderList.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="finance-card p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">No Orders Yet</h1>
          <p className="mt-3 text-sm text-gray-500">
            Your order history will appear here after your first purchase.
          </p>
          <Link to="/shop">
            <Button className="mt-6">Browse Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHero
        gradient="radial-gradient(143.86% 887.35% at -10.97% -22.81%, #FFAB91 0%, #E64A19 100%)"
        className="pt-8 pb-32 px-6"
      >
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-8">My Shop Orders</h1>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 w-4 h-4" />
              <input
                type="text"
                placeholder="Search orders by ID or product..."
                className="w-full h-12 bg-white/10 border border-white/20 rounded-2xl pl-12 pr-4 text-white placeholder:text-white/50 outline-none"
              />
            </div>
            <Button className="bg-white text-[#E64A19] hover:bg-white/90 font-bold rounded-2xl h-12 px-6">
              Filter
            </Button>
          </div>
        </div>
      </PageHero>

      <div className="max-w-4xl mx-auto px-6 -mt-16">
        <div className="space-y-4">
          {orderList.map((order) => (
            <div key={order.id} className="finance-card overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order ID</p>
                  <p className="font-bold text-gray-800">#{order.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ordered On</p>
                  <p className="font-bold text-gray-800">{order.date}</p>
                </div>
              </div>

              <div className="p-6 flex flex-col md:flex-row gap-6 items-center">
                <div className="w-20 h-20 rounded-2xl bg-gray-100 overflow-hidden flex-shrink-0">
                  <img src={order.img} className="w-full h-full object-cover" alt="prod" />
                </div>

                <div className="flex-1 text-center md:text-left">
                  <h3 className="font-bold text-gray-800 mb-1">
                    {order.status === "In Transit" ? "Package is on the way" : "Delivered successfully"}
                  </h3>
                  <p className="text-xs text-gray-400 font-medium">
                    Contains {order.items} items {"\u2022"} Total:{" "}
                    <span className="text-gray-800 font-bold">{order.total}</span>
                  </p>
                  <div className="flex items-center justify-center md:justify-start gap-2 mt-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        order.status === "In Transit" ? "bg-orange-400 animate-pulse" : "bg-[#7CE577]"
                      }`}
                    />
                    <span
                      className={`text-[10px] font-black uppercase ${
                        order.status === "In Transit" ? "text-orange-500" : "text-[#5FB865]"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                  <Link to={`/shop/order-tracking/${order.id}`} className="flex-1 md:flex-none">
                    <Button variant="outline" className="w-full h-11 rounded-xl border-gray-200 text-xs font-bold">
                      Track Order
                    </Button>
                  </Link>
                  <Button className="flex-1 md:flex-none h-11 rounded-xl bg-gray-900 text-white text-xs font-bold">
                    View Items
                  </Button>
                </div>
              </div>

              {order.status === "Delivered" && (
                <div className="px-6 py-4 bg-[#FFF5F7] flex justify-between items-center">
                  <p className="text-[10px] font-bold text-[#DB869A] uppercase flex items-center gap-2">
                    <RefreshCcw className="w-3 h-3" /> Re-order
                  </p>
                  <button className="text-[10px] font-black text-[#DB869A] uppercase underline">
                    Write Review
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html:
            ".finance-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.4); border-radius: 2rem; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03); }",
        }}
      />
    </div>
  );
}
