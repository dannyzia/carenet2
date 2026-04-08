/**
 * Search Service — global search across caregivers, agencies, jobs
 */
import type { CaregiverProfile, Agency, Job } from "@/backend/models";
import { loadMockBarrel } from "@/backend/api/mock/loadMockBarrel";
import { USE_SUPABASE, sbRead, sbData, dataCacheScope, useInAppMockDataset } from "./_sb";

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

export interface GlobalSearchResults {
  caregivers: CaregiverProfile[];
  agencies: Agency[];
  jobs: Job[];
}

function mapCaregiver(d: any): CaregiverProfile {
  return {
    id: d.id, name: d.name, type: d.type, rating: d.rating, reviews: d.reviews,
    location: d.location, experience: d.experience, verified: d.verified,
    specialties: d.specialties || [], agency: d.agency_id, image: d.image,
  };
}

function mapAgency(d: any): Agency {
  return {
    id: d.id, name: d.name, tagline: d.tagline, rating: d.rating, reviews: d.reviews,
    location: d.location, serviceAreas: d.service_areas || [], specialties: d.specialties || [],
    caregiverCount: d.caregiver_count, verified: d.verified, responseTime: d.response_time, image: d.image,
  };
}

function mapJob(d: any): Job {
  return {
    id: d.id, title: d.title, location: d.location, salary: d.salary,
    type: d.type, posted: d.posted || d.created_at, urgent: d.urgent,
    applicants: d.applicants, status: d.status,
  };
}

export const searchService = {
  /** Perform a global search across all entities */
  async globalSearch(query: string): Promise<GlobalSearchResults> {
    if (!query.trim()) return { caregivers: [], agencies: [], jobs: [] };

    if (USE_SUPABASE) {
      const pattern = `%${query}%`;
      return sbRead(`search:${dataCacheScope()}:${query}`, async () => {
        const [cg, ag, jo] = await Promise.all([
          sbData().from("caregiver_profiles").select("*").ilike("name", pattern).limit(20),
          sbData().from("agencies").select("*").ilike("name", pattern).limit(20),
          sbData().from("jobs").select("*").ilike("title", pattern).limit(20),
        ]);
        return {
          caregivers: (cg.data || []).map(mapCaregiver),
          agencies: (ag.data || []).map(mapAgency),
          jobs: (jo.data || []).map(mapJob),
        };
      });
    }

    await delay();
    if (!useInAppMockDataset()) return { caregivers: [], agencies: [], jobs: [] };
    const { MOCK_CAREGIVER_PROFILES, MOCK_AGENCIES, MOCK_MARKETPLACE_JOBS } = await loadMockBarrel();
    const q = query.toLowerCase();
    return {
      caregivers: MOCK_CAREGIVER_PROFILES.filter(
        (c) => c.name.toLowerCase().includes(q) || c.specialties.some((s) => s.toLowerCase().includes(q))
      ),
      agencies: MOCK_AGENCIES.filter(
        (a) => a.name.toLowerCase().includes(q) || a.specialties.some((s) => s.toLowerCase().includes(q))
      ),
      jobs: MOCK_MARKETPLACE_JOBS.filter(
        (j) => j.title.toLowerCase().includes(q) || j.location.toLowerCase().includes(q)
      ),
    };
  },
};
