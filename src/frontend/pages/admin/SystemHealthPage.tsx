import React from "react";
import {
  Activity, ArrowLeft, ChevronRight, Database, Server, Cpu, Globe,
  ShieldCheck, AlertTriangle, CheckCircle2, Clock, Zap, TrendingUp,
  RefreshCcw, Terminal
} from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { useNavigate } from "react-router";
import { PageHero } from "@/frontend/components/PageHero";
import { ChannelHealthDashboard } from "@/frontend/components/ChannelHealthDashboard";
import { RealtimeStatusIndicator } from "@/frontend/components/RealtimeStatusIndicator";
import { useGlobalChannelHealthToast } from "@/frontend/hooks/useGlobalChannelHealthToast";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from "recharts";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { adminService } from "@/backend/services/admin.service";
import { PageSkeleton } from "@/frontend/components/PageSkeleton";
import { useTranslation } from "react-i18next";

export default function SystemHealthPage() {
  const { t, t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.systemHealth", "System Health"));

  const navigate = useNavigate();
  useGlobalChannelHealthToast();

  const { data: performanceData, loading: perfLoading } = useAsyncData(() =>
    adminService.getSystemPerformance()
  );
  const { data: securityAlerts, loading: alertsLoading } = useAsyncData(() =>
    adminService.getRecentSecurityAlerts(8)
  );

  if (perfLoading || alertsLoading || performanceData === null || securityAlerts === null) {
    return <PageSkeleton cards={4} />;
  }

  const latestPerf = performanceData.length > 0 ? performanceData[performanceData.length - 1] : null;
  const avgLatency = performanceData.length > 0
    ? Math.round(performanceData.reduce((s, p) => s + p.latency, 0) / performanceData.length)
    : 0;
  const avgCpu = performanceData.length > 0
    ? Math.round(performanceData.reduce((s, p) => s + p.cpu, 0) / performanceData.length)
    : 0;
  const currentLatency = latestPerf?.latency ?? avgLatency;
  const currentCpu = latestPerf?.cpu ?? avgCpu;
  const hasPerfSamples = performanceData.length > 0;

  return (
    <div>
      <PageHero gradient="radial-gradient(143.86% 887.35% at -10.97% -22.81%, #1F2937 0%, #000000 100%)" className="pt-8 pb-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-12"><div className="flex items-center gap-4 text-white"><h1 className="text-2xl font-bold">System Health Monitor</h1></div><div className="flex gap-2"><div className="px-4 py-2 rounded-xl bg-[#E8F9E7]/10 text-[#7CE577] text-[10px] font-black uppercase tracking-widest border border-[#7CE577]/20 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#7CE577] animate-pulse" />All Systems Operational</div><Button className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold rounded-xl h-11 px-6"><RefreshCcw className="w-4 h-4 mr-2" /> Force Reboot Nodes</Button></div></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">{[{ label: "API Latency", val: `${currentLatency}ms`, icon: Zap, status: "ok" }, { label: "Data Points", val: `${performanceData.length}`, icon: Database, status: "ok" }, { label: "CPU Load", val: `${currentCpu}%`, icon: Cpu, status: "ok" }, { label: "Active Nodes", val: `${performanceData.length > 0 ? 1 : 0}`, icon: Globe, status: "ok" }].map((s, i) => (<div key={i} className="finance-card p-6 !bg-white/5 !backdrop-blur-xl !border-white/10 text-white"><s.icon className="w-5 h-5 text-white/40 mb-3" /><p className="text-[10px] font-bold text-white/50 uppercase tracking-widest leading-none mb-2">{s.label}</p><p className="text-2xl font-black">{s.val}</p></div>))}</div>
        </div>
      </PageHero>

      <div className="max-w-6xl mx-auto px-6 -mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="finance-card p-10">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#FEB4C5]" />
                  Real-time Latency (ms)
                </h3>
                <div className="flex gap-2">
                  {["1H", "24H", "7D"].map((range) => (
                    <button
                      key={range}
                      type="button"
                      className="px-3 py-1 rounded-lg bg-gray-50 text-[10px] font-black text-gray-400 hover:text-gray-800 transition-all"
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>
              {hasPerfSamples ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceData}>
                      <defs>
                        <linearGradient id="colorLat" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FEB4C5" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#FEB4C5" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#999" }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#999" }} />
                      <Tooltip
                        contentStyle={{ borderRadius: "16px", border: "none", shadow: "0 10px 40px rgba(0,0,0,0.1)" }}
                      />
                      <Area type="monotone" dataKey="latency" stroke="#FEB4C5" strokeWidth={4} fillOpacity={1} fill="url(#colorLat)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-gray-500 py-8">
                  {t(
                    "systemHealthUi.noPerfSamples",
                    "No performance samples recorded yet. Charts will populate when telemetry is available.",
                  )}
                </p>
              )}
            </div>
            <div className="finance-card p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-8 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-gray-400" />
                Performance Timeline
              </h3>
              {hasPerfSamples ? (
                <div className="space-y-3 font-mono">
                  {performanceData
                    .slice(-5)
                    .reverse()
                    .map((p, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center p-3 rounded-xl bg-gray-50 border border-gray-100 text-[10px]"
                      >
                        <div className="flex gap-4">
                          <span className="text-[#DB869A] font-black">MONITOR</span>
                          <span className="text-gray-800 font-bold">
                            LATENCY_{p.latency}ms CPU_{p.cpu}%
                          </span>
                        </div>
                        <span className="text-gray-300">{p.time}</span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">{t("systemHealthUi.noPerfSamples", "No performance samples yet.")}</p>
              )}
            </div>
          </div>
          <aside className="lg:col-span-1 space-y-6">
            <div className="finance-card p-0 overflow-hidden" data-testid="admin-channel-health-widget"><div className="flex items-center justify-between px-6 pt-5 pb-3"><h3 className="font-bold text-gray-800 flex items-center gap-2"><Activity className="w-4 h-4 text-[#DB869A]" />Realtime Channels</h3><RealtimeStatusIndicator variant="badge" /></div><div className="px-3 pb-4" data-testid="admin-channel-health-dashboard"><ChannelHealthDashboard compact /></div></div>
            <div className="finance-card p-8 bg-[#111827] text-white overflow-hidden relative">
              <h3 className="font-bold mb-6 flex items-center gap-2 relative z-10">
                <Server className="w-4 h-4 text-[#7CE577]" />
                Performance Nodes
              </h3>
              <div className="space-y-6 relative z-10">
                {hasPerfSamples ? (
                  performanceData.slice(-3).map((p, i) => {
                    const load = Math.min(100, Math.round((p.latency / 200) * 100));
                    const status = load > 75 ? "warning" : "ok";
                    return (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-white/40 uppercase tracking-widest">
                            NODE_{String(i + 1).padStart(2, "0")} · {p.time}
                          </span>
                          <span className={status === "warning" ? "text-orange-400" : "text-[#7CE577]"}>{load}%</span>
                        </div>
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${status === "warning" ? "bg-orange-400" : "bg-[#7CE577]"}`}
                            style={{ width: `${load}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-white/50">{t("systemHealthUi.noPerfSamples", "No samples yet.")}</p>
                )}
              </div>
              <Server className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 opacity-10" />
            </div>
            <div
              className={`finance-card p-8 border-l-4 ${
                securityAlerts.length > 0
                  ? "border-red-500 bg-red-50/30"
                  : "border-gray-200 bg-gray-50/50"
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle
                  className={`w-5 h-5 ${securityAlerts.length > 0 ? "text-red-500" : "text-gray-400"}`}
                />
                <h3
                  className={`font-bold ${securityAlerts.length > 0 ? "text-red-700" : "text-gray-700"}`}
                >
                  Security Alerts
                </h3>
              </div>
              {securityAlerts.length === 0 ? (
                <p className="text-xs text-gray-500 leading-relaxed mb-4">
                  No warning or critical events in the audit log recently.
                </p>
              ) : (
                <ul className="space-y-4 mb-6">
                  {securityAlerts.map(a => (
                    <li key={a.id} className="text-xs leading-relaxed border-b border-red-100/60 last:border-0 pb-3 last:pb-0">
                      <p className="font-bold text-red-800">{a.title}</p>
                      <p className="text-red-600/90 mt-1">{a.detail}</p>
                      <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-wide">
                        {a.timeLabel}
                        {a.source ? ` · ${a.source}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              <Button
                variant="ghost"
                className={`w-full h-11 text-[10px] font-black uppercase tracking-widest ${
                  securityAlerts.length > 0
                    ? "bg-white border border-red-100 text-red-600 hover:bg-red-50"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
              >
                Investigate Log
              </Button>
            </div>
          </aside>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: ".finance-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.4); border-radius: 2rem; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03); }" }} />
    </div>
  );
}