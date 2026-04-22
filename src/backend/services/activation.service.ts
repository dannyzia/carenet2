import { ActivationStatus, Role, User } from "@/frontend/auth/types";
import { USE_SUPABASE, currentUserId, sb, useInAppMockDataset } from "./_sb";
import { mockSubmitProfileForReview, mockReopenForEditing, mockApproveUser, mockRejectUser, mockGetMyActivationStatus } from "@/frontend/auth/mockAuth";

export interface RoleActivationItem {
  id: string;
  name: string;
  email: string;
  role: Role;
  district?: string;
  phone?: string;
  registeredAt: string;
  submittedAt?: string;
  activationStatus: ActivationStatus;
  activationNote?: string;
  documents: { name: string; category: string; status: string }[];
}

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

export const activationService = {
  async submitForReview(profileId: string): Promise<void> {
    if (USE_SUPABASE) {
      const { error } = await sb().from('profiles')
        .update({ activation_status: 'pending_approval' })
        .eq('id', profileId)
        .eq('activation_status', 'profile_incomplete');
      if (error) throw error;
      return;
    }
    
    if (useInAppMockDataset()) {
      try {
        const raw = localStorage.getItem("carenet-mock-registry");
        if (raw) {
          const parsed = JSON.parse(raw);
          const users = parsed.users || {};
          for (const email of Object.keys(users)) {
            if (users[email].id === profileId) {
              await mockSubmitProfileForReview(profileId);
              return;
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  },

  async reopenForEditing(profileId: string): Promise<void> {
    if (USE_SUPABASE) {
      const { error } = await sb().from('profiles')
        .update({ activation_status: 'profile_incomplete', activation_note: null })
        .eq('id', profileId)
        .eq('activation_status', 'rejected');
      if (error) throw error;
      return;
    }

    if (useInAppMockDataset()) {
      try {
        const raw = localStorage.getItem("carenet-mock-registry");
        if (raw) {
          const parsed = JSON.parse(raw);
          const users = parsed.users || {};
          for (const email of Object.keys(users)) {
            if (users[email].id === profileId) {
              await mockReopenForEditing(profileId);
              return;
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  },

  async getPendingActivations(allowedRoles?: Role[]): Promise<RoleActivationItem[]> {
    if (USE_SUPABASE) {
      let q = sb().from('profiles')
        .select('id, name, email, role, phone, district, created_at, activation_status, activation_note')
        .eq('activation_status', 'pending_approval')
        .order('created_at', { ascending: true });
      
      if (allowedRoles && allowedRoles.length > 0) {
        q = q.in('role', allowedRoles);
      }
      
      const { data, error } = await q;
      if (error) throw error;
      
      return (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role as Role,
        district: row.district,
        phone: row.phone,
        registeredAt: row.created_at,
        activationStatus: row.activation_status as ActivationStatus,
        activationNote: row.activation_note,
        documents: [], 
      }));
    }

    if (useInAppMockDataset()) {
      await delay(500);
      try {
        const raw = localStorage.getItem("carenet-mock-registry");
        if (raw) {
          const parsed = JSON.parse(raw);
          const users = parsed.users || {};
          const pending: RoleActivationItem[] = [];
          for (const email of Object.keys(users)) {
            const user = users[email] as User;
            if (user.activationStatus === 'pending_approval' && (!allowedRoles || allowedRoles.includes(user.activeRole))) {
              pending.push({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.activeRole,
                district: user.district,
                phone: user.phone,
                registeredAt: user.createdAt,
                activationStatus: user.activationStatus,
                documents: [],
              });
            }
          }
          return pending;
        }
      } catch (e) {
        console.error(e);
      }
    }
    
    return [];
  },

  async approveActivation(profileId: string, reviewerName: string, note?: string): Promise<void> {
    if (USE_SUPABASE) {
      const { error: updateError } = await sb().from('profiles')
        .update({ activation_status: 'approved', activation_note: null })
        .eq('id', profileId);
      if (updateError) throw updateError;

      const reviewerId = await currentUserId();
      await sb().from('role_activation_reviews').insert({
        profile_id: profileId,
        reviewer_id: reviewerId,
        reviewer_name: reviewerName,
        decision: 'approved',
        note: note ?? null,
      });

      // Write in-app notification
      sb().functions.invoke('push-notification', {
        body: {
          type: 'activation_approved',
          title_en: 'Account Approved',
          title_bn: 'অ্যাকাউন্ট অনুমোদিত হয়েছে',
          message_en: 'Your account has been approved. Welcome to CareNet!',
          message_bn: 'আপনার অ্যাকাউন্ট অনুমোদিত হয়েছে। CareNet-এ স্বাগতম!',
          receiver_id: profileId,
          action_url: null,
        },
      }).catch(e => console.error("Notification invoke failed:", e));

      return;
    }

    if (useInAppMockDataset()) {
      try {
        const raw = localStorage.getItem("carenet-mock-registry");
        if (raw) {
          const parsed = JSON.parse(raw);
          const users = parsed.users || {};
          for (const email of Object.keys(users)) {
            if (users[email].id === profileId) {
              await mockApproveUser(profileId, reviewerName, note);
              return;
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  },

  async rejectActivation(profileId: string, reviewerName: string, note: string): Promise<void> {
    if (USE_SUPABASE) {
      const { error: updateError } = await sb().from('profiles')
        .update({ activation_status: 'rejected', activation_note: note })
        .eq('id', profileId);
      if (updateError) throw updateError;

      const reviewerId = await currentUserId();
      await sb().from('role_activation_reviews').insert({
        profile_id: profileId,
        reviewer_id: reviewerId,
        reviewer_name: reviewerName,
        decision: 'rejected',
        note: note,
      });

      sb().functions.invoke('push-notification', {
        body: {
          type: 'activation_rejected',
          title_en: 'Account Not Approved',
          title_bn: 'অ্যাকাউন্ট অনুমোদিত হয়নি',
          message_en: `Your account was not approved. Reason: ${note}`,
          message_bn: `আপনার অ্যাকাউন্ট অনুমোদিত হয়নি। কারণ: ${note}`,
          receiver_id: profileId,
          action_url: null,
        },
      }).catch(e => console.error("Notification invoke failed:", e));

      return;
    }

    if (useInAppMockDataset()) {
      try {
        const raw = localStorage.getItem("carenet-mock-registry");
        if (raw) {
          const parsed = JSON.parse(raw);
          const users = parsed.users || {};
          for (const email of Object.keys(users)) {
            if (users[email].id === profileId) {
              await mockRejectUser(profileId, reviewerName, note);
              return;
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  },

  async getMyActivationStatus(): Promise<{ activationStatus: ActivationStatus; activationNote?: string } | null> {
    if (USE_SUPABASE) {
      const userId = await currentUserId();
      const { data, error } = await sb().from('profiles')
        .select('activation_status, activation_note')
        .eq('id', userId)
        .single();

      if (error) {
        if ((error as any).code === 'PGRST116') return null; // No profile mapping
        throw error;
      }
      return {
        activationStatus: data.activation_status as ActivationStatus,
        activationNote: data.activation_note,
      };
    }

    if (useInAppMockDataset()) {
      const userId = await currentUserId();
      return mockGetMyActivationStatus(userId);
    }

    return null;
  },

  async getReviewHistory(profileId: string): Promise<Array<{
    reviewerName: string;
    decision: 'approved' | 'rejected';
    note?: string;
    createdAt: string;
  }>> {
    if (USE_SUPABASE) {
      const { data, error } = await sb().from('role_activation_reviews')
        .select('reviewer_name, decision, note, created_at')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((row: any) => ({
        reviewerName: row.reviewer_name || 'Unknown',
        decision: row.decision,
        note: row.note,
        createdAt: row.created_at,
      }));
    }

    if (useInAppMockDataset()) {
      try {
        const raw = localStorage.getItem("carenet-mock-registry");
        if (raw) {
          const parsed = JSON.parse(raw);
          const reviews = parsed.reviews || {};
          const profileReviews = reviews[profileId] || [];
          return profileReviews.map((r: any) => ({
            reviewerName: r.reviewerName || 'Unknown',
            decision: r.decision,
            note: r.note,
            createdAt: r.createdAt,
          }));
        }
      } catch (e) {
        console.error(e);
      }
      return [];
    }

    return [];
  }
};
