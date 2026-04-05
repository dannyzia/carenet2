/**
 * Admin Service — platform administration data
 */
import type {
  AdminDashboardData, AdminPaymentsData,
  AdminVerification, AdminReport, AdminUser, AdminAgencyApproval,
  AdminPlacement, AgencyPerformanceRow, AdminAlert,
  AuditChartDataPoint, SystemPerformancePoint,
  AuditLogsData, CMSPageData, DisputeData, PolicyData, PromoData,
  SupportTicketData, UserInspectorData, VerificationCaseData, AdminSettingsData,
} from "@/backend/models";
import {
  MOCK_ADMIN_DASHBOARD,
  MOCK_ADMIN_PAYMENTS,
  MOCK_ADMIN_VERIFICATIONS,
  MOCK_ADMIN_REPORTS,
  MOCK_ADMIN_USERS,
  MOCK_ADMIN_AGENCY_APPROVALS,
  MOCK_ADMIN_PLACEMENTS,
  MOCK_AGENCY_PERFORMANCE,
  MOCK_ADMIN_ALERTS,
  MOCK_AUDIT_CHART_DATA,
  MOCK_SYSTEM_PERFORMANCE,
  MOCK_AUDIT_LOGS,
  MOCK_CMS_PAGE_DATA,
  MOCK_DISPUTE_DATA,
  MOCK_POLICY_DATA,
  MOCK_PROMO_DATA,
  MOCK_SUPPORT_TICKET,
  MOCK_USER_INSPECTOR,
  MOCK_VERIFICATION_CASE,
  MOCK_ADMIN_SETTINGS,
} from "@/backend/api/mock";
import { USE_SUPABASE, sbRead, sb } from "./_sb";

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

