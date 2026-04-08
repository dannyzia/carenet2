# Dead Controls Mapping

## Fixed in this pass

| Role | File | Control | Resolution |
|---|---|---|---|
| Agency | `src/frontend/pages/agency/AgencyCaregiversPage.tsx` | Add Caregiver | Link to `/agency/hiring` |
| Agency | `src/frontend/pages/agency/AgencyCaregiversPage.tsx` | Profile | Link to `/agency/caregivers` |
| Agency | `src/frontend/pages/agency/AgencyCaregiversPage.tsx` | Assign Job | Link to `/agency/job-management` |
| Agency | `src/frontend/pages/agency/AgencyClientsPage.tsx` | Add Client | Link to `/agency/client-intake` |
| Agency | `src/frontend/pages/agency/AgencyClientsPage.tsx` | View Details | Link to `/agency/clients` |
| Agency | `src/frontend/pages/agency/AgencyClientsPage.tsx` | Assign Caregiver | Link to `/agency/job-management` |
| Agency | `src/frontend/pages/agency/AgencyPaymentsPage.tsx` | Export | CSV export action |
| Agency | `src/frontend/pages/agency/AgencyJobManagementPage.tsx` | Create Job | Link to `/agency/requirements-inbox` |
| Agency | `src/frontend/pages/agency/AgencyRequirementsInboxPage.tsx` | Message | Link to `/agency/messages?requirement=:id` |
| Caregiver | `src/frontend/pages/caregiver/CaregiverEarningsPage.tsx` | Export | CSV export action |
| Caregiver | `src/frontend/pages/caregiver/CaregiverEarningsPage.tsx` | Withdraw Now | Navigate to `/wallet?role=caregiver` |
| Caregiver | `src/frontend/pages/caregiver/CaregiverEarningsPage.tsx` | View all | Link to `/wallet?role=caregiver` |
| Guardian | `src/frontend/pages/guardian/GuardianPaymentsPage.tsx` | Add Funds | Link to `/wallet?role=guardian` |
| Guardian | `src/frontend/pages/guardian/GuardianPaymentsPage.tsx` | Export | CSV export action |
| Patient | `src/frontend/pages/patient/PatientMessagesPage.tsx` | Emergency phone button | `tel:999` anchor |
| Admin | `src/frontend/pages/admin/AdminUsersPage.tsx` | Export | CSV export action |
| Admin | `src/frontend/pages/admin/AdminUsersPage.tsx` | Add User | Open invite modal |
| Shop | `src/frontend/pages/shop/ShopProductsPage.tsx` | Add Product | Link to `/shop/inventory` |
| Moderator | `src/frontend/pages/moderator/ModeratorReviewsPage.tsx` | View Full | Link to `/moderator/queue-detail/:id` |
| Moderator | `src/frontend/pages/moderator/ModeratorReviewsPage.tsx` | Escalate | Link to `/moderator/escalations` |
| Moderator | `src/frontend/pages/moderator/ModeratorReviewsPage.tsx` | Approve / Remove | Link to `/moderator/sanctions` |

## Decision-needed controls (not changed in this pass)

These controls require product decisions because they imply state-changing workflows, moderation outcomes, or editor flows not yet implemented in the current pages.

- Agency
  - `AgencySettingsPage.tsx` service/compliance action buttons.
  - `AgencyRequirementReviewPage.tsx` "Send Proposal" and "Decline" without API wiring.
  - `ShiftMonitoringPage.tsx` row-level intervention buttons.
- Caregiver
  - `CaregiverShiftPlannerPage.tsx` planning mutators.
  - `CaregiverPrescriptionPage.tsx` medical action controls.
  - `CaregiverCareNotesPage.tsx` compose/send controls.
- Guardian
  - `GuardianPlacementDetailPage.tsx` action set (requires placement workflow decisions).
  - `GuardianSchedulePage.tsx` action set (reschedule/cancel intent unclear).
- Patient
  - `EmergencySOSPage.tsx` escalation workflow button.
  - `PatientDocumentUploadPage.tsx` attachment/upload action wiring.
- Admin
  - `AdminAgencyApprovalsPage.tsx` approval/reject/escalation buttons.
  - `AdminVerificationsPage.tsx` verification state mutation buttons.
- Moderator
  - `ModeratorDashboardPage.tsx` action buttons tied to review queue status updates.
  - `ModeratorEscalationsPage.tsx` triage buttons.
- Shop
  - `ShopOrdersPage.tsx` fulfillment mutation buttons.
  - `ShopInventoryPage.tsx` stock mutation controls.

## Current audit totals

- Audit command: `node scripts/dead-control-audit.mjs`
- Current output: `deadButtons=139`, `deadLinks=0`
