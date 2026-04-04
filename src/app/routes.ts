import { createBrowserRouter } from "react-router";
import { createElement } from "react";
import { RootLayout } from "@/frontend/components/shell/RootLayout";

// ─── Layout Shells (eagerly loaded — small, shared across all routes) ───
import { PublicLayout } from "@/frontend/components/shell/PublicLayout";
import { AuthenticatedLayout } from "@/frontend/components/shell/AuthenticatedLayout";
import { ShopFrontLayout } from "@/frontend/components/shell/ShopFrontLayout";

// ─── Route Guards ───
import { ProtectedRoute } from "@/frontend/components/guards/ProtectedRoute";

// ═══════════════════════════════════════════════════════════════════════
// Helper — converts a dynamic import of a default-exported page component
// into the shape React Router's `lazy` route property expects.
// This avoids React.lazy() entirely, so no Suspense / startTransition
// issues with synchronous user input.
// ═══════════════════════════════════════════════════════════════════════
const p = (factory: () => Promise<{ default: React.ComponentType }>) => ({
  lazy: () => factory().then((m) => ({ Component: m.default })),
});

// ═══════════════════════════════════════════════════════════════════════
// ROUTER
// ═══════════════════════════════════════════════════════════════════════

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    hydrateFallbackElement: createElement(
      "div",
      { className: "flex items-center justify-center min-h-screen" },
      createElement("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" }),
    ),
    children: [
      // ═══════════════════════════════════════════════════════════
      // PUBLIC PAGES — PublicLayout (PublicNavBar + PublicFooter)
      // ═══════════════════════════════════════════════════════════
      {
        Component: PublicLayout,
        children: [
          { index: true, ...p(() => import("@/frontend/pages/auth/LoginPage")) },
          { path: "privacy", ...p(() => import("@/frontend/pages/public/PrivacyPage")) },
          { path: "terms", ...p(() => import("@/frontend/pages/public/TermsPage")) },
          { path: "marketplace", ...p(() => import("@/frontend/pages/public/MarketplacePage")) },
          { path: "global-search", ...p(() => import("@/frontend/pages/public/GlobalSearchPage")) },
          { path: "agencies", ...p(() => import("@/frontend/pages/public/AgencyDirectoryPage")) },

          // Auth pages (public — no login required)
          { path: "auth/login", ...p(() => import("@/frontend/pages/auth/LoginPage")) },
          { path: "auth/register", ...p(() => import("@/frontend/pages/auth/RegisterPage")) },
          { path: "auth/register/:role", ...p(() => import("@/frontend/pages/auth/RegisterPage")) },
          { path: "auth/role-selection", ...p(() => import("@/frontend/pages/auth/RoleSelectionPage")) },
          { path: "auth/forgot-password", ...p(() => import("@/frontend/pages/auth/ForgotPasswordPage")) },
          { path: "auth/reset-password", ...p(() => import("@/frontend/pages/auth/ResetPasswordPage")) },
          { path: "auth/mfa-setup", ...p(() => import("@/frontend/pages/auth/MFASetupPage")) },
          { path: "auth/mfa-verify", ...p(() => import("@/frontend/pages/auth/MFAVerifyPage")) },
          { path: "auth/verification-result", ...p(() => import("@/frontend/pages/auth/VerificationResultPage")) },

          // Support
          { path: "support/help", ...p(() => import("@/frontend/pages/support/HelpCenterPage")) },
          { path: "support/ticket", ...p(() => import("@/frontend/pages/support/TicketSubmissionPage")) },
          { path: "support/refund", ...p(() => import("@/frontend/pages/support/RefundRequestPage")) },

          // Catch-all 404 inside PublicLayout so it gets navbar + bottom nav
          { path: "*", ...p(() => import("@/frontend/pages/public/NotFoundPage")) },
        ],
      },

      // ═══════════════════════════════════════════════════════════
      // AUTHENTICATED PAGES — ProtectedRoute → AuthenticatedLayout
      // ProtectedRoute checks isAuthenticated and redirects to login
      // if the user has no active session. AuthenticatedLayout then
      // renders the sidebar, header, and BottomNav shell.
      // ═══════════════════════════════════════════════════════════
      {
        Component: ProtectedRoute,
        children: [
          {
            Component: AuthenticatedLayout,
            children: [
              // Shared authenticated pages
              { path: "dashboard", ...p(() => import("@/frontend/pages/shared/DashboardPage")) },
              { path: "schedule/daily", ...p(() => import("@/frontend/pages/shared/DailySchedulePage")) },
              { path: "documents/view/:id", ...p(() => import("@/frontend/pages/shared/MedicalDocumentViewerPage")) },
              { path: "settings", ...p(() => import("@/frontend/pages/shared/SettingsPage")) },
              { path: "notifications", ...p(() => import("@/frontend/pages/shared/NotificationsPage")) },
              { path: "messages", ...p(() => import("@/frontend/pages/shared/MessagesPage")) },

              // ─── Caregiver ───
              { path: "caregiver/dashboard", ...p(() => import("@/frontend/pages/caregiver/CaregiverDashboardPage")) },
              { path: "caregiver/jobs", ...p(() => import("@/frontend/pages/caregiver/CaregiverJobsPage")) },
              { path: "caregiver/jobs/:id", ...p(() => import("@/frontend/pages/caregiver/CaregiverJobDetailPage")) },
              { path: "caregiver/schedule", ...p(() => import("@/frontend/pages/caregiver/CaregiverSchedulePage")) },
              { path: "caregiver/messages", ...p(() => import("@/frontend/pages/caregiver/CaregiverMessagesPage")) },
              { path: "caregiver/earnings", ...p(() => import("@/frontend/pages/caregiver/CaregiverEarningsPage")) },
              { path: "caregiver/reviews", ...p(() => import("@/frontend/pages/caregiver/CaregiverReviewsPage")) },
              { path: "caregiver/documents", ...p(() => import("@/frontend/pages/caregiver/CaregiverDocumentsPage")) },
              { path: "caregiver/profile", ...p(() => import("@/frontend/pages/caregiver/CaregiverProfilePage")) },
              { path: "caregiver/daily-earnings", ...p(() => import("@/frontend/pages/caregiver/DailyEarningsDetailPage")) },
              { path: "caregiver/job-application/:id", ...p(() => import("@/frontend/pages/caregiver/JobApplicationDetailPage")) },
              { path: "caregiver/payout-setup", ...p(() => import("@/frontend/pages/caregiver/PayoutSetupPage")) },
              { path: "caregiver/portfolio", ...p(() => import("@/frontend/pages/caregiver/PortfolioEditorPage")) },
              { path: "caregiver/references", ...p(() => import("@/frontend/pages/caregiver/ReferenceManagerPage")) },
              { path: "caregiver/shift/:id", ...p(() => import("@/frontend/pages/caregiver/ShiftDetailPage")) },
              { path: "caregiver/skills-assessment", ...p(() => import("@/frontend/pages/caregiver/SkillsAssessmentPage")) },
              { path: "caregiver/tax-reports", ...p(() => import("@/frontend/pages/caregiver/TaxReportsPage")) },
              { path: "caregiver/training", ...p(() => import("@/frontend/pages/caregiver/TrainingPortalPage")) },
              { path: "caregiver/assigned-patients", ...p(() => import("@/frontend/pages/caregiver/CaregiverAssignedPatientsPage")) },
              { path: "caregiver/care-log", ...p(() => import("@/frontend/pages/caregiver/CaregiverCareLogPage")) },
              { path: "caregiver/prescription", ...p(() => import("@/frontend/pages/caregiver/CaregiverPrescriptionPage")) },
              { path: "caregiver/med-schedule", ...p(() => import("@/frontend/pages/caregiver/CaregiverMedSchedulePage")) },
              { path: "caregiver/shift-planner", ...p(() => import("@/frontend/pages/caregiver/CaregiverShiftPlannerPage")) },
              { path: "caregiver/care-notes", ...p(() => import("@/frontend/pages/caregiver/CaregiverCareNotesPage")) },
              { path: "caregiver/shift-check-in", ...p(() => import("@/frontend/pages/caregiver/ShiftCheckInPage")) },
              { path: "caregiver/shift-check-in/:id", ...p(() => import("@/frontend/pages/caregiver/ShiftCheckInPage")) },
              { path: "caregiver/shift-checkout/:id", ...p(() => import("@/frontend/pages/caregiver/ShiftCheckOutPage")) },
              { path: "caregiver/incident-report", ...p(() => import("@/frontend/pages/caregiver/IncidentReportPage")) },
              { path: "caregiver/handoff-notes", ...p(() => import("@/frontend/pages/caregiver/HandoffNotesPage")) },
              { path: "caregiver/handoff", ...p(() => import("@/frontend/pages/caregiver/HandoffNotesPage")) },
              { path: "caregiver/alerts", ...p(() => import("@/frontend/pages/caregiver/CaregiverAlertsPage")) },

              // ─── Guardian ───
      { path: "guardian/dashboard", ...p(() => import("@/frontend/pages/guardian/GuardianDashboardPage")) },
      { path: "guardian/emergency", ...p(() => import("@/frontend/pages/patient/EmergencyHubPage")) },
      { path: "guardian/patients", ...p(() => import("@/frontend/pages/guardian/GuardianPatientsPage")) },
              { path: "guardian/schedule", ...p(() => import("@/frontend/pages/guardian/GuardianSchedulePage")) },
              { path: "guardian/messages", ...p(() => import("@/frontend/pages/guardian/GuardianMessagesPage")) },
              { path: "guardian/payments", ...p(() => import("@/frontend/pages/guardian/GuardianPaymentsPage")) },
              { path: "guardian/reviews", ...p(() => import("@/frontend/pages/guardian/GuardianReviewsPage")) },
              { path: "guardian/profile", ...p(() => import("@/frontend/pages/guardian/GuardianProfilePage")) },
              { path: "guardian/booking", ...p(() => import("@/frontend/pages/guardian/BookingWizardPage")) },
              { path: "guardian/caregiver-comparison", ...p(() => import("@/frontend/pages/guardian/CaregiverComparisonPage")) },
              { path: "guardian/caregiver/:id", ...p(() => import("@/frontend/pages/guardian/CaregiverPublicProfilePage")) },
              { path: "guardian/search", ...p(() => import("@/frontend/pages/guardian/CaregiverSearchPage")) },
              { path: "guardian/family-hub", ...p(() => import("@/frontend/pages/guardian/FamilyHubPage")) },
              { path: "guardian/invoice/:id", ...p(() => import("@/frontend/pages/guardian/InvoiceDetailPage")) },
              { path: "guardian/patient-intake", ...p(() => import("@/frontend/pages/guardian/PatientIntakePage")) },
              { path: "guardian/agency/:id", ...p(() => import("@/frontend/pages/guardian/AgencyPublicProfilePage")) },
              { path: "guardian/care-requirements", ...p(() => import("@/frontend/pages/guardian/CareRequirementsListPage")) },
              { path: "guardian/care-requirement-wizard", ...p(() => import("@/frontend/pages/guardian/CareRequirementWizardPage")) },
              { path: "guardian/care-requirement/:id", ...p(() => import("@/frontend/pages/guardian/CareRequirementDetailPage")) },
              { path: "guardian/placements", ...p(() => import("@/frontend/pages/guardian/GuardianPlacementsPage")) },
              { path: "guardian/placement/:id", ...p(() => import("@/frontend/pages/guardian/GuardianPlacementDetailPage")) },
              { path: "guardian/shift-rating/:id", ...p(() => import("@/frontend/pages/guardian/ShiftRatingPage")) },
              { path: "guardian/marketplace-hub", ...p(() => import("@/frontend/pages/guardian/GuardianMarketplaceHubPage")) },
              { path: "guardian/marketplace/package/:id", ...p(() => import("@/frontend/pages/guardian/PackageDetailPage")) },
              { path: "guardian/bid-review/:id", ...p(() => import("@/frontend/pages/guardian/BidReviewPage")) },
              { path: "guardian/care-log", ...p(() => import("@/frontend/pages/guardian/GuardianCareDiaryPage")) },
              { path: "guardian/alerts", ...p(() => import("@/frontend/pages/guardian/GuardianAlertsPage")) },
              { path: "guardian/live-tracking", ...p(() => import("@/frontend/pages/guardian/GuardianLiveTrackingPage")) },
              { path: "guardian/live-monitor", ...p(() => import("@/frontend/pages/guardian/GuardianLiveMonitorPage")) },
              { path: "guardian/care-scorecard", ...p(() => import("@/frontend/pages/guardian/GuardianCareScorecardPage")) },
              { path: "guardian/family-board", ...p(() => import("@/frontend/pages/guardian/GuardianFamilyBoardPage")) },
              { path: "guardian/incident-report", ...p(() => import("@/frontend/pages/guardian/GuardianIncidentReportPage")) },

              // ─── Admin ───
              { path: "admin/dashboard", ...p(() => import("@/frontend/pages/admin/AdminDashboardPage")) },
              { path: "admin/users", ...p(() => import("@/frontend/pages/admin/AdminUsersPage")) },
              { path: "admin/verifications", ...p(() => import("@/frontend/pages/admin/AdminVerificationsPage")) },
              { path: "admin/payments", ...p(() => import("@/frontend/pages/admin/AdminPaymentsPage")) },
              { path: "admin/reports", ...p(() => import("@/frontend/pages/admin/AdminReportsPage")) },
              { path: "admin/settings", ...p(() => import("@/frontend/pages/admin/AdminSettingsPage")) },
              { path: "admin/languages", ...p(() => import("@/frontend/pages/admin/AdminLanguageManagementPage")) },
              { path: "admin/audit-logs", ...p(() => import("@/frontend/pages/admin/AuditLogsPage")) },
              { path: "admin/cms", ...p(() => import("@/frontend/pages/admin/CMSManagerPage")) },
              { path: "admin/disputes", ...p(() => import("@/frontend/pages/admin/DisputeAdjudicationPage")) },
              { path: "admin/financial-audit", ...p(() => import("@/frontend/pages/admin/FinancialAuditPage")) },
              { path: "admin/policy", ...p(() => import("@/frontend/pages/admin/PolicyManagerPage")) },
              { path: "admin/promos", ...p(() => import("@/frontend/pages/admin/PromoManagementPage")) },
              { path: "admin/sitemap", ...p(() => import("@/frontend/pages/admin/SitemapPage")) },
              { path: "admin/support-ticket/:id", ...p(() => import("@/frontend/pages/admin/SupportTicketDetailPage")) },
              { path: "admin/system-health", ...p(() => import("@/frontend/pages/admin/SystemHealthPage")) },
              { path: "admin/user-inspector", ...p(() => import("@/frontend/pages/admin/UserInspectorPage")) },
              { path: "admin/verification-case/:id", ...p(() => import("@/frontend/pages/admin/VerificationCasePage")) },
              { path: "admin/placement-monitoring", ...p(() => import("@/frontend/pages/admin/AdminPlacementMonitoringPage")) },
              { path: "admin/agency-approvals", ...p(() => import("@/frontend/pages/admin/AdminAgencyApprovalsPage")) },
              { path: "admin/wallet-management", ...p(() => import("@/frontend/pages/admin/AdminWalletManagementPage")) },
              { path: "admin/contracts", ...p(() => import("@/frontend/pages/admin/AdminContractsPage")) },

              // ─── Agency ───
              { path: "agency/dashboard", ...p(() => import("@/frontend/pages/agency/AgencyDashboardPage")) },
              { path: "agency/caregivers", ...p(() => import("@/frontend/pages/agency/AgencyCaregiversPage")) },
              { path: "agency/clients", ...p(() => import("@/frontend/pages/agency/AgencyClientsPage")) },
              { path: "agency/payments", ...p(() => import("@/frontend/pages/agency/AgencyPaymentsPage")) },
              { path: "agency/reports", ...p(() => import("@/frontend/pages/agency/AgencyReportsPage")) },
              { path: "agency/storefront", ...p(() => import("@/frontend/pages/agency/AgencyStorefrontPage")) },
              { path: "agency/branches", ...p(() => import("@/frontend/pages/agency/BranchManagementPage")) },
              { path: "agency/care-plan/:id", ...p(() => import("@/frontend/pages/agency/ClientCarePlanPage")) },
              { path: "agency/client-intake", ...p(() => import("@/frontend/pages/agency/ClientIntakePage")) },
              { path: "agency/incident-report", ...p(() => import("@/frontend/pages/agency/IncidentReportWizardPage")) },
              { path: "agency/attendance", ...p(() => import("@/frontend/pages/agency/StaffAttendancePage")) },
              { path: "agency/hiring", ...p(() => import("@/frontend/pages/agency/StaffHiringPage")) },
              { path: "agency/requirements-inbox", ...p(() => import("@/frontend/pages/agency/AgencyRequirementsInboxPage")) },
              { path: "agency/requirement-review/:id", ...p(() => import("@/frontend/pages/agency/AgencyRequirementReviewPage")) },
              { path: "agency/placements", ...p(() => import("@/frontend/pages/agency/AgencyPlacementsPage")) },
              { path: "agency/placement/:id", ...p(() => import("@/frontend/pages/agency/AgencyPlacementDetailPage")) },
              { path: "agency/shift-monitoring", ...p(() => import("@/frontend/pages/agency/ShiftMonitoringPage")) },
              { path: "agency/job-management", ...p(() => import("@/frontend/pages/agency/AgencyJobManagementPage")) },
              { path: "agency/jobs/:id/applications", ...p(() => import("@/frontend/pages/agency/AgencyJobApplicationsPage")) },
              { path: "agency/payroll", ...p(() => import("@/frontend/pages/agency/AgencyPayrollPage")) },
              { path: "agency/messages", ...p(() => import("@/frontend/pages/agency/AgencyMessagesPage")) },
              { path: "agency/settings", ...p(() => import("@/frontend/pages/agency/AgencySettingsPage")) },
              { path: "agency/document-verification", ...p(() => import("@/frontend/pages/agency/DocumentVerificationPage")) },
              { path: "agency/backup-caregiver", ...p(() => import("@/frontend/pages/agency/BackupCaregiverPage")) },
              { path: "agency/reassignment-history", ...p(() => import("@/frontend/pages/agency/ReassignmentHistoryPage")) },
              { path: "agency/care-plan-template", ...p(() => import("@/frontend/pages/agency/CarePlanTemplatePage")) },
              { path: "agency/package-create", ...p(() => import("@/frontend/pages/agency/AgencyPackageCreatePage")) },
              { path: "agency/marketplace-browse", ...p(() => import("@/frontend/pages/agency/AgencyMarketplaceBrowsePage")) },
              { path: "agency/bid-management", ...p(() => import("@/frontend/pages/agency/AgencyBidManagementPage")) },
              { path: "agency/incidents", ...p(() => import("@/frontend/pages/agency/AgencyIncidentsPage")) },
              { path: "agency/care-scorecard", ...p(() => import("@/frontend/pages/agency/AgencyCareScorecardPage")) },

              // ─── Patient ───
              { path: "patient/dashboard", ...p(() => import("@/frontend/pages/patient/PatientDashboardPage")) },
              { path: "patient/care-history", ...p(() => import("@/frontend/pages/patient/PatientCareHistoryPage")) },
              { path: "patient/medical-records", ...p(() => import("@/frontend/pages/patient/PatientMedicalRecordsPage")) },
              { path: "patient/profile", ...p(() => import("@/frontend/pages/patient/PatientProfilePage")) },
              { path: "patient/health-report", ...p(() => import("@/frontend/pages/patient/PatientHealthReportPage")) },
              { path: "patient/data-privacy", ...p(() => import("@/frontend/pages/patient/DataPrivacyManagerPage")) },
              { path: "patient/emergency", ...p(() => import("@/frontend/pages/patient/EmergencyHubPage")) },
              { path: "patient/emergency-sos", ...p(() => import("@/frontend/pages/patient/EmergencySOSPage")) },
              { path: "patient/medications", ...p(() => import("@/frontend/pages/patient/MedicationRemindersPage")) },
              { path: "patient/vitals", ...p(() => import("@/frontend/pages/patient/VitalsTrackingPage")) },
              { path: "patient/schedule", ...p(() => import("@/frontend/pages/patient/PatientSchedulePage")) },
              { path: "patient/messages", ...p(() => import("@/frontend/pages/patient/PatientMessagesPage")) },
              { path: "patient/document-upload", ...p(() => import("@/frontend/pages/patient/PatientDocumentUploadPage")) },
              { path: "patient/care-log", ...p(() => import("@/frontend/pages/patient/PatientCareDiaryPage")) },
              { path: "patient/care-plan", ...p(() => import("@/frontend/pages/patient/PatientCarePlanPage")) },
              { path: "patient/alerts", ...p(() => import("@/frontend/pages/patient/PatientAlertsPage")) },
              { path: "patient/symptoms", ...p(() => import("@/frontend/pages/patient/PatientSymptomsPage")) },
              { path: "patient/photo-journal", ...p(() => import("@/frontend/pages/patient/PatientPhotoJournalPage")) },
              { path: "patient/nutrition", ...p(() => import("@/frontend/pages/patient/PatientNutritionPage")) },
              { path: "patient/rehab", ...p(() => import("@/frontend/pages/patient/PatientRehabPage")) },
              { path: "patient/insurance", ...p(() => import("@/frontend/pages/patient/PatientInsurancePage")) },
              { path: "patient/telehealth", ...p(() => import("@/frontend/pages/patient/PatientTelehealthPage")) },
              { path: "patient/care-requirements", ...p(() => import("@/frontend/pages/guardian/CareRequirementsListPage")) },
              { path: "patient/care-requirement-wizard", ...p(() => import("@/frontend/pages/guardian/CareRequirementWizardPage")) },
              { path: "patient/care-requirement/:id", ...p(() => import("@/frontend/pages/guardian/CareRequirementDetailPage")) },
              { path: "patient/marketplace-hub", ...p(() => import("@/frontend/pages/guardian/GuardianMarketplaceHubPage")) },
              { path: "patient/marketplace/package/:id", ...p(() => import("@/frontend/pages/guardian/PackageDetailPage")) },
              { path: "patient/bid-review/:id", ...p(() => import("@/frontend/pages/guardian/BidReviewPage")) },
              { path: "patient/placements", ...p(() => import("@/frontend/pages/guardian/GuardianPlacementsPage")) },
              { path: "patient/placement/:id", ...p(() => import("@/frontend/pages/guardian/GuardianPlacementDetailPage")) },
              { path: "patient/booking", ...p(() => import("@/frontend/pages/guardian/BookingWizardPage")) },
              { path: "patient/search", ...p(() => import("@/frontend/pages/guardian/CaregiverSearchPage")) },
              { path: "patient/caregiver/:id", ...p(() => import("@/frontend/pages/guardian/CaregiverPublicProfilePage")) },
              { path: "patient/agency/:id", ...p(() => import("@/frontend/pages/guardian/AgencyPublicProfilePage")) },

              // ─── Moderator ───
              { path: "moderator/dashboard", ...p(() => import("@/frontend/pages/moderator/ModeratorDashboardPage")) },
              { path: "moderator/reviews", ...p(() => import("@/frontend/pages/moderator/ModeratorReviewsPage")) },
              { path: "moderator/reports", ...p(() => import("@/frontend/pages/moderator/ModeratorReportsPage")) },
              { path: "moderator/content", ...p(() => import("@/frontend/pages/moderator/ModeratorContentPage")) },
              { path: "moderator/queue-detail/:id", ...p(() => import("@/frontend/pages/moderator/ModeratorQueueDetailPage")) },
              { path: "moderator/sanctions", ...p(() => import("@/frontend/pages/moderator/ModeratorSanctionsPage")) },
              { path: "moderator/escalations", ...p(() => import("@/frontend/pages/moderator/ModeratorEscalationsPage")) },

              // ─── Shop Merchant ───
              { path: "shop/dashboard", ...p(() => import("@/frontend/pages/shop/ShopDashboardPage")) },
              { path: "shop/products", ...p(() => import("@/frontend/pages/shop/ShopProductsPage")) },
              { path: "shop/orders", ...p(() => import("@/frontend/pages/shop/ShopOrdersPage")) },
              { path: "shop/inventory", ...p(() => import("@/frontend/pages/shop/ShopInventoryPage")) },
              { path: "shop/analytics", ...p(() => import("@/frontend/pages/shop/ShopAnalyticsPage")) },
              { path: "shop/merchant-analytics", ...p(() => import("@/frontend/pages/shop/MerchantAnalyticsPage")) },
              { path: "shop/fulfillment", ...p(() => import("@/frontend/pages/shop/MerchantFulfillmentPage")) },
              { path: "shop/onboarding", ...p(() => import("@/frontend/pages/shop/MerchantOnboardingPage")) },
              { path: "shop/product-editor", ...p(() => import("@/frontend/pages/shop/ProductEditorPage")) },
              { path: "shop/product-editor/:id", ...p(() => import("@/frontend/pages/shop/ProductEditorPage")) },

              // ─── Wallet & Contracts ───
              { path: "wallet", ...p(() => import("@/frontend/pages/wallet/WalletPage")) },
              { path: "wallet/transfer-history", ...p(() => import("@/frontend/pages/wallet/TransferHistoryPage")) },
              { path: "wallet/top-up", ...p(() => import("@/frontend/pages/wallet/TopUpPage")) },
              { path: "contracts", ...p(() => import("@/frontend/pages/contracts/ContractListPage")) },
              { path: "contracts/:id", ...p(() => import("@/frontend/pages/contracts/ContractDetailPage")) },
              { path: "contracts/disputes", ...p(() => import("@/frontend/pages/contracts/ContractDisputePage")) },
              { path: "contracts/disputes/:id", ...p(() => import("@/frontend/pages/contracts/ContractDisputePage")) },

              // ─── Billing ───
              { path: "billing", ...p(() => import("@/frontend/pages/billing/BillingOverviewPage")) },
              { path: "billing/invoice/:invoiceId", ...p(() => import("@/frontend/pages/billing/BillingInvoiceDetailPage")) },
              { path: "billing/submit-proof/:invoiceId", ...p(() => import("@/frontend/pages/billing/SubmitPaymentProofPage")) },
              { path: "billing/verify/:proofId", ...p(() => import("@/frontend/pages/billing/VerifyPaymentPage")) },

              // ─── Dev Pages ───
              { path: "dev/connectivity", ...p(() => import("@/frontend/pages/dev/ConnectivityDemoPage")) },
            ],
          },
        ],
      },

      // ═══════════════════════════════════════════════════════════
      // SHOP FRONT (Customer) — ShopFrontLayout (NavBar + Footer)
      // Public browsing — no auth required
      // ═══════════════════════════════════════════════════════════
      {
        Component: ShopFrontLayout,
        children: [
          { path: "shop", ...p(() => import("@/frontend/pages/shop-front/ProductListPage")) },
          { path: "shop/category/:category", ...p(() => import("@/frontend/pages/shop-front/ProductCategoryPage")) },
          { path: "shop/product/:id", ...p(() => import("@/frontend/pages/shop-front/ProductDetailsPage")) },
          { path: "shop/product/:id/reviews", ...p(() => import("@/frontend/pages/shop-front/ProductReviewsPage")) },
          { path: "shop/cart", ...p(() => import("@/frontend/pages/shop-front/CartPage")) },
          { path: "shop/checkout", ...p(() => import("@/frontend/pages/shop-front/CheckoutPage")) },
          { path: "shop/order-success", ...p(() => import("@/frontend/pages/shop-front/OrderSuccessPage")) },
          { path: "shop/order-tracking/:id", ...p(() => import("@/frontend/pages/shop-front/OrderTrackingPage")) },
          { path: "shop/order-history", ...p(() => import("@/frontend/pages/shop-front/CustomerOrderHistoryPage")) },
          { path: "shop/wishlist", ...p(() => import("@/frontend/pages/shop-front/WishlistPage")) },
        ],
      },
    ],
  },
]);
