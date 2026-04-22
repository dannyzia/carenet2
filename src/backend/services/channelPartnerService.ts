/**
 * Channel Partner Service
 * Manages Channel Partner profiles, leads, commissions, and rates
 * Full mock fallback support when USE_SUPABASE = false
 */

import { USE_SUPABASE, sb, sbData, sbRead, sbWrite, currentUserId } from './_sb';
import { withRetry } from '@/backend/utils/retry';
import { dedup } from '@/backend/utils/dedup';
import type { AuditLogEntry } from '@/backend/models/admin.model';
import { CP_CONFIG, CP_STATUS, CP_LEAD_ROLES, CP_COMMISSION_STATUS, CP_ATTRIBUTION_METHODS } from '@/backend/utils/channelPartnerConstants';
import type { CpLeadRole } from '@/backend/utils/channelPartnerConstants';
import { channelPartnerNotifications } from './channelPartnerNotifications';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ChanPProfile {
  id: string;                    // channel_partners.id (myChanPId)
  userId: string;
  status: 'pending_approval' | 'active' | 'suspended' | 'deactivated' | 'rejected';
  referralCode: string | null;
  businessName: string | null;
  nidNumber: string | null;      // masked on display
  phone: string | null;
  bankAccount: { bank: string; accountNumber: string; accountName: string; routingNumber: string } | null;
  reapplicationCount: number;
  rejectionReason: string | null;
  rejectedAt: string | null;
  suspendedReason: string | null;
  suspendedAt: string | null;
  deactivatedAt: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChanPLead {
  id: string;
  channelPartnerId: string;
  leadUserId: string;
  leadName: string;
  leadRole: CpLeadRole;
  attributionMethod: 'referral_code' | 'cp_created' | 'admin_assignment';
  referralCodeUsed: string | null;
  isActive: boolean;
  registrationCompletedAt: string | null;
  joinedAt: string;
}

export interface LeadJob {
  placementId: string;           // CJ ID
  invoiceId: string | null;
  invoiceAmount: number | null;  // CarePoints
  invoiceDate: string | null;
  paymentStatus: string | null;
}

export interface ChanPCommission {
  id: string;
  channelPartnerId: string;
  leadUserId: string;
  leadName: string;
  leadRole: CpLeadRole;
  invoiceId: string;
  invoiceAmount: number;
  platformCommissionAmount: number;
  cpCommissionRate: number;
  cpCommissionAmount: number;
  status: 'pending' | 'credited' | 'paid' | 'reversed';
  walletTransactionId: string | null;
  invoiceGeneratedAt: string;
  paymentCollectedAt: string | null;
  creditedAt: string | null;
  reversedAt: string | null;
  reversalReason: string | null;
}

export interface ChanPRateRecord {
  id: string;
  channelPartnerId: string;
  leadRole: CpLeadRole;
  rate: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  expiresAt: string;
  expiryNotified: boolean;
  previousRate: number | null;
  changedBy: string;
  reason: string | null;
  createdAt: string;
}

type ChanPRateByRole = Partial<Record<CpLeadRole, ChanPRateRecord>>;

export interface CreateLeadInput {
  leadRole: CpLeadRole;
  name: string;
  phone: string;
  district: string;
  email?: string;
  // Guardian
  patientName?: string;
  careType?: string;
  specialRequirements?: string;
  // Agency
  agencyName?: string;
  licenseNumber?: string;
  // Caregiver
  specialty?: string;
  yearsOfExperience?: number;
  // Shop
  shopName?: string;
  shopCategory?: string;
  shopAddress?: string;
}

export interface ChanPSummary {
  id: string;
  userId: string;
  name: string;
  referralCode: string | null;
  status: string;
  leadCount: number;
  hasExpiringRates: boolean;
  totalCommissionPaid: number;
}

export interface ChanPDetail extends ChanPProfile {
  leads: ChanPLead[];
  commissions: ChanPCommission[];
  rates: ChanPRateRecord[];
  auditTrail: AuditLogEntry[];
}

export interface RateInput {
  leadRole: CpLeadRole;
  rate: number;
  expiresAt: string;
  reason: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════

const MOCK_CP_PROFILES: ChanPProfile[] = [
  {
    id: 'cp-demo-001',
    userId: 'demo-channel-partner-1',
    status: 'active',
    referralCode: 'REF-CP-A1B2C3',
    businessName: 'Mock_Chan Partner Ltd',
    nidNumber: '1234567890123',
    phone: '01212345678',
    bankAccount: { bank: 'Mock Bank', accountNumber: '****1234', accountName: 'Mock Chan Partner', routingNumber: '123456789' },
    reapplicationCount: 0,
    rejectionReason: null,
    rejectedAt: null,
    suspendedReason: null,
    suspendedAt: null,
    deactivatedAt: null,
    approvedAt: '2024-06-01T10:00:00Z',
    createdAt: '2024-06-01T08:00:00Z',
    updatedAt: '2024-06-01T10:00:00Z',
  },
  {
    id: 'cp-demo-002',
    userId: 'cp-pending-user',
    status: 'pending_approval',
    referralCode: null,
    businessName: 'Pending Partners Inc',
    nidNumber: null,
    phone: '01987654321',
    bankAccount: null,
    reapplicationCount: 0,
    rejectionReason: null,
    rejectedAt: null,
    suspendedReason: null,
    suspendedAt: null,
    deactivatedAt: null,
    approvedAt: null,
    createdAt: '2024-04-20T08:00:00Z',
    updatedAt: '2024-04-20T08:00:00Z',
  },
  {
    id: 'cp-demo-003',
    userId: 'demo-cp-rejected-1',
    status: 'rejected',
    referralCode: null,
    businessName: 'Mock_Rejected ChanP',
    nidNumber: null,
    phone: '01212345680',
    bankAccount: null,
    reapplicationCount: 1,
    rejectionReason: 'Incomplete business documentation. Please provide trade license and resubmit.',
    rejectedAt: '2024-04-15T10:30:00Z',
    suspendedReason: null,
    suspendedAt: null,
    deactivatedAt: null,
    approvedAt: null,
    createdAt: '2024-04-10T08:00:00Z',
    updatedAt: '2024-04-15T10:30:00Z',
  },
  {
    id: 'cp-demo-004',
    userId: 'demo-cp-suspended-1',
    status: 'suspended',
    referralCode: 'REF-CP-SUSPENDED',
    businessName: 'Mock_Suspended ChanP',
    nidNumber: '9876543210987',
    phone: '01212345681',
    bankAccount: { bank: 'Mock Bank', accountNumber: '****5678', accountName: 'Mock Suspended CP', routingNumber: '987654321' },
    reapplicationCount: 0,
    rejectionReason: null,
    rejectedAt: null,
    suspendedReason: 'Policy violation: Multiple complaints about misleading referrals.',
    suspendedAt: '2024-04-18T14:00:00Z',
    deactivatedAt: null,
    approvedAt: '2024-03-01T09:00:00Z',
    createdAt: '2024-03-01T08:00:00Z',
    updatedAt: '2024-04-18T14:00:00Z',
  },
];

const MOCK_CP_RATES: ChanPRateRecord[] = [
  {
    id: 'rate-001',
    channelPartnerId: 'cp-demo-001',
    leadRole: 'guardian',
    rate: 15.00,
    effectiveFrom: '2024-06-01T10:00:00Z',
    effectiveTo: null,
    expiresAt: '2024-12-31T23:59:59Z',
    expiryNotified: false,
    previousRate: null,
    changedBy: 'demo-admin-1',
    reason: 'Initial approval rate',
    createdAt: '2024-06-01T10:00:00Z',
  },
  {
    id: 'rate-002',
    channelPartnerId: 'cp-demo-001',
    leadRole: 'agency',
    rate: 20.00,
    effectiveFrom: '2024-06-01T10:00:00Z',
    effectiveTo: null,
    expiresAt: '2024-12-31T23:59:59Z',
    expiryNotified: false,
    previousRate: null,
    changedBy: 'demo-admin-1',
    reason: 'Initial approval rate',
    createdAt: '2024-06-01T10:00:00Z',
  },
  {
    id: 'rate-003',
    channelPartnerId: 'cp-demo-001',
    leadRole: 'caregiver',
    rate: 10.00,
    effectiveFrom: '2024-06-01T10:00:00Z',
    effectiveTo: null,
    expiresAt: '2024-12-31T23:59:59Z',
    expiryNotified: false,
    previousRate: null,
    changedBy: 'demo-admin-1',
    reason: 'Initial approval rate',
    createdAt: '2024-06-01T10:00:00Z',
  },
  {
    id: 'rate-004',
    channelPartnerId: 'cp-demo-001',
    leadRole: 'shop',
    rate: 12.50,
    effectiveFrom: '2024-06-01T10:00:00Z',
    effectiveTo: null,
    expiresAt: '2024-10-15T23:59:59Z',  // Expiring soon for demo
    expiryNotified: false,
    previousRate: null,
    changedBy: 'demo-admin-1',
    reason: 'Initial approval rate',
    createdAt: '2024-06-01T10:00:00Z',
  },
];

const MOCK_CP_LEADS: ChanPLead[] = [
  {
    id: 'lead-001',
    channelPartnerId: 'cp-demo-001',
    leadUserId: 'demo-guardian-1',
    leadName: 'Mock_Rashed Hossain',
    leadRole: 'guardian',
    attributionMethod: 'referral_code',
    referralCodeUsed: 'REF-CP-A1B2C3',
    isActive: true,
    registrationCompletedAt: '2024-06-02T10:00:00Z',
    joinedAt: '2024-06-02T08:00:00Z',
  },
  {
    id: 'lead-002',
    channelPartnerId: 'cp-demo-001',
    leadUserId: 'demo-agency-1',
    leadName: 'Mock_CareFirst Agency',
    leadRole: 'agency',
    attributionMethod: 'cp_created',
    referralCodeUsed: null,
    isActive: true,
    registrationCompletedAt: '2024-06-05T10:00:00Z',
    joinedAt: '2024-06-05T08:00:00Z',
  },
  {
    id: 'lead-003',
    channelPartnerId: 'cp-demo-001',
    leadUserId: 'demo-caregiver-1',
    leadName: 'Mock_Karim Uddin',
    leadRole: 'caregiver',
    attributionMethod: 'referral_code',
    referralCodeUsed: 'REF-CP-A1B2C3',
    isActive: true,
    registrationCompletedAt: '2024-06-10T10:00:00Z',
    joinedAt: '2024-06-10T08:00:00Z',
  },
  {
    id: 'lead-004',
    channelPartnerId: 'cp-demo-001',
    leadUserId: 'demo-shop-1',
    leadName: 'Mock_MediMart Store',
    leadRole: 'shop',
    attributionMethod: 'admin_assignment',
    referralCodeUsed: null,
    isActive: false,
    registrationCompletedAt: '2024-06-15T10:00:00Z',
    joinedAt: '2024-06-15T08:00:00Z',
  },
  {
    id: 'lead-005',
    channelPartnerId: 'cp-demo-001',
    leadUserId: 'cp-created-guardian',
    leadName: 'New Guardian (Pending)',
    leadRole: 'guardian',
    attributionMethod: 'cp_created',
    referralCodeUsed: null,
    isActive: true,
    registrationCompletedAt: null,  // Not yet activated
    joinedAt: '2024-04-20T08:00:00Z',
  },
];

const MOCK_CP_COMMISSIONS: ChanPCommission[] = [
  {
    id: 'comm-001',
    channelPartnerId: 'cp-demo-001',
    leadUserId: 'demo-guardian-1',
    leadName: 'Mock_Rashed Hossain',
    leadRole: 'guardian',
    invoiceId: 'inv-001',
    invoiceAmount: 50000,
    platformCommissionAmount: 1250,
    cpCommissionRate: 15.00,
    cpCommissionAmount: 188,
    status: 'paid',
    walletTransactionId: 'wt-001',
    invoiceGeneratedAt: '2024-06-10T10:00:00Z',
    paymentCollectedAt: '2024-06-15T10:00:00Z',
    creditedAt: '2024-06-15T11:00:00Z',
    reversedAt: null,
    reversalReason: null,
  },
  {
    id: 'comm-002',
    channelPartnerId: 'cp-demo-001',
    leadUserId: 'demo-agency-1',
    leadName: 'Mock_CareFirst Agency',
    leadRole: 'agency',
    invoiceId: 'inv-002',
    invoiceAmount: 100000,
    platformCommissionAmount: 2500,
    cpCommissionRate: 20.00,
    cpCommissionAmount: 500,
    status: 'credited',
    walletTransactionId: 'wt-002',
    invoiceGeneratedAt: '2024-06-12T10:00:00Z',
    paymentCollectedAt: '2024-06-18T10:00:00Z',
    creditedAt: '2024-06-18T11:00:00Z',
    reversedAt: null,
    reversalReason: null,
  },
  {
    id: 'comm-003',
    channelPartnerId: 'cp-demo-001',
    leadUserId: 'demo-caregiver-1',
    leadName: 'Mock_Karim Uddin',
    leadRole: 'caregiver',
    invoiceId: 'inv-003',
    invoiceAmount: 30000,
    platformCommissionAmount: 750,
    cpCommissionRate: 10.00,
    cpCommissionAmount: 75,
    status: 'pending',
    walletTransactionId: null,
    invoiceGeneratedAt: '2024-06-15T10:00:00Z',
    paymentCollectedAt: null,
    creditedAt: null,
    reversedAt: null,
    reversalReason: null,
  },
  {
    id: 'comm-004',
    channelPartnerId: 'cp-demo-001',
    leadUserId: 'demo-guardian-1',
    leadName: 'Mock_Rashed Hossain',
    leadRole: 'guardian',
    invoiceId: 'inv-004',
    invoiceAmount: 75000,
    platformCommissionAmount: 1875,
    cpCommissionRate: 15.00,
    cpCommissionAmount: 281,
    status: 'credited',
    walletTransactionId: 'wt-003',
    invoiceGeneratedAt: '2024-06-18T10:00:00Z',
    paymentCollectedAt: '2024-06-20T10:00:00Z',
    creditedAt: '2024-06-20T11:00:00Z',
    reversedAt: null,
    reversalReason: null,
  },
  {
    id: 'comm-005',
    channelPartnerId: 'cp-demo-001',
    leadUserId: 'demo-shop-1',
    leadName: 'Mock_MediMart Store',
    leadRole: 'shop',
    invoiceId: 'inv-005',
    invoiceAmount: 20000,
    platformCommissionAmount: 500,
    cpCommissionRate: 12.50,
    cpCommissionAmount: 62,
    status: 'reversed',
    walletTransactionId: 'wt-004',
    invoiceGeneratedAt: '2024-06-01T10:00:00Z',
    paymentCollectedAt: '2024-06-05T10:00:00Z',
    creditedAt: '2024-06-05T11:00:00Z',
    reversedAt: '2024-06-08T10:00:00Z',
    reversalReason: 'Invoice disputed and cancelled',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function isDemoUser(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = window.localStorage.getItem('carenet-auth');
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return parsed.id?.startsWith('demo-') || parsed.email?.endsWith('@carenet.demo');
  } catch {
    return false;
  }
}

function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem('carenet-auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.id || null;
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CHANP-FACING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get the current Channel Partner's profile
 * @param userId - Optional: pass user ID directly to avoid localStorage race condition during login
 */
export async function getMyChanPProfile(userId?: string): Promise<ChanPProfile | null> {
  // Mock fallback
  if (!USE_SUPABASE || isDemoUser()) {
    const uid = userId || getCurrentUserId();
    return MOCK_CP_PROFILES.find(p => p.userId === uid) || null;
  }

  // Supabase implementation
  const uid = userId || await currentUserId();
  return sbRead(`cp-profile-${uid}`, async () => {
    const { data, error } = await sbData()
      .from('channel_partners')
      .select('*')
      .eq('user_id', uid)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      status: data.status,
      referralCode: data.referral_code,
      businessName: data.business_name,
      nidNumber: data.nid_number,
      phone: data.phone,
      bankAccount: data.bank_account,
      reapplicationCount: data.reapplication_count,
      rejectionReason: data.rejection_reason,
      approvedAt: data.approved_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as ChanPProfile;
  });
}

/**
 * Get the current Channel Partner's leads
 */
export async function getMyLeads(opts?: { status?: string; role?: string }): Promise<ChanPLead[]> {
  // Mock fallback
  if (!USE_SUPABASE || isDemoUser()) {
    const profile = await getMyChanPProfile();
    if (!profile) return [];
    
    let leads = MOCK_CP_LEADS.filter(l => l.channelPartnerId === profile.id);
    
    if (opts?.status === 'active') {
      leads = leads.filter(l => l.isActive);
    } else if (opts?.status === 'inactive') {
      leads = leads.filter(l => !l.isActive);
    }
    
    if (opts?.role) {
      leads = leads.filter(l => l.leadRole === opts.role);
    }
    
    return leads;
  }

  // Supabase implementation
  const profile = await getMyChanPProfile();
  if (!profile) return [];

  return sbRead(`cp-leads-${profile.id}-${opts?.status || 'all'}-${opts?.role || 'all'}`, async () => {
    let query = sbData()
      .from('channel_partner_leads')
      .select('*')
      .eq('channel_partner_id', profile.id);

    if (opts?.status === 'active') {
      query = query.eq('is_active', true);
    } else if (opts?.status === 'inactive') {
      query = query.eq('is_active', false);
    }

    if (opts?.role) {
      query = query.eq('lead_role', opts.role);
    }

    const { data, error } = await query;
    if (error) throw error;

    const rows = data || [];
    const leadUserIds = Array.from(new Set(rows.map((row: any) => row.lead_user_id).filter(Boolean)));
    const profileMap = new Map<string, string>();

    if (leadUserIds.length > 0) {
      const { data: profiles, error: profileError } = await sbData()
        .from('profiles')
        .select('id, name')
        .in('id', leadUserIds);
      if (profileError) throw profileError;
      for (const profileRow of profiles || []) {
        if (profileRow?.id) {
          profileMap.set(profileRow.id, profileRow.name || 'Unknown');
        }
      }
    }

    return rows.map((row: any) => mapLeadFromDb(row, profileMap.get(row.lead_user_id)));
  });
}

/**
 * Get jobs for a specific lead
 */
export async function getLeadJobs(leadUserId: string): Promise<LeadJob[]> {
  // Mock fallback - return empty array for now
  if (!USE_SUPABASE || isDemoUser()) {
    return [
      {
        placementId: 'cj-demo-001',
        invoiceId: 'inv-001',
        invoiceAmount: 50000,
        invoiceDate: '2024-06-10T10:00:00Z',
        paymentStatus: 'paid',
      },
      {
        placementId: 'cj-demo-002',
        invoiceId: null,
        invoiceAmount: null,
        invoiceDate: null,
        paymentStatus: null,
      },
    ];
  }

  // Supabase implementation - join with care_jobs and invoices
  const { data, error } = await sbData()
    .from('care_jobs')
    .select('id, invoices(id, total_amount, status, created_at)')
    .eq('guardian_id', leadUserId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    placementId: row.id,
    invoiceId: row.invoices?.[0]?.id || null,
    invoiceAmount: row.invoices?.[0]?.total_amount || null,
    invoiceDate: row.invoices?.[0]?.created_at || null,
    paymentStatus: row.invoices?.[0]?.status || null,
  }));
}

/**
 * Create a new lead (proxy registration)
 */
export async function createLead(data: CreateLeadInput): Promise<{ success: boolean; leadUserId?: string; error?: string }> {
  // Validate role
  if (!CP_LEAD_ROLES.includes(data.leadRole)) {
    return { success: false, error: 'Invalid lead role' };
  }

  // Mock fallback
  if (!USE_SUPABASE || isDemoUser()) {
    await new Promise(r => setTimeout(r, 800));
    
    const profile = await getMyChanPProfile();
    if (!profile) {
      return { success: false, error: 'Channel Partner profile not found' };
    }
    if (profile.status !== 'active') {
      return { success: false, error: 'Channel Partner must be active to create leads' };
    }

    // Check for duplicate phone/email
    const existing = MOCK_CP_LEADS.find(l => 
      MOCK_CP_LEADS.some(lead => {
        // In real implementation, check against auth.users
        return false;
      })
    );
    
    const newLeadId = `lead-${Date.now()}`;
    const newUserId = `user-${Date.now()}`;
    
    MOCK_CP_LEADS.push({
      id: newLeadId,
      channelPartnerId: profile.id,
      leadUserId: newUserId,
      leadName: data.name,
      leadRole: data.leadRole,
      attributionMethod: 'cp_created',
      referralCodeUsed: null,
      isActive: true,
      registrationCompletedAt: null,
      joinedAt: new Date().toISOString(),
    });

    await channelPartnerNotifications.notifyCpLeadJoined(profile.userId, data.name);

    return { success: true, leadUserId: newUserId };
  }

  // Supabase implementation
  try {
    const profile = await getMyChanPProfile();
    if (!profile) {
      return { success: false, error: 'Channel Partner profile not found' };
    }
    if (profile.status !== 'active') {
      return { success: false, error: 'Channel Partner must be active to create leads' };
    }

    // 1. Check if phone/email already exists
    const { data: existing } = await sbData()
      .from('profiles')
      .select('id')
      .or(`phone.eq.${data.phone},email.eq.${data.email || ''}`)
      .single();

    if (existing) {
      return { success: false, error: 'Already registered - ask them to use your referral code instead' };
    }

    const { data: result, error: invokeError } = await sb().functions.invoke('create-cp-lead', {
      body: {
        cpId: profile.id,
        leadRole: data.leadRole,
        name: data.name,
        phone: data.phone,
        district: data.district,
        email: data.email || null,
      },
    });

    if (invokeError) {
      return { success: false, error: invokeError.message || 'Create lead function failed' };
    }

    if (!result?.leadUserId) {
      return { success: false, error: 'Create lead function returned no leadUserId' };
    }

    await channelPartnerNotifications.notifyCpLeadJoined(profile.userId, data.name);

    return { success: true, leadUserId: result.leadUserId as string };

  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/**
 * Resend activation link to a lead
 */
export async function resendActivationLink(leadUserId: string): Promise<{ success: boolean; error?: string }> {
  // Mock fallback
  if (!USE_SUPABASE || isDemoUser()) {
    await new Promise(r => setTimeout(r, 600));
    
    const lead = MOCK_CP_LEADS.find(l => l.leadUserId === leadUserId);
    if (!lead) {
      return { success: false, error: 'Lead not found' };
    }
    
    // Check 72-hour window
    const joinedAt = new Date(lead.joinedAt);
    const hoursSince = (Date.now() - joinedAt.getTime()) / (1000 * 60 * 60);
    if (hoursSince > CP_CONFIG.ACTIVATION_LINK_RESEND_WINDOW_HOURS) {
      return { success: false, error: 'Activation link resend window expired (72h). Contact admin.' };
    }

    return { success: true };
  }

  // Supabase implementation - call Edge Function
  const { data: result, error: invokeError } = await sb().functions.invoke('resend-cp-activation', {
    body: { leadUserId },
  });

  if (invokeError) {
    return { success: false, error: invokeError.message || 'Resend activation failed' };
  }

  if (result?.status === 'error') {
    return { success: false, error: result?.message || 'Resend activation failed' };
  }

  return { success: true };
}

/**
 * Get the current Channel Partner's commissions
 */
export async function getMyCommissions(opts?: { status?: string; dateFrom?: string; dateTo?: string }): Promise<ChanPCommission[]> {
  // Mock fallback
  if (!USE_SUPABASE || isDemoUser()) {
    const profile = await getMyChanPProfile();
    if (!profile) return [];

    let commissions = MOCK_CP_COMMISSIONS.filter(c => c.channelPartnerId === profile.id);

    if (opts?.status) {
      commissions = commissions.filter(c => c.status === opts.status);
    }

    if (opts?.dateFrom) {
      commissions = commissions.filter(c => c.invoiceGeneratedAt >= opts.dateFrom!);
    }

    if (opts?.dateTo) {
      commissions = commissions.filter(c => c.invoiceGeneratedAt <= opts.dateTo!);
    }

    return commissions.sort((a, b) => 
      new Date(b.invoiceGeneratedAt).getTime() - new Date(a.invoiceGeneratedAt).getTime()
    );
  }

  // Supabase implementation
  const profile = await getMyChanPProfile();
  if (!profile) return [];

  return sbRead(`cp-commissions-${profile.id}-${opts?.status || 'all'}`, async () => {
    let query = sbData()
      .from('channel_partner_commissions')
      .select('*')
      .eq('channel_partner_id', profile.id);

    if (opts?.status) {
      query = query.eq('status', opts.status);
    }

    if (opts?.dateFrom) {
      query = query.gte('invoice_generated_at', opts.dateFrom);
    }

    if (opts?.dateTo) {
      query = query.lte('invoice_generated_at', opts.dateTo);
    }

    const { data, error } = await query.order('invoice_generated_at', { ascending: false });
    if (error) throw error;

    const rows = data || [];
    const leadUserIds = Array.from(new Set(rows.map((row: any) => row.lead_user_id).filter(Boolean)));
    const profileMap = new Map<string, string>();

    if (leadUserIds.length > 0) {
      const { data: profiles, error: profileError } = await sbData()
        .from('profiles')
        .select('id, name')
        .in('id', leadUserIds);
      if (profileError) throw profileError;
      for (const profileRow of profiles || []) {
        if (profileRow?.id) {
          profileMap.set(profileRow.id, profileRow.name || 'Unknown');
        }
      }
    }

    return rows.map((row: any) => mapCommissionFromDb(row, profileMap.get(row.lead_user_id)));
  });
}

/**
 * Confirm receipt of a payout
 */
export async function confirmPayoutReceipt(commissionId: string): Promise<{ success: boolean; error?: string }> {
  // Mock fallback
  if (!USE_SUPABASE || isDemoUser()) {
    await new Promise(r => setTimeout(r, 500));
    
    const commission = MOCK_CP_COMMISSIONS.find(c => c.id === commissionId);
    if (!commission) {
      return { success: false, error: 'Commission not found' };
    }
    if (commission.status !== 'credited') {
      return { success: false, error: 'Can only confirm receipt for credited commissions' };
    }

    commission.status = 'paid';
    return { success: true };
  }

  // Supabase implementation
  return sbWrite(async () => {
    const { error } = await sbData()
      .from('channel_partner_commissions')
      .update({ status: 'paid' })
      .eq('id', commissionId)
      .eq('status', 'credited'); // Ensure it was in credited state

    if (error) throw error;
    return { success: true };
  });
}

/**
 * Get the current Channel Partner's active rates by role
 */
export async function getMyRates(): Promise<ChanPRateByRole> {
  const rates = await getRateHistory({ activeOnly: true });
  
  const byRole: ChanPRateByRole = {};
  for (const role of CP_LEAD_ROLES) {
    const rate = rates.find(r => r.leadRole === role && !r.effectiveTo);
    if (rate) {
      byRole[role] = rate;
    }
  }
  
  return byRole;
}

/**
 * Get rate history for the current Channel Partner
 */
export async function getRateHistory(opts?: { leadRole?: string; activeOnly?: boolean }): Promise<ChanPRateRecord[]> {
  // Mock fallback
  if (!USE_SUPABASE || isDemoUser()) {
    const profile = await getMyChanPProfile();
    if (!profile) return [];

    let rates = MOCK_CP_RATES.filter(r => r.channelPartnerId === profile.id);

    if (opts?.leadRole) {
      rates = rates.filter(r => r.leadRole === opts.leadRole);
    }

    if (opts?.activeOnly) {
      rates = rates.filter(r => !r.effectiveTo);
    }

    return rates.sort((a, b) => 
      new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime()
    );
  }

  // Supabase implementation
  const profile = await getMyChanPProfile();
  if (!profile) return [];

  return sbRead(`cp-rates-${profile.id}-${opts?.leadRole || 'all'}`, async () => {
    let query = sbData()
      .from('channel_partner_commission_rates')
      .select('*')
      .eq('channel_partner_id', profile.id);

    if (opts?.leadRole) {
      query = query.eq('lead_role', opts.leadRole);
    }

    if (opts?.activeOnly) {
      query = query.is('effective_to', null);
    }

    const { data, error } = await query.order('effective_from', { ascending: false });
    if (error) throw error;

    return (data || []).map(mapRateFromDb);
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN-FACING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Admin: Get list of all Channel Partners
 */
export async function adminGetChanPList(opts?: { status?: string }): Promise<ChanPSummary[]> {
  // Mock fallback
  if (!USE_SUPABASE || isDemoUser()) {
    let profiles = [...MOCK_CP_PROFILES];
    
    if (opts?.status) {
      profiles = profiles.filter(p => p.status === opts.status);
    }

    return profiles.map(p => ({
      id: p.id,
      userId: p.userId,
      name: p.businessName || 'Unnamed',
      referralCode: p.referralCode,
      status: p.status,
      leadCount: MOCK_CP_LEADS.filter(l => l.channelPartnerId === p.id && l.isActive).length,
      hasExpiringRates: MOCK_CP_RATES.some(r => 
        r.channelPartnerId === p.id && 
        !r.effectiveTo && 
        new Date(r.expiresAt) < new Date(Date.now() + CP_CONFIG.RATE_EXPIRY_DASHBOARD_VISIBILITY_DAYS * 24 * 60 * 60 * 1000)
      ),
      totalCommissionPaid: MOCK_CP_COMMISSIONS
        .filter(c => c.channelPartnerId === p.id && c.status === 'paid')
        .reduce((sum, c) => sum + c.cpCommissionAmount, 0),
    }));
  }

  // Supabase implementation with aggregation
  return sbRead(`admin-cp-list-${opts?.status || 'all'}`, async () => {
    let query = sbData()
      .from('channel_partners')
      .select('id,user_id,business_name,referral_code,status')
      .order('created_at', { ascending: false });

    if (opts?.status) {
      query = query.eq('status', opts.status);
    }

    const { data, error } = await query;
    if (error) throw error;

    const rows = data || [];
    const cpIds = rows.map((row: any) => row.id).filter(Boolean);
    const expiringThreshold = new Date(Date.now() + CP_CONFIG.RATE_EXPIRY_DASHBOARD_VISIBILITY_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const expiringRatesByCp = new Map<string, boolean>();
    const totalPaidByCp = new Map<string, number>();

    let rateRows: any[] = [];
    let commissionRows: any[] = [];
    let leadRows: any[] = [];

    if (cpIds.length > 0) {
      const [rateResult, commissionResult, leadCountResult] = await Promise.all([
        sbData()
          .from('channel_partner_commission_rates')
          .select('channel_partner_id,expires_at,effective_to')
          .in('channel_partner_id', cpIds)
          .is('effective_to', null),
        sbData()
          .from('channel_partner_commissions')
          .select('channel_partner_id,cp_commission_amount')
          .in('channel_partner_id', cpIds)
          .eq('status', 'paid'),
        sbData()
          .from('channel_partner_leads')
          .select('channel_partner_id')
          .in('channel_partner_id', cpIds)
          .eq('is_active', true),
      ]);

      if (rateResult.error) throw rateResult.error;
      if (commissionResult.error) throw commissionResult.error;
      if (leadCountResult.error) throw leadCountResult.error;

      rateRows = rateResult.data || [];
      commissionRows = commissionResult.data || [];
      leadRows = leadCountResult.data || [];
    }

    for (const rateRow of rateRows) {
      if (rateRow?.expires_at && rateRow.expires_at < expiringThreshold) {
        expiringRatesByCp.set(rateRow.channel_partner_id, true);
      }
    }

    for (const commissionRow of commissionRows) {
      const current = totalPaidByCp.get(commissionRow.channel_partner_id) || 0;
      totalPaidByCp.set(commissionRow.channel_partner_id, current + Number(commissionRow.cp_commission_amount || 0));
    }

    const leadCounts = new Map<string, number>();
    for (const leadRow of leadRows) {
      if (leadRow?.channel_partner_id) {
        const current = leadCounts.get(leadRow.channel_partner_id) || 0;
        leadCounts.set(leadRow.channel_partner_id, current + 1);
      }
    }

    return rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      name: row.business_name || 'Unnamed',
      referralCode: row.referral_code,
      status: row.status,
      leadCount: leadCounts.get(row.id) || 0,
      hasExpiringRates: expiringRatesByCp.get(row.id) ?? false,
      totalCommissionPaid: totalPaidByCp.get(row.id) || 0,
    }));
  });
}

/**
 * Admin: Get detailed view of a Channel Partner
 */
export async function adminGetChanPDetail(cpId: string): Promise<ChanPDetail | null> {
  // Mock fallback
  if (!USE_SUPABASE || isDemoUser()) {
    const profile = MOCK_CP_PROFILES.find(p => p.id === cpId);
    if (!profile) return null;

    return {
      ...profile,
      leads: MOCK_CP_LEADS.filter(l => l.channelPartnerId === cpId),
      commissions: MOCK_CP_COMMISSIONS.filter(c => c.channelPartnerId === cpId),
      rates: MOCK_CP_RATES.filter(r => r.channelPartnerId === cpId),
      auditTrail: await adminGetChanPAuditTrail(cpId),
    };
  }

  // Supabase implementation
  return sbRead(`admin-cp-detail-${cpId}`, async () => {
    const { data, error } = await sbData()
      .from('channel_partners')
      .select(`
        *,
        leads:channel_partner_leads(*),
        commissions:channel_partner_commissions(*),
        rates:channel_partner_commission_rates(*)
      `)
      .eq('id', cpId)
      .single();

    if (error || !data) return null;

    const leadRows = data.leads || [];
    const commissionRows = data.commissions || [];
    const profileIds = Array.from(
      new Set([
        ...leadRows.map((lead: any) => lead.lead_user_id).filter(Boolean),
        ...commissionRows.map((commission: any) => commission.lead_user_id).filter(Boolean),
      ])
    );

    const profileMap = new Map<string, string>();
    if (profileIds.length > 0) {
      const { data: profileRows, error: profileError } = await sbData()
        .from('profiles')
        .select('id,name')
        .in('id', profileIds);
      if (profileError) throw profileError;
      for (const profileRow of profileRows || []) {
        if (profileRow?.id) {
          profileMap.set(profileRow.id, profileRow.name || '');
        }
      }
    }

    return {
      id: data.id,
      userId: data.user_id,
      status: data.status,
      referralCode: data.referral_code,
      businessName: data.business_name,
      nidNumber: data.nid_number,
      phone: data.phone,
      bankAccount: data.bank_account,
      reapplicationCount: data.reapplication_count,
      rejectionReason: data.rejection_reason,
      rejectedAt: data.rejected_at,
      suspendedReason: data.suspended_reason,
      suspendedAt: data.suspended_at,
      deactivatedAt: data.deactivated_at,
      approvedAt: data.approved_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      leads: leadRows.map((row: any) => mapLeadFromDb(row, profileMap.get(row.lead_user_id))),
      commissions: commissionRows.map((row: any) => mapCommissionFromDb(row, profileMap.get(row.lead_user_id))),
      rates: (data.rates || []).map(mapRateFromDb),
      auditTrail: await adminGetChanPAuditTrail(cpId),
    } as ChanPDetail;
  });
}

/**
 * Admin: Approve a Channel Partner application
 */
export async function adminApproveChanP(
  cpId: string, 
  initialRates: RateInput[]
): Promise<{ success: boolean; error?: string }> {
  // Validate at least one rate
  if (!initialRates || initialRates.length === 0) {
    // Allow but warn - this is handled in UI with modal
  }

  // Mock fallback
  if (!USE_SUPABASE || isDemoUser()) {
    await new Promise(r => setTimeout(r, 800));
    
    const profile = MOCK_CP_PROFILES.find(p => p.id === cpId);
    if (!profile) {
      return { success: false, error: 'Channel Partner not found' };
    }
    if (profile.status !== 'pending_approval') {
      return { success: false, error: 'Can only approve pending applications' };
    }

    profile.status = 'active';
    profile.approvedAt = new Date().toISOString();
    profile.referralCode = 'REF-CP-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    // Create initial rates
    for (const rateInput of initialRates) {
      MOCK_CP_RATES.push({
        id: `rate-${Date.now()}-${rateInput.leadRole}`,
        channelPartnerId: cpId,
        leadRole: rateInput.leadRole,
        rate: rateInput.rate,
        effectiveFrom: new Date().toISOString(),
        effectiveTo: null,
        expiresAt: rateInput.expiresAt,
        expiryNotified: false,
        previousRate: null,
        changedBy: 'demo-admin-1',
        reason: rateInput.reason,
        createdAt: new Date().toISOString(),
      });
    }

    await channelPartnerNotifications.notifyCpApproved(profile.userId);

    return { success: true };
  }

  // Supabase implementation
  return sbWrite(async () => {
    const adminId = await currentUserId();

    // Update status and fetch CP user id
    const { data: updatedProfile, error: updateError } = await sbData()
      .from('channel_partners')
      .update({
        status: 'active',
        approved_at: new Date().toISOString(),
        approved_by: adminId,
      })
      .eq('id', cpId)
      .eq('status', 'pending_approval')
      .select('user_id, business_name')
      .maybeSingle();

    if (updateError) throw updateError;
    if (!updatedProfile) {
      return { success: false, error: 'Can only approve pending applications' };
    }

    // Generate referral code via function
    await sbData().rpc('generate_cp_referral_code', { p_cp_id: cpId });

    // Create initial rates
    for (const rateInput of initialRates) {
      const { error: rateError } = await sbData()
        .from('channel_partner_commission_rates')
        .insert({
          channel_partner_id: cpId,
          lead_role: rateInput.leadRole,
          rate: rateInput.rate,
          expires_at: rateInput.expiresAt,
          changed_by: adminId,
          reason: rateInput.reason,
        });

      if (rateError) throw rateError;
    }

    try {
      await channelPartnerNotifications.notifyCpApproved(updatedProfile.user_id as string);
    } catch (notifyError) {
      console.error('[channelPartnerService] notifyCpApproved failed:', notifyError);
    }

    return { success: true };
  });
}

/**
 * Admin: Reject a Channel Partner application
 */
export async function adminRejectChanP(
  cpId: string, 
  reason: string
): Promise<{ success: boolean; error?: string }> {
  if (!reason || reason.trim().length < 10) {
    return { success: false, error: 'Rejection reason must be at least 10 characters' };
  }

  // Mock fallback
  if (!USE_SUPABASE || isDemoUser()) {
    await new Promise(r => setTimeout(r, 600));
    
    const profile = MOCK_CP_PROFILES.find(p => p.id === cpId);
    if (!profile) {
      return { success: false, error: 'Channel Partner not found' };
    }

    profile.status = 'rejected';
    profile.rejectionReason = reason;
    profile.rejectedAt = new Date().toISOString();

    await channelPartnerNotifications.notifyCpRejected(profile.userId, reason);

    return { success: true };
  }

  // Supabase implementation
  return sbWrite(async () => {
    const adminId = await currentUserId();

    const { data: updatedProfile, error } = await sbData()
      .from('channel_partners')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        rejected_at: new Date().toISOString(),
        rejected_by: adminId,
      })
      .eq('id', cpId)
      .select('user_id, business_name')
      .maybeSingle();

    if (error) throw error;
    if (!updatedProfile) {
      return { success: false, error: 'Channel Partner not found' };
    }

    try {
      await channelPartnerNotifications.notifyCpRejected(updatedProfile.user_id as string, reason);
    } catch (notifyError) {
      console.error('[channelPartnerService] notifyCpRejected failed:', notifyError);
    }

    return { success: true };
  });
}

/**
 * Admin: Suspend a Channel Partner
 */
export async function adminSuspendChanP(
  cpId: string, 
  reason: string
): Promise<{ success: boolean; error?: string }> {
  if (!reason || reason.trim().length < 10) {
    return { success: false, error: 'Suspension reason must be at least 10 characters' };
  }

  // Mock fallback
  if (!USE_SUPABASE || isDemoUser()) {
    await new Promise(r => setTimeout(r, 600));
    
    const profile = MOCK_CP_PROFILES.find(p => p.id === cpId);
    if (!profile) {
      return { success: false, error: 'Channel Partner not found' };
    }

    profile.status = 'suspended';
    profile.suspendedReason = reason;
    profile.suspendedAt = new Date().toISOString();

    await channelPartnerNotifications.notifyCpSuspended(profile.userId, reason);

    return { success: true };
  }

  // Supabase implementation
  return sbWrite(async () => {
    const adminId = await currentUserId();

    const { data: updatedProfile, error } = await sbData()
      .from('channel_partners')
      .update({
        status: 'suspended',
        suspended_reason: reason,
        suspended_at: new Date().toISOString(),
        suspended_by: adminId,
      })
      .eq('id', cpId)
      .select('user_id, business_name')
      .maybeSingle();

    if (error) throw error;
    if (!updatedProfile) {
      return { success: false, error: 'Channel Partner not found' };
    }

    try {
      await channelPartnerNotifications.notifyCpSuspended(updatedProfile.user_id as string, reason);
    } catch (notifyError) {
      console.error('[channelPartnerService] notifyCpSuspended failed:', notifyError);
    }

    return { success: true };
  });
}

/**
 * Admin: Deactivate a Channel Partner
 */
export async function adminDeactivateChanP(
  cpId: string, 
  reason: string
): Promise<{ success: boolean; error?: string }> {
  if (!reason || reason.trim().length < 10) {
    return { success: false, error: 'Deactivation reason must be at least 10 characters' };
  }

  // Mock fallback
  if (!USE_SUPABASE || isDemoUser()) {
    await new Promise(r => setTimeout(r, 600));
    
    const profile = MOCK_CP_PROFILES.find(p => p.id === cpId);
    if (!profile) {
      return { success: false, error: 'Channel Partner not found' };
    }

    profile.status = 'deactivated';
    profile.deactivatedAt = new Date().toISOString();

    await channelPartnerNotifications.notifyCpDeactivated(profile.userId, reason);

    return { success: true };
  }

  // Supabase implementation
  return sbWrite(async () => {
    const adminId = await currentUserId();

    const { data: updatedProfile, error } = await sbData()
      .from('channel_partners')
      .update({
        status: 'deactivated',
        deactivated_at: new Date().toISOString(),
        deactivated_by: adminId,
      })
      .eq('id', cpId)
      .select('user_id, business_name')
      .maybeSingle();

    if (error) throw error;
    if (!updatedProfile) {
      return { success: false, error: 'Channel Partner not found' };
    }

    try {
      await channelPartnerNotifications.notifyCpDeactivated(updatedProfile.user_id as string, reason);
    } catch (notifyError) {
      console.error('[channelPartnerService] notifyCpDeactivated failed:', notifyError);
    }

    return { success: true };
  });
}

/**
 * Admin: Set or update a Channel Partner's commission rate
 */
export async function adminSetChanPRate(
  cpId: string,
  leadRole: CpLeadRole,
  rate: number,
  expiresAt: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  // Validate
  if (!CP_LEAD_ROLES.includes(leadRole)) {
    return { success: false, error: 'Invalid lead role' };
  }
  if (rate < 0 || rate > 100) {
    return { success: false, error: 'Rate must be between 0 and 100' };
  }

  // Mock fallback
  if (!USE_SUPABASE || isDemoUser()) {
    await new Promise(r => setTimeout(r, 600));

    // Find existing active rate
    const existingRate = MOCK_CP_RATES.find(r => 
      r.channelPartnerId === cpId && 
      r.leadRole === leadRole && 
      !r.effectiveTo
    );

    // Close existing rate
    if (existingRate) {
      existingRate.effectiveTo = new Date().toISOString();
    }

    // Create new rate
    MOCK_CP_RATES.push({
      id: `rate-${Date.now()}`,
      channelPartnerId: cpId,
      leadRole,
      rate,
      effectiveFrom: new Date().toISOString(),
      effectiveTo: null,
      expiresAt,
      expiryNotified: false,
      previousRate: existingRate?.rate || null,
      changedBy: 'demo-admin-1',
      reason,
      createdAt: new Date().toISOString(),
    });

    return { success: true };
  }

  // Supabase implementation
  return sbWrite(async () => {
    const adminId = await currentUserId();

    // Close previous rate
    await sbData().rpc('close_previous_rate', {
      p_cp_id: cpId,
      p_lead_role: leadRole,
    });

    // Insert new rate
    const { error } = await sbData()
      .from('channel_partner_commission_rates')
      .insert({
        channel_partner_id: cpId,
        lead_role: leadRole,
        rate,
        expires_at: expiresAt,
        changed_by: adminId,
        reason,
      });

    if (error) throw error;
    return { success: true };
  });
}

/**
 * Admin: Renew an existing rate's expiry
 */
export async function adminRenewChanPRate(
  rateId: string,
  newExpiresAt: string
): Promise<{ success: boolean; error?: string }> {
  // Mock fallback
  if (!USE_SUPABASE || isDemoUser()) {
    await new Promise(r => setTimeout(r, 500));

    const rate = MOCK_CP_RATES.find(r => r.id === rateId);
    if (!rate) {
      return { success: false, error: 'Rate not found' };
    }

    rate.expiresAt = newExpiresAt;
    rate.expiryNotified = false; // Reset for next cycle

    return { success: true };
  }

  // Supabase implementation
  return sbWrite(async () => {
    const { error } = await sbData()
      .from('channel_partner_commission_rates')
      .update({
        expires_at: newExpiresAt,
        expiry_notified: false,
      })
      .eq('id', rateId);

    if (error) throw error;
    return { success: true };
  });
}

/**
 * Admin: Manually assign a lead to a Channel Partner
 */
export async function adminAssignLead(
  cpId: string,
  leadUserId: string
): Promise<{ success: boolean; error?: string }> {
  // Mock fallback
  if (!USE_SUPABASE || isDemoUser()) {
    await new Promise(r => setTimeout(r, 600));

    // Check if lead already attributed
    if (MOCK_CP_LEADS.some(l => l.leadUserId === leadUserId)) {
      return { success: false, error: 'Lead already attributed to another Channel Partner' };
    }

    // Get lead info (mock)
    MOCK_CP_LEADS.push({
      id: `lead-${Date.now()}`,
      channelPartnerId: cpId,
      leadUserId,
      leadName: 'Assigned Lead',
      leadRole: 'guardian',
      attributionMethod: 'admin_assignment',
      referralCodeUsed: null,
      isActive: true,
      registrationCompletedAt: new Date().toISOString(),
      joinedAt: new Date().toISOString(),
    });

    const profile = MOCK_CP_PROFILES.find((p) => p.id === cpId);
    if (profile) {
      await channelPartnerNotifications.notifyCpLeadJoined(profile.userId, 'Assigned Lead');
    }

    return { success: true };
  }

  // Supabase implementation
  return sbWrite(async () => {
    const adminId = await currentUserId();

    // Check if lead already attributed
    const { data: existing } = await sbData()
      .from('channel_partner_leads')
      .select('id')
      .eq('lead_user_id', leadUserId)
      .single();

    if (existing) {
      return { success: false, error: 'Lead already attributed' };
    }

    // Get lead's role and name from profiles
    const { data: leadProfile } = await sbData()
      .from('profiles')
      .select('role, name')
      .eq('id', leadUserId)
      .single();

    if (!leadProfile) {
      return { success: false, error: 'Lead profile not found' };
    }

    const { error } = await sbData()
      .from('channel_partner_leads')
      .insert({
        channel_partner_id: cpId,
        lead_user_id: leadUserId,
        lead_role: leadProfile.role,
        attribution_method: 'admin_assignment',
        assigned_by: adminId,
      });

    if (error) throw error;

    const { data: cpRow } = await sbData()
      .from('channel_partners')
      .select('user_id')
      .eq('id', cpId)
      .maybeSingle();

    if (!cpRow || !cpRow.user_id) {
      return { success: false, error: 'Channel Partner not found' };
    }

    await channelPartnerNotifications.notifyCpLeadJoined(
      cpRow.user_id,
      leadProfile?.name || 'Assigned lead',
    );

    return { success: true };
  });
}

/**
 * Admin: Reverse a commission
 */
export async function adminReverseCommission(
  commissionId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  if (!reason || reason.trim().length < 10) {
    return { success: false, error: 'Reversal reason must be at least 10 characters' };
  }

  // Mock fallback
  if (!USE_SUPABASE || isDemoUser()) {
    await new Promise(r => setTimeout(r, 600));

    const commission = MOCK_CP_COMMISSIONS.find(c => c.id === commissionId);
    if (!commission) {
      return { success: false, error: 'Commission not found' };
    }
    if (commission.status === 'reversed') {
      return { success: false, error: 'Commission already reversed' };
    }

    commission.status = 'reversed';
    commission.reversalReason = reason;
    commission.reversedAt = new Date().toISOString();

    await channelPartnerNotifications.notifyAdminCommissionReversed(
      'mock-admin',
      'Mock Channel Partner',
      commission.invoiceId,
    );

    return { success: true };
  }

  // Supabase implementation
  return sbWrite(async () => {
    const adminId = await currentUserId();

    // Get commission to find invoice
    const { data: commission } = await sbData()
      .from('channel_partner_commissions')
      .select('invoice_id')
      .eq('id', commissionId)
      .single();

    if (!commission) {
      return { success: false, error: 'Commission not found' };
    }

    const { data: cp } = await sbData()
      .from('channel_partners')
      .select('user_id, business_name')
      .eq('id', commission.channel_partner_id)
      .maybeSingle();

    // Call reverse function
    await sbData().rpc('reverse_cp_commission', {
      p_invoice_id: commission.invoice_id,
      p_reason: reason,
    });

    if (cp?.user_id) {
      try {
        await channelPartnerNotifications.notifyAdminCommissionReversed(
          adminId,
          cp.business_name || 'Channel Partner',
          commission.invoice_id,
        );
      } catch (notifyError) {
        console.error('[channelPartnerService] notifyAdminCommissionReversed failed:', notifyError);
      }
    }

    return { success: true };
  });
}

/**
 * Admin: Get expiring Channel Partner rates for dashboard widget
 * Returns rates expiring within RATE_EXPIRY_DASHBOARD_VISIBILITY_DAYS
 */
export async function adminGetExpiringChanPRates(): Promise<Array<{
  cpId: string;
  cpName: string;
  cpUserId: string;
  rateId: string;
  leadRole: string;
  rate: number;
  expiresAt: string;
  daysUntilExpiry: number;
}>> {
  // Mock fallback
  if (!USE_SUPABASE || isDemoUser()) {
    await new Promise(r => setTimeout(r, 300));
    const now = new Date();
    const threshold = new Date(now.getTime() + CP_CONFIG.RATE_EXPIRY_DASHBOARD_VISIBILITY_DAYS * 24 * 60 * 60 * 1000);

    return MOCK_CP_RATES
      .filter(r => !r.effectiveTo && new Date(r.expiresAt) <= threshold)
      .map(r => {
        const cp = MOCK_CP_PROFILES.find(p => p.id === r.channelPartnerId);
        const daysUntilExpiry = Math.ceil((new Date(r.expiresAt).getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        return {
          cpId: r.channelPartnerId,
          cpName: cp?.businessName || 'Unknown',
          cpUserId: cp?.userId || '',
          rateId: r.id,
          leadRole: r.leadRole,
          rate: r.rate,
          expiresAt: r.expiresAt,
          daysUntilExpiry,
        };
      });
  }

  // Supabase implementation
  return sbRead(async () => {
    const now = new Date().toISOString();
    const threshold = new Date(Date.now() + CP_CONFIG.RATE_EXPIRY_DASHBOARD_VISIBILITY_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await sbData()
      .from('channel_partner_commission_rates')
      .select(`
        id,
        channel_partner_id,
        lead_role,
        rate,
        expires_at,
        channel_partners!inner (
          id,
          user_id,
          business_name
        )
      `)
      .is('effective_to', null)
      .lte('expires_at', threshold)
      .gte('expires_at', now)
      .order('expires_at', { ascending: true });

    if (error) throw error;

    return (data || []).map((row: any) => {
      const expiresAt = new Date(row.expires_at);
      const daysUntilExpiry = Math.ceil((expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
      return {
        cpId: row.channel_partner_id,
        cpName: row.channel_partners.business_name || 'Unknown',
        cpUserId: row.channel_partners.user_id,
        rateId: row.id,
        leadRole: row.lead_role,
        rate: row.rate,
        expiresAt: row.expires_at,
        daysUntilExpiry,
      };
    });
  });
}

/**
 * Admin: Get commission summary reports for dashboard widget
 * Returns aggregated commission data by Channel Partner and time period
 */
export async function adminGetCommissionReports(opts?: {
  dateFrom?: string;
  dateTo?: string;
  cpId?: string;
}): Promise<{
  totalCommissions: number;
  totalCredited: number;
  totalPending: number;
  totalReversed: number;
  byChannelPartner: Array<{
    cpId: string;
    cpName: string;
    totalCommission: number;
    creditedCount: number;
    pendingCount: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    amount: number;
  }>;
}> {
  // Mock fallback
  if (!USE_SUPABASE || isDemoUser()) {
    await new Promise(r => setTimeout(r, 400));

    const filtered = opts?.cpId
      ? MOCK_CP_COMMISSIONS.filter(c => c.channelPartnerId === opts.cpId)
      : MOCK_CP_COMMISSIONS;

    const totalCommissions = filtered.reduce((sum, c) => sum + c.cpCommissionAmount, 0);
    const totalCredited = filtered.filter(c => c.status === 'credited').reduce((sum, c) => sum + c.cpCommissionAmount, 0);
    const totalPending = filtered.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.cpCommissionAmount, 0);
    const totalReversed = filtered.filter(c => c.status === 'reversed').reduce((sum, c) => sum + c.cpCommissionAmount, 0);

    const byCpMap = new Map<string, { cpName: string; total: number; credited: number; pending: number }>();
    for (const c of filtered) {
      const cp = MOCK_CP_PROFILES.find(p => p.id === c.channelPartnerId);
      const cpName = cp?.businessName || 'Unknown';
      const existing = byCpMap.get(c.channelPartnerId) || { cpName, total: 0, credited: 0, pending: 0 };
      existing.total += c.cpCommissionAmount;
      if (c.status === 'credited') existing.credited += c.cpCommissionAmount;
      if (c.status === 'pending') existing.pending += c.cpCommissionAmount;
      byCpMap.set(c.channelPartnerId, existing);
    }

    const byChannelPartner = Array.from(byCpMap.entries()).map(([cpId, data]) => ({
      cpId,
      cpName: data.cpName,
      totalCommission: data.total,
      creditedCount: data.credited,
      pendingCount: data.pending,
    }));

    // Generate mock monthly trend (last 6 months)
    const monthlyTrend: Array<{ month: string; amount: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const month = d.toISOString().slice(0, 7);
      monthlyTrend.push({
        month,
        amount: Math.floor(Math.random() * 10000) + 5000,
      });
    }

    return {
      totalCommissions,
      totalCredited,
      totalPending,
      totalReversed,
      byChannelPartner,
      monthlyTrend,
    };
  }

  // Supabase implementation
  return sbRead(async () => {
    let query = sbData()
      .from('channel_partner_commissions')
      .select(`
        cp_commission_amount,
        status,
        credited_at,
        channel_partner_id,
        channel_partners!inner (
          id,
          business_name
        )
      `);

    if (opts?.cpId) {
      query = query.eq('channel_partner_id', opts.cpId);
    }

    if (opts?.dateFrom) {
      query = query.gte('invoice_generated_at', opts.dateFrom);
    }

    if (opts?.dateTo) {
      query = query.lte('invoice_generated_at', opts.dateTo);
    }

    const { data, error } = await query;

    if (error) throw error;

    const rows = data || [];
    const totalCommissions = rows.reduce((sum: number, r: any) => sum + (r.cp_commission_amount || 0), 0);
    const totalCredited = rows.filter((r: any) => r.status === 'credited').reduce((sum: number, r: any) => sum + (r.cp_commission_amount || 0), 0);
    const totalPending = rows.filter((r: any) => r.status === 'pending').reduce((sum: number, r: any) => sum + (r.cp_commission_amount || 0), 0);
    const totalReversed = rows.filter((r: any) => r.status === 'reversed').reduce((sum: number, r: any) => sum + (r.cp_commission_amount || 0), 0);

    const byCpMap = new Map<string, { cpName: string; total: number; credited: number; pending: number }>();
    for (const r of rows) {
      const cpId = r.channel_partner_id;
      const cpName = r.channel_partners?.business_name || 'Unknown';
      const existing = byCpMap.get(cpId) || { cpName, total: 0, credited: 0, pending: 0 };
      existing.total += r.cp_commission_amount || 0;
      if (r.status === 'credited') existing.credited += r.cp_commission_amount || 0;
      if (r.status === 'pending') existing.pending += r.cp_commission_amount || 0;
      byCpMap.set(cpId, existing);
    }

    const byChannelPartner = Array.from(byCpMap.entries()).map(([cpId, data]) => ({
      cpId,
      cpName: data.cpName,
      totalCommission: data.total,
      creditedCount: data.credited,
      pendingCount: data.pending,
    }));

    // Generate monthly trend from actual data
    const monthlyMap = new Map<string, number>();
    for (const r of rows) {
      if (r.credited_at) {
        const month = r.credited_at.slice(0, 7);
        const existing = monthlyMap.get(month) || 0;
        monthlyMap.set(month, existing + (r.cp_commission_amount || 0));
      }
    }

    const monthlyTrend = Array.from(monthlyMap.entries())
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Last 6 months

    return {
      totalCommissions,
      totalCredited,
      totalPending,
      totalReversed,
      byChannelPartner,
      monthlyTrend,
    };
  });
}

/**
 * Admin: Get audit trail for a Channel Partner
 *
 * @param cpId - The channel_partners.id (table PK), NOT the auth.users.id
 *
 * NOTE: The filter searches uid (actor), metadata.cp_id, and metadata.cp_user_id
 * to ensure all CP-related audit events are found, including system-generated
 * events (SYS_TRIG, SYS_CRON) that don't have the CP as the uid.
 */
export async function adminGetChanPAuditTrail(
  cpId: string,
  opts?: { dateFrom?: string; dateTo?: string; action?: string }
): Promise<AuditLogEntry[]> {
  // Mock fallback - dynamically import to avoid bundle bloat in production
  if (!USE_SUPABASE || isDemoUser()) {
    const { MOCK_AUDIT_LOGS } = await import('@/backend/api/mock/adminMocks');
    // Filter for CP actions related to this cpId
    // Checks uid (actor), metadata.cp_id (target), or metadata.cp_user_id (alternate)
    let logs = MOCK_AUDIT_LOGS.logs.filter(
      (log) => log.action?.startsWith('CP_') && 
        (log.uid === cpId || 
         log.metadata?.cp_id === cpId ||
         log.metadata?.cp_user_id === cpId)
    );
    if (opts?.action) {
      logs = logs.filter((log) => log.action === opts.action);
    }
    if (opts?.dateFrom) {
      logs = logs.filter((log) => log.time >= opts.dateFrom!);
    }
    if (opts?.dateTo) {
      logs = logs.filter((log) => log.time <= opts.dateTo!);
    }
    return logs.slice(0, 50); // Limit to 50 entries
  }

  // Supabase implementation
  // Search uid (actor), metadata.cp_id (target), and metadata.cp_user_id (alternate)
  // This must match the mock filter logic to ensure consistent behavior
  let query = sbData()
    .from('audit_logs')
    .select('*')
    .or(`uid.eq.${cpId},metadata->>cp_id.eq.${cpId},metadata->>cp_user_id.eq.${cpId}`)
    .ilike('action', 'CP_%');

  if (opts?.dateFrom) {
    query = query.gte('time', opts.dateFrom);
  }
  if (opts?.dateTo) {
    query = query.lte('time', opts.dateTo);
  }
  if (opts?.action) {
    query = query.eq('action', opts.action);
  }

  const { data, error } = await query.order('time', { ascending: false });
  if (error) throw error;

  return (data || []).map((row: any) => ({
    time: row.time,
    action: row.action,
    uid: row.uid,
    ip: row.ip,
    severity: row.severity,
    metadata: row.metadata,
  }));
}

// ═══════════════════════════════════════════════════════════════════════════
// DATABASE MAPPING HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function mapLeadFromDb(row: any, leadName?: string): ChanPLead {
  return {
    id: row.id,
    channelPartnerId: row.channel_partner_id,
    leadUserId: row.lead_user_id,
    leadName: row.lead_name || leadName || 'Unknown',
    leadRole: row.lead_role,
    attributionMethod: row.attribution_method,
    referralCodeUsed: row.referral_code_used,
    isActive: row.is_active,
    registrationCompletedAt: row.registration_completed_at,
    joinedAt: row.joined_at,
  };
}

function mapCommissionFromDb(row: any, leadName?: string): ChanPCommission {
  return {
    id: row.id,
    channelPartnerId: row.channel_partner_id,
    leadUserId: row.lead_user_id,
    leadName: row.lead_name || leadName || 'Unknown',
    leadRole: row.lead_role,
    invoiceId: row.invoice_id,
    invoiceAmount: row.invoice_amount,
    platformCommissionAmount: row.platform_commission_amount,
    cpCommissionRate: row.cp_commission_rate,
    cpCommissionAmount: row.cp_commission_amount,
    status: row.status,
    walletTransactionId: row.wallet_transaction_id,
    invoiceGeneratedAt: row.invoice_generated_at,
    paymentCollectedAt: row.payment_collected_at,
    creditedAt: row.credited_at,
    reversedAt: row.reversed_at,
    reversalReason: row.reversal_reason,
  };
}

function mapRateFromDb(row: any): ChanPRateRecord {
  return {
    id: row.id,
    channelPartnerId: row.channel_partner_id,
    leadRole: row.lead_role,
    rate: row.rate,
    effectiveFrom: row.effective_from,
    effectiveTo: row.effective_to,
    expiresAt: row.expires_at,
    expiryNotified: row.expiry_notified,
    previousRate: row.previous_rate,
    changedBy: row.changed_by,
    reason: row.reason,
    createdAt: row.created_at,
  };
}