export const adminService = {
  async getDashboardData(): Promise<AdminDashboardData> {
    if (USE_SUPABASE) {
      try {
        return await sbRead("admin:dashboard", async () => {
          const { data, error } = await sb().rpc("get_admin_dashboard");
          if (error) throw error;
          const d = data as any;
          return {
            userGrowth: d.userGrowth || [],
            revenueData: d.revenueData || [],
            pieData: [], // Computed client-side from stats
            pendingItems: (d.pendingItems || []).map((p: any) => ({
              type: p.type, count: p.count, color: "#E91E63", path: `/admin/${p.type}`,
            })),
            recentActivity: [],
          };
        });
      } catch (error) {
        console.warn("[Admin Service] Supabase call failed, falling back to mock data:", error);
        // Fall back to mock data when Supabase fails
        await delay();
        return MOCK_ADMIN_DASHBOARD;
      }
    }
    await delay();
    return MOCK_ADMIN_DASHBOARD;
  },

  async getPaymentsData(): Promise<AdminPaymentsData> {
    if (USE_SUPABASE) {
      try {
        return await sbRead("admin:payments", async () => {
          const { data: chart, error } = await sb().from("admin_payments_monthly")
            .select("*")
            .order("month_start", { ascending: true });
          if (error) throw error;
          return {
            chartData: (chart || []).map((d: any) => ({
              month: d.month, income: Number(d.income), payouts: Number(d.payouts),
            })),
            transactions: [], // Would come from wallet_transactions joined view
          };
        });
      } catch (error) {
        console.warn("[Admin Service] Supabase payments call failed, falling back to mock data:", error);
        await delay();
        return MOCK_ADMIN_PAYMENTS;
      }
    }
    await delay();
    return MOCK_ADMIN_PAYMENTS;
  },

  async getVerifications(): Promise<AdminVerification[]> {
    if (USE_SUPABASE) {
      try {
        return await sbRead("admin:verifications", async () => {
          const { data, error } = await sb().from("caregiver_documents")
            .select("*, caregiver_profiles!caregiver_documents_caregiver_id_fkey(name)")
            .in("status", ["pending", "review"])
            .order("created_at", { ascending: false });
          if (error) throw error;
          return (data || []).map((d: any, i: number) => {
            const rawStatus = String(d.status || "pending");
            const status = rawStatus === "review" ? "under_review" : rawStatus;
            const name = d.caregiver_profiles?.name || "Unknown";
            return {
              id: typeof d.id === "number" ? d.id : Number(d.id) || i + 1,
              name,
              role: "Caregiver",
              submitted: d.uploaded || d.created_at || "—",
              docs: d.category ? [String(d.category)] : ["Document"],
              status,
              location: d.location || "—",
              specialty: d.specialty || "—",
              avatar: name.charAt(0).toUpperCase() || "?",
              color: "#DB869A",
            };
          });
        });
      } catch (error) {
        console.warn("[Admin Service] Supabase verifications call failed, falling back to mock data:", error);
        await delay();
        return MOCK_ADMIN_VERIFICATIONS;
      }
    }
    await delay();
    return MOCK_ADMIN_VERIFICATIONS;
  },

  async getReports(): Promise<AdminReport[]> {
    if (USE_SUPABASE) {
      try {
        return await sbRead("admin:reports", async () => {
          return [];
        });
      } catch (error) {
        console.warn("[Admin Service] Supabase reports call failed, falling back to mock data:", error);
        await delay();
        return MOCK_ADMIN_REPORTS;
      }
    }
    await delay();
    return MOCK_ADMIN_REPORTS;
  },

  async getUsers(): Promise<AdminUser[]> {
    if (USE_SUPABASE) {
      try {
        return await sbRead("admin:users", async () => {
          const { data, error } = await sb().from("profiles")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(200);
          if (error) throw error;
          return (data || []).map((d: any, i: number) => ({
            id: typeof d.id === "number" ? d.id : i + 1,
            name: d.name || "User",
            role: d.role || "Caregiver",
            phone: d.phone || "—",
            location: d.location || d.city || "—",
            joined: d.created_at ? String(d.created_at).slice(0, 10) : "—",
            status: ["active", "pending", "suspended"].includes(d.status) ? d.status : "active",
            verified: Boolean(d.verified),
            avatar: (d.name || "?").charAt(0).toUpperCase(),
            color: "#7B5EA7",
          }));
        });
      } catch (error) {
        console.warn("[Admin Service] Supabase users call failed, falling back to mock data:", error);
        await delay();
        return MOCK_ADMIN_USERS;
      }
    }
    await delay();
    return MOCK_ADMIN_USERS;
  },

  async getAgencyApprovals(): Promise<AdminAgencyApproval[]> {
    if (USE_SUPABASE) {
      try {
        return await sbRead("admin:agency-approvals", async () => {
          const { data, error } = await sb().from("agencies")
            .select("*")
            .eq("verified", false)
            .order("created_at", { ascending: false });
          if (error) throw error;
          return (data || []).map((d: any) => ({
            id: d.id,
            name: d.name,
            owner: d.owner_name || "Unknown",
            email: d.email || "—",
            phone: d.phone || "—",
            location: d.location || "—",
            applied: d.created_at ? String(d.created_at).slice(0, 10) : "—",
            status: "pending",
          }));
        });
      } catch (error) {
        console.warn("[Admin Service] Supabase agency approvals call failed, falling back to mock data:", error);
        await delay();
        return MOCK_ADMIN_AGENCY_APPROVALS;
      }
    }
    await delay();
    return MOCK_ADMIN_AGENCY_APPROVALS;
  },

  async getPlacements(): Promise<AdminPlacement[]> {
    if (USE_SUPABASE) {
      try {
        return await sbRead("admin:placements", async () => {
          const { data, error } = await sb().from("placements")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(100);
          if (error) throw error;
          return (data || []).map((d: any) => ({
            id: d.id, patient: d.patient_name, guardian: d.guardian_name,
            agency: d.agency_name, caregiver: d.caregiver_name,
            careType: d.care_type, status: d.status,
            startDate: d.start_date, compliance: d.compliance,
          }));
        });
      } catch (error) {
        console.warn("[Admin Service] Supabase placements call failed, falling back to mock data:", error);
        await delay();
        return MOCK_ADMIN_PLACEMENTS;
      }
    }
    await delay();
    return MOCK_ADMIN_PLACEMENTS;
  },

  async getAgencyPerformance(): Promise<AgencyPerformanceRow[]> {
    if (USE_SUPABASE) {
      try {
        return await sbRead("admin:agency-perf", async () => {
          const { data, error } = await sb().from("agency_performance_summary")
            .select("*")
            .order("total_revenue", { ascending: false });
          if (error) throw error;
          return (data || []).map((d: any) => ({
            name: d.agency_name,
            placements: d.total_placements,
            rating: d.agency_rating,
            onTimeRate: `${d.on_time_rate}%`,
            incidentRate: `${d.incident_rate}%`,
            revenue: `৳${Number(d.total_revenue).toLocaleString()}`,
          }));
        });
      } catch (error) {
        console.warn("[Admin Service] Supabase agency performance call failed, falling back to mock data:", error);
        await delay();
        return MOCK_AGENCY_PERFORMANCE;
      }
    }
    await delay();
    return MOCK_AGENCY_PERFORMANCE;
  },

  async getAlerts(): Promise<AdminAlert[]> {
    if (USE_SUPABASE) {
      try {
        return await sbRead("admin:alerts", async () => {
          return [];
        });
      } catch (error) {
        console.warn("[Admin Service] Supabase alerts call failed, falling back to mock data:", error);
        await delay();
        return MOCK_ADMIN_ALERTS;
      }
    }
    await delay();
    return MOCK_ADMIN_ALERTS;
  },

  async getAuditChartData(): Promise<AuditChartDataPoint[]> {
    if (USE_SUPABASE) {
      try {
        return await sbRead("admin:audit-chart", async () => {
          const { data, error } = await sb().from("admin_payments_monthly")
            .select("*")
            .order("month_start", { ascending: true })
            .limit(30);
          if (error) throw error;
          return (data || []).map((d: any) => ({
            day: d.month,
            rev: Number(d.income),
            payout: Number(d.payouts),
          }));
        });
      } catch (error) {
        console.warn("[Admin Service] Supabase audit chart call failed, falling back to mock data:", error);
        await delay();
        return MOCK_AUDIT_CHART_DATA;
      }
    }
    await delay();
    return MOCK_AUDIT_CHART_DATA;
  },

  async getSystemPerformance(): Promise<SystemPerformancePoint[]> {
    if (USE_SUPABASE) {
      try {
        return await sbRead("admin:sys-perf", async () => {
          return [];
        });
      } catch (error) {
        console.warn("[Admin Service] Supabase system performance call failed, falling back to mock data:", error);
        await delay();
        return MOCK_SYSTEM_PERFORMANCE;
      }
    }
    await delay();
    return MOCK_SYSTEM_PERFORMANCE;
  },

  async getAuditLogs(): Promise<AuditLogsData> {
    if (USE_SUPABASE) {
      try {
        return await sbRead("admin:audit-logs", async () => {
          return { logs: [], total: 0 };
        });
      } catch (error) {
        console.warn("[Admin Service] Supabase audit logs call failed, falling back to mock data:", error);
        await delay();
        return MOCK_AUDIT_LOGS;
      }
    }
    await delay();
    return MOCK_AUDIT_LOGS;
  },

  async getCMSPageData(): Promise<CMSPageData> {
    if (USE_SUPABASE) {
      try {
        return await sbRead("admin:cms", async () => {
          const { data, error } = await sb().from("blog_posts")
            .select("*")
            .eq("published", true)
            .order("created_at", { ascending: false })
            .limit(50);
          if (error) throw error;
          return {
            pages: (data || []).map((d: any) => ({
              id: d.id,
              title: d.title,
              slug: d.slug || d.title.toLowerCase().replace(/\s+/g, "-"),
              content: d.content || d.excerpt || "",
              status: d.published ? "published" : "draft",
              updatedAt: d.updated_at || d.created_at,
            })),
            total: data?.length || 0,
          };
        });
      } catch (error) {
        console.warn("[Admin Service] Supabase CMS page data call failed, falling back to mock data:", error);
        await delay();
        return MOCK_CMS_PAGE_DATA;
      }
    }
    await delay();
    return MOCK_CMS_PAGE_DATA;
  },

  async getDisputeData(): Promise<DisputeData> {
    if (USE_SUPABASE) {
      try {
        return await sbRead("admin:disputes", async () => {
          const { data, error } = await sb().from("contract_disputes")
            .select("*")
            .order("filed_at", { ascending: false });
          if (error) throw error;
          return {
            disputes: (data || []).map((d: any) => ({
              id: d.id,
              title: d.title || `Dispute #${d.id}`,
              filedBy: d.filed_by_name || "Unknown",
              against: d.against_name || "Unknown",
              reason: d.reason || "",
              status: d.status || "pending",
              filedAt: d.filed_at,
              priority: d.priority || "medium",
            })),
            total: data?.length || 0,
          };
        });
      } catch (error) {
        console.warn("[Admin Service] Supabase dispute data call failed, falling back to mock data:", error);
        await delay();
        return MOCK_DISPUTE_DATA;
      }
    }
    await delay();
    return MOCK_DISPUTE_DATA;
  },

  async getPolicyData(): Promise<PolicyData> {
    if (USE_SUPABASE) {
      try {
        return await sbRead("admin:policies", async () => {
          return { policies: [] };
        });
      } catch (error) {
        console.warn("[Admin Service] Supabase policy data call failed, falling back to mock data:", error);
        await delay();
        return MOCK_POLICY_DATA;
      }
    }
    await delay();
    return MOCK_POLICY_DATA;
  },

  async getPromoData(): Promise<PromoData> {
    if (USE_SUPABASE) {
      try {
        return await sbRead("admin:promos", async () => {
          return { promos: [] };
        });
      } catch (error) {
        console.warn("[Admin Service] Supabase promo data call failed, falling back to mock data:", error);
        await delay();
        return MOCK_PROMO_DATA;
      }
    }
    await delay();
    return MOCK_PROMO_DATA;
  },

  async getSupportTicket(id: string): Promise<SupportTicketData> {
    if (USE_SUPABASE) {
      return sbRead(`admin:ticket:${id}`, async () => {
        const { data, error } = await sb().from("support_tickets")
          .select("*")
          .eq("id", id)
          .single();
        if (error) throw error;
        const d = data as any;
        return {
          id: d.id, subject: d.subject, category: d.category,
          priority: d.priority, status: d.status,
          userId: d.user_id, createdAt: d.created_at,
          updatedAt: d.updated_at,
        };
      });
    }
    await delay();
    return { ...MOCK_SUPPORT_TICKET, id };
  },

  async getUserInspector(query?: string): Promise<UserInspectorData> {
    if (USE_SUPABASE) {
      try {
        return await sbRead("admin:user-inspector", async () => {
          let q = sb().from("profiles").select("*").order("created_at", { ascending: false }).limit(100);
          if (query) {
            q = q.ilike("name", `%${query}%`);
          }
          const { data, error } = await q;
          if (error) throw error;
          return {
            users: (data || []).map((d: any) => ({
              id: d.id,
              name: d.name || "User",
              role: d.role || "Caregiver",
              email: d.email || "—",
              phone: d.phone || "—",
              status: d.status || "active",
              joined: d.created_at ? String(d.created_at).slice(0, 10) : "—",
            })),
            total: data?.length || 0,
          };
        });
      } catch (error) {
        console.warn("[Admin Service] Supabase user inspector call failed, falling back to mock data:", error);
        await delay();
        return MOCK_USER_INSPECTOR;
      }
    }
    await delay();
    return MOCK_USER_INSPECTOR;
  },

  async getVerificationCase(id: string): Promise<VerificationCaseData> {
    if (USE_SUPABASE) {
      try {
        return await sbRead(`admin:verification:${id}`, async () => {
          const { data, error } = await sb().from("caregiver_documents")
            .select("*, caregiver_profiles!caregiver_documents_caregiver_id_fkey(name)")
            .eq("id", id)
            .maybeSingle();
          if (error) throw error;
          if (!data) return { id, name: "", status: "pending", documents: [], notes: "" };
          const rawStatus = String(data.status || "pending");
          return {
            id: String(data.id),
            name: data.caregiver_profiles?.name || "Unknown",
            status: rawStatus === "review" ? "under_review" : rawStatus,
            documents: data.category ? [{ name: data.name || "Document", category: data.category, status: data.status }] : [],
            notes: data.notes || "",
          };
        });
      } catch (error) {
        console.warn("[Admin Service] Supabase verification case call failed, falling back to mock data:", error);
        await delay();
        return { ...MOCK_VERIFICATION_CASE, id };
      }
    }
    await delay();
    return { ...MOCK_VERIFICATION_CASE, id };
  },

  async getSettingsData(): Promise<AdminSettingsData> {
    if (USE_SUPABASE) {
      try {
        return await sbRead("admin:settings", async () => {
          return { siteName: "", maintenanceMode: false, maxUploadSize: 0, allowedFileTypes: [] };
        });
      } catch (error) {
        console.warn("[Admin Service] Supabase settings data call failed, falling back to mock data:", error);
        await delay();
        return MOCK_ADMIN_SETTINGS;
      }
    }
    await delay();
    return MOCK_ADMIN_SETTINGS;
  },
};