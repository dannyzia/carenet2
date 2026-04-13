import { describe, it, expect } from "vitest";
import type { ActiveShift, AgencyDashboardSummary, AgencyPlacement, RequirementInboxItem, ShiftAlert } from "@/backend/models";
import { buildAgencyExecutiveDashboard } from "../agencyExecutiveMapper";

const summary: AgencyDashboardSummary = {
  activeCaregivers: 2,
  activeClients: 1,
  revenueMonthLabel: "Mar",
  revenueThisMonthBdt: 120_000,
  avgRating: 4.5,
  marketplacePackagesTotal: 0,
  marketplacePackagesPublished: 0,
  marketplacePackagesDraft: 0,
  openCareRequirementsCount: 0,
};

function execInput(over: Partial<Parameters<typeof buildAgencyExecutiveDashboard>[0]> = {}) {
  return {
    summary,
    monitoring: { shifts: [] as ActiveShift[], alerts: [] },
    cjJobs: [],
    clientEngagements: [],
    caregiverEngagements: [],
    requirements: [] as RequirementInboxItem[],
    placements: [] as AgencyPlacement[],
    openBoardRequirementCount: 0,
    contractPendingOffers: 0,
    activeJobsCount: 0,
    activeJobsHref: "/agency/caregiving-jobs",
    useSupabaseCj: true,
    ...over,
  };
}

describe("buildAgencyExecutiveDashboard", () => {
  it("sorts live shifts so late appears before on-time", () => {
    const shifts: ActiveShift[] = [
      { caregiver: "A", patient: "P1", time: "8-4", checkedIn: "7:55", status: "on-time", lastLog: "", placement: "pl-1" },
      { caregiver: "B", patient: "P2", time: "4-12", checkedIn: "-", status: "late", lastLog: "", placement: "pl-2" },
    ];
    const data = buildAgencyExecutiveDashboard(
      execInput({ monitoring: { shifts, alerts: [] }, activeJobsCount: 2 }),
    );
    expect(data.activeJobs.map((j) => j.status)).toEqual(["late", "on-time"]);
  });

  it("computes fill-rate v1 proxy from placements, board count, and new inbox rows", () => {
    const placements: AgencyPlacement[] = [
      { id: "1", patient: "x", guardian: "g", careType: "c", caregiver: "cg", startDate: "2026-01-01", status: "active" },
      { id: "2", patient: "y", guardian: "g", careType: "c", caregiver: "cg", startDate: "2026-01-01", status: "active" },
    ];
    const requirements: RequirementInboxItem[] = [
      {
        id: "r1",
        guardianName: "G",
        guardianVerified: true,
        guardianPlacements: 0,
        patientName: "Pat",
        patientAge: 60,
        patientCondition: "—",
        careType: "Elder",
        duration: "—",
        shiftPreference: "—",
        budgetMin: 0,
        budgetMax: 0,
        location: "—",
        specialRequirements: "—",
        submittedDate: "2026-04-01",
        submittedAgo: "1d",
        responseDeadline: "",
        status: "new",
        priority: "normal",
        isNew: true,
      },
    ];
    const data = buildAgencyExecutiveDashboard(
      execInput({
        placements,
        openBoardRequirementCount: 3,
        requirements,
      }),
    );
    const fill = data.kpis.find((k) => k.id === "fillRate");
    expect(fill?.format).toBe("plain");
    expect(fill?.value).toBe("33%");
  });

  it("returns an empty queue when there are no engagements or inbox items", () => {
    const data = buildAgencyExecutiveDashboard(execInput());
    expect(data.notifications.caregiverApplications).toBe(0);
    expect(data.queue).toEqual([]);
  });

  it("maps unknown shift alert types to the generic i18n key", () => {
    const alerts: ShiftAlert[] = [{ type: "custom", text: "Legacy English", time: "T1" }];
    const data = buildAgencyExecutiveDashboard(
      execInput({ monitoring: { shifts: [], alerts } }),
    );
    expect(data.alerts[0].messageKey).toBe("dashboard:agency.executive.alertShift.generic");
    expect(data.alerts[0].messageParams).toEqual({ window: "T1" });
    expect(data.alerts[0].message).toBeUndefined();
  });
});
