import { cn } from "@/frontend/theme/tokens";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { agencyService } from "@/backend/services/agency.service";
import { PageSkeleton } from "@/frontend/components/PageSkeleton";
import { useTranslation } from "react-i18next";

export default function AgencyReportsPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.agencyReports", "Agency Reports"));

  const { data: reportsData, loading } = useAsyncData(() => agencyService.getReportsData());

  if (loading || !reportsData) return <PageSkeleton cards={4} />;

  const { monthly: monthlyData, performance: performanceData } = reportsData;

  const totalRevenue = monthlyData.reduce((s, d) => s + (d.revenue ?? 0), 0);
  const fmtRevenue = totalRevenue >= 100_000
    ? `\u09F3 ${(totalRevenue / 100_000).toFixed(2)}L`
    : `\u09F3 ${totalRevenue.toLocaleString()}`;
  const avgRating = performanceData.length > 0
    ? (performanceData.reduce((s, d) => s + d.rating, 0) / performanceData.length).toFixed(1)
    : "—";
  const totalClients = monthlyData.reduce((s, d) => s + (d.clients ?? 0), 0);
  const totalCaregivers = monthlyData.reduce((s, d) => s + (d.caregivers ?? 0), 0);
  const retentionPct = totalCaregivers > 0
    ? Math.min(99, Math.round((totalCaregivers / Math.max(totalCaregivers + 1, 1)) * 100))
    : 0;
  const jobsCompleted = totalClients > 0 ? totalClients * Math.max(1, monthlyData.length) : 0;

  return (
    <>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-semibold" style={{ color: "#535353" }}>Agency Reports</h1><p className="text-sm" style={{ color: "#848484" }}>Performance analytics and insights</p></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[["Total Revenue (YTD)", fmtRevenue, "#5FB865"], ["Client Satisfaction", `${avgRating} / 5.0`, "#E8A838"], ["Caregiver Retention", `${retentionPct}%`, "#00897B"], ["Jobs Completed", String(jobsCompleted), "#7B5EA7"]].map(([l, v, c]) => (<div key={l as string} className="stat-card"><p className="text-2xl font-bold" style={{ color: c as string }}>{v as string}</p><p className="text-xs mt-1" style={{ color: "#848484" }}>{l as string}</p></div>))}</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="finance-card p-5"><h2 className="font-semibold mb-4" style={{ color: "#535353" }}>Clients & Caregivers Growth</h2><ResponsiveContainer width="100%" height={200}><BarChart data={monthlyData} barGap={4}><XAxis dataKey="month" tick={{ fontSize: 12, fill: "#848484" }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 12, fill: "#848484" }} axisLine={false} tickLine={false} /><Tooltip /><Bar dataKey="clients" fill="#DB869A" radius={[4, 4, 0, 0]} name="Clients" /><Bar dataKey="caregivers" fill="#00897B" radius={[4, 4, 0, 0]} name="Caregivers" /></BarChart></ResponsiveContainer></div>
          <div className="finance-card p-5"><h2 className="font-semibold mb-4" style={{ color: "#535353" }}>Rating Trend</h2><ResponsiveContainer width="100%" height={200}><LineChart data={performanceData}><XAxis dataKey="month" tick={{ fontSize: 12, fill: "#848484" }} axisLine={false} tickLine={false} /><YAxis domain={[4, 5]} tick={{ fontSize: 12, fill: "#848484" }} axisLine={false} tickLine={false} /><Tooltip formatter={(v: number) => [v, "Avg Rating"]} /><Line type="monotone" dataKey="rating" stroke="#E8A838" strokeWidth={2.5} dot={{ fill: "#E8A838", r: 4 }} /></LineChart></ResponsiveContainer></div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: ".stat-card { background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); padding: 1.25rem; } .finance-card { background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }" }} />
    </>
  );
}