# D022 - Feature Expansion Plan (Phases 1-10)

> **Created:** March 17, 2026
> **Status:** Planned
> **Scope:** 10 original feature requests + 8 additional recommended features
> **Impact:** 14 new pages (168 -> 182), 18 new model types, 30+ new service methods, 10 new hooks, 8 new shared components

---

## Feature Audit Summary

| # | Feature | Current Status | Gap Level |
|---|---------|---------------|-----------|
| 1 | Profile selfie upload | UI shell only (Camera icon, no wiring) | Medium |
| 2 | NID / Education / Training / Police cert upload | Generic upload zone, no categories | Medium |
| 3 | Document verification by Agency + Admin | Admin only (AdminVerificationsPage) | Medium |
| 4 | Daily schedule / To-do list (all 4 roles) | Scattered per-role schedule pages | High |
| 5 | Task completion tick + comment | Tick exists, no comment | Low |
| 6 | Unscheduled event / incident reporting | Agency wizard + caregiver log type | Low |
| 7 | Shift start / check-in (presence) | Active shift view exists, no explicit start flow | Medium |
| 8 | Agency shift re-allocation for missed shifts | "Assign Replacement" button, no workflow | High |
| 9 | Backup / standby caregiver system | Missing entirely | Critical |
| 10 | Prescription / report document upload | Text entry only, no file/camera capture | Medium |
| A1 | GPS-verified check-in | Not present | New |
| A2 | Caregiver-to-caregiver handoff notes | Not present | New |
| A3 | Document expiry alerts | Not present | New |
| A4 | Guardian real-time shift notifications | Not present | New |
| A5 | Patient vitals trend chart | VitalsTrackingPage exists, no longitudinal chart | New |
| A6 | Emergency SOS button | Not present | New |
| A7 | Care plan templates | Not present | New |
| A8 | Shift rating by guardian | Not present | New |

---

## Phase 1 - File Upload Infrastructure (Foundation)

> **Dependency:** Phases 2, 5, 7, 8, 10 depend on this phase.

| # | Task | File Path | Action |
|---|------|-----------|--------|
| 1.1 | Create `FileUpload` model types (`UploadedFile`, `FileUploadState`, `DocumentCategory`, `UploadProgress`) | `/src/backend/models/upload.model.ts` | CREATE |
| 1.2 | Export new model from barrel | `/src/backend/models/index.ts` | EDIT - add `export * from "./upload.model"` |
| 1.3 | Create `upload.service.ts` with methods: `uploadFile()`, `capturePhoto()`, `deleteFile()`, `getFileUrl()` - mock with localStorage/base64 for now, structured for Supabase Storage swap | `/src/backend/services/upload.service.ts` | CREATE |
| 1.4 | Export new service from barrel | `/src/backend/services/index.ts` | EDIT - add export |
| 1.5 | Create `useFileUpload` hook - wraps upload.service, manages upload state, progress, error | `/src/frontend/hooks/useFileUpload.ts` | CREATE |
| 1.6 | Export new hook from barrel | `/src/frontend/hooks/index.ts` | EDIT |
| 1.7 | Create `FileUploadCapture` component - camera button + file input + drag-drop zone + preview thumbnail + progress bar + remove button. Props: `accept`, `maxSize`, `onUpload`, `category` | `/src/frontend/components/shared/FileUploadCapture.tsx` | CREATE |
| 1.8 | Create `ImagePreviewCrop` component - shows uploaded image, basic crop/rotate, confirm | `/src/frontend/components/shared/ImagePreviewCrop.tsx` | CREATE |
| 1.9 | Create mock upload data (sample file URLs, states) | `/src/backend/api/mock/uploadMocks.ts` | CREATE |
| 1.10 | Export mock from barrel | `/src/backend/api/mock/index.ts` | EDIT |

---

## Phase 2 - Profile Selfie + Document Uploads (Features #1, #2)

| # | Task | File Path | Action |
|---|------|-----------|--------|
| 2.1 | Add `avatarUrl` field to `CaregiverProfileData` type | `/src/backend/models/caregiver.model.ts` | EDIT |
| 2.2 | Add `DocumentCategory` enum values: `nid`, `education`, `training`, `police_verification`, `medical_license`, `other` to upload model | `/src/backend/models/upload.model.ts` | EDIT (from 1.1) |
| 2.3 | Expand `CaregiverDocument` type - add `category: DocumentCategory`, `thumbnailUrl`, `fileUrl`, `captureMethod: "camera" | "file"` | `/src/backend/models/caregiver.model.ts` | EDIT |
| 2.4 | Update `caregiverMocks.ts` - add mock documents per category (NID front/back, education cert, training cert, police verification) | `/src/backend/api/mock/caregiverMocks.ts` | EDIT |
| 2.5 | Add `uploadProfilePhoto()`, `uploadDocument(category, file)` to `caregiver.service.ts` | `/src/backend/services/caregiver.service.ts` | EDIT |
| 2.6 | Rebuild `CaregiverProfilePage` - wire Camera button to `FileUploadCapture` for selfie, show actual photo when uploaded | `/src/frontend/pages/caregiver/CaregiverProfilePage.tsx` | EDIT |
| 2.7 | Rebuild `CaregiverDocumentsPage` - add document category selector (NID/Education/Training/Police), wire upload zone to `FileUploadCapture` with camera option, show thumbnails | `/src/frontend/pages/caregiver/CaregiverDocumentsPage.tsx` | EDIT |

---

## Phase 3 - Agency + Admin Document Verification (Feature #3)

| # | Task | File Path | Action |
|---|------|-----------|--------|
| 3.1 | Add `VerificationAction`, `DocumentVerificationItem` types to agency model | `/src/backend/models/agency.model.ts` | EDIT |
| 3.2 | Add mock verification queue data for agency | `/src/backend/api/mock/agencyMocks.ts` | EDIT |
| 3.3 | Add `getCaregiverDocuments()`, `verifyDocument()`, `rejectDocument()` to `agency.service.ts` | `/src/backend/services/agency.service.ts` | EDIT |
| 3.4 | Create `useAgencyVerification` hook | `/src/frontend/hooks/useAgencyVerification.ts` | CREATE |
| 3.5 | Create `AgencyDocumentVerificationPage` - list caregivers with pending docs, document viewer, approve/reject with notes | `/src/frontend/pages/agency/AgencyDocumentVerificationPage.tsx` | CREATE |
| 3.6 | Add route for agency verification | `/src/app/routes.ts` | EDIT - add `{ path: "agency/document-verification", Component: AgencyDocumentVerificationPage }` |
| 3.7 | Add navigation link to agency sidebar/menu | Applicable navigation file | EDIT |
| 3.8 | Add `DocumentExpiryAlert` model type for expiry tracking (ties to Phase 10 - Additional Feature A3) | `/src/backend/models/upload.model.ts` | EDIT |

---

## Phase 4 - Unified Daily Schedule / To-Do System (Features #4, #5)

| # | Task | File Path | Action |
|---|------|-----------|--------|
| 4.1 | Create `schedule.model.ts` with `DailyTask` type: `id`, `type: "event" | "task"` (dropdown), `title`, `details` (text), `time`, `patientId?`, `caregiverId?`, `guardianId?`, `agencyId?`, `status`, `completedAt?`, `completionNote?`, `createdBy`, `createdByRole` | `/src/backend/models/schedule.model.ts` | CREATE |
| 4.2 | Export from barrel | `/src/backend/models/index.ts` | EDIT |
| 4.3 | Create `scheduleMocks.ts` - mock tasks for all 4 roles with realistic Bangladesh care scenarios | `/src/backend/api/mock/scheduleMocks.ts` | CREATE |
| 4.4 | Export from barrel | `/src/backend/api/mock/index.ts` | EDIT |
| 4.5 | Create `schedule.service.ts` with `getTasks()`, `createTask()`, `completeTask(id, note)`, `updateTask()`, `deleteTask()` | `/src/backend/services/schedule.service.ts` | CREATE |
| 4.6 | Export from barrel | `/src/backend/services/index.ts` | EDIT |
| 4.7 | Create `useScheduleTasks` hook | `/src/frontend/hooks/useScheduleTasks.ts` | CREATE |
| 4.8 | Create `DailyTaskCreator` shared component - Event/Task dropdown, Details textarea, Time picker, Patient/Caregiver selectors (role-dependent) | `/src/frontend/components/shared/DailyTaskCreator.tsx` | CREATE |
| 4.9 | Create `TaskCompletionModal` shared component - tick + comment textarea + optional photo | `/src/frontend/components/shared/TaskCompletionModal.tsx` | CREATE |
| 4.10 | Create `DailySchedulePage` - unified page usable by all roles, role-aware field visibility | `/src/frontend/pages/shared/DailySchedulePage.tsx` | CREATE |
| 4.11 | Add route | `/src/app/routes.ts` | EDIT - add `{ path: "schedule/daily", Component: DailySchedulePage }` |
| 4.12 | Update `CaregiverShiftPlannerPage` - integrate `TaskCompletionModal` for task completion with comment | `/src/frontend/pages/caregiver/CaregiverShiftPlannerPage.tsx` | EDIT |
| 4.13 | Update `ShiftDetailPage` - replace "Mark Done" with `TaskCompletionModal` | `/src/frontend/pages/caregiver/ShiftDetailPage.tsx` | EDIT |

---

## Phase 5 - Shift Lifecycle: Start, Check-in, GPS (Feature #7 + Additional A1)

| # | Task | File Path | Action |
|---|------|-----------|--------|
| 5.1 | Extend `Shift` model - add `checkInGps?: { lat: number; lng: number }`, `checkInSelfieUrl?`, `checkOutGps?`, `checkOutSelfieUrl?` | `/src/backend/models/shift.model.ts` | EDIT |
| 5.2 | Add `ShiftCheckIn` type: `shiftId`, `selfieUrl`, `gpsCoords`, `timestamp`, `verified: boolean` | `/src/backend/models/shift.model.ts` | EDIT |
| 5.3 | Add mock shift check-in data | `/src/backend/api/mock/caregiverMocks.ts` | EDIT |
| 5.4 | Add `startShift(id, selfie, gps)`, `endShift(id, selfie, gps)` to `caregiver.service.ts` | `/src/backend/services/caregiver.service.ts` | EDIT |
| 5.5 | Create `useShiftCheckIn` hook - manages camera, GPS, validation | `/src/frontend/hooks/useShiftCheckIn.ts` | CREATE |
| 5.6 | Create `ShiftCheckInPage` - selfie capture + GPS auto-detect + confirm button + "Start Shift" CTA | `/src/frontend/pages/caregiver/ShiftCheckInPage.tsx` | CREATE |
| 5.7 | Create `ShiftCheckOutPage` - similar to check-in, plus shift summary | `/src/frontend/pages/caregiver/ShiftCheckOutPage.tsx` | CREATE |
| 5.8 | Add routes | `/src/app/routes.ts` | EDIT - add `shift-checkin/:id` and `shift-checkout/:id` |
| 5.9 | Update `ShiftDetailPage` - add "Start Shift" button that navigates to check-in page | `/src/frontend/pages/caregiver/ShiftDetailPage.tsx` | EDIT |
| 5.10 | Update `ShiftMonitoringPage` - show GPS verification badge per shift | `/src/frontend/pages/agency/ShiftMonitoringPage.tsx` | EDIT |

---

## Phase 6 - Shift Replacement + Backup Caregiver System (Features #8, #9)

| # | Task | File Path | Action |
|---|------|-----------|--------|
| 6.1 | Create `backup.model.ts` with `BackupAssignment`, `ShiftReassignment`, `StandbySlot` types | `/src/backend/models/backup.model.ts` | CREATE |
| 6.2 | Export from barrel | `/src/backend/models/index.ts` | EDIT |
| 6.3 | Create `backupMocks.ts` - mock backup assignments, standby rosters, reassignment history | `/src/backend/api/mock/backupMocks.ts` | CREATE |
| 6.4 | Export from barrel | `/src/backend/api/mock/index.ts` | EDIT |
| 6.5 | Create `backup.service.ts` with `getBackupsForPlacement()`, `addBackup()`, `removeBackup()`, `getAvailableReplacements()`, `reassignShift()`, `getReassignmentHistory()` | `/src/backend/services/backup.service.ts` | CREATE |
| 6.6 | Export from barrel | `/src/backend/services/index.ts` | EDIT |
| 6.7 | Create `useBackupRoster` hook | `/src/frontend/hooks/useBackupRoster.ts` | CREATE |
| 6.8 | Create `BackupRosterPage` (agency) - list placements, manage primary + backup caregivers per placement, drag to reorder priority | `/src/frontend/pages/agency/BackupRosterPage.tsx` | CREATE |
| 6.9 | Create `ShiftReassignmentModal` component - select replacement from backup list or full roster, reason, notify parties | `/src/frontend/components/shared/ShiftReassignmentModal.tsx` | CREATE |
| 6.10 | Create `ReassignmentHistoryPage` (agency) - log of all reassignments with billing impact | `/src/frontend/pages/agency/ReassignmentHistoryPage.tsx` | CREATE |
| 6.11 | Add routes | `/src/app/routes.ts` | EDIT - add `agency/backup-roster`, `agency/reassignment-history` |
| 6.12 | Wire "Assign Replacement" button in `ShiftMonitoringPage` to `ShiftReassignmentModal` | `/src/frontend/pages/agency/ShiftMonitoringPage.tsx` | EDIT |
| 6.13 | Update `AgencyPlacementDetailPage` - add "Backup Caregivers" section | `/src/frontend/pages/agency/AgencyPlacementDetailPage.tsx` | EDIT |

---

## Phase 7 - Enhanced Incident Reporting (Feature #6)

| # | Task | File Path | Action |
|---|------|-----------|--------|
| 7.1 | Add `IncidentReport` type to shift model: `id`, `reportedBy`, `reporterRole`, `type`, `severity`, `patientId`, `shiftId?`, `description`, `immediateAction`, `photos[]`, `gps?`, `createdAt`, `status`, `escalatedTo?` | `/src/backend/models/shift.model.ts` | EDIT |
| 7.2 | Add mock incident data | `/src/backend/api/mock/caregiverMocks.ts` | EDIT |
| 7.3 | Add `reportIncident()`, `getIncidentHistory()` to `caregiver.service.ts` | `/src/backend/services/caregiver.service.ts` | EDIT |
| 7.4 | Add `reportIncident()` to `guardian.service.ts` | `/src/backend/services/guardian.service.ts` | EDIT |
| 7.5 | Create `useIncidentReport` hook | `/src/frontend/hooks/useIncidentReport.ts` | CREATE |
| 7.6 | Create `CaregiverIncidentReportPage` - dedicated page: incident type dropdown (Fall, Medication Error, Behavioral, Equipment, Other), severity, description, photo capture, immediate actions taken | `/src/frontend/pages/caregiver/CaregiverIncidentReportPage.tsx` | CREATE |
| 7.7 | Create `GuardianIncidentReportPage` - guardian reports concerns about care quality | `/src/frontend/pages/guardian/GuardianIncidentReportPage.tsx` | CREATE |
| 7.8 | Add routes | `/src/app/routes.ts` | EDIT - add `caregiver/incident-report`, `guardian/incident-report` |
| 7.9 | Update `ShiftDetailPage` - wire "Report Issue" button to navigate to incident report page | `/src/frontend/pages/caregiver/ShiftDetailPage.tsx` | EDIT |

---

## Phase 8 - Medical Document Upload (Feature #10)

| # | Task | File Path | Action |
|---|------|-----------|--------|
| 8.1 | Add `MedicalDocument` type to patient model: `id`, `patientId`, `type: "prescription" | "lab_report" | "discharge" | "imaging" | "other"`, `fileUrl`, `thumbnailUrl`, `uploadedBy`, `uploadedByRole`, `createdAt`, `notes` | `/src/backend/models/patient.model.ts` | EDIT |
| 8.2 | Add mock medical documents | `/src/backend/api/mock/patientMocks.ts` | EDIT |
| 8.3 | Add `uploadMedicalDocument()`, `getMedicalDocuments()` to `patient.service.ts` | `/src/backend/services/patient.service.ts` | EDIT |
| 8.4 | Create `useMedicalDocuments` hook | `/src/frontend/hooks/useMedicalDocuments.ts` | CREATE |
| 8.5 | Update `CaregiverPrescriptionPage` - add "Scan Prescription" camera button using `FileUploadCapture`, show thumbnail alongside text data | `/src/frontend/pages/caregiver/CaregiverPrescriptionPage.tsx` | EDIT |
| 8.6 | Update `PatientMedicalRecordsPage` - add upload button for lab reports, discharge summaries; show thumbnails; real download buttons | `/src/frontend/pages/patient/PatientMedicalRecordsPage.tsx` | EDIT |
| 8.7 | Create `MedicalDocumentViewerPage` - full-screen document viewer with zoom/rotate | `/src/frontend/pages/shared/MedicalDocumentViewerPage.tsx` | CREATE |
| 8.8 | Add route | `/src/app/routes.ts` | EDIT - add `documents/view/:id` |

---

## Phase 9 - Handoff Notes + Shift Rating (Additional A2, A8)

| # | Task | File Path | Action |
|---|------|-----------|--------|
| 9.1 | Add `HandoffNote` type to shift model: `id`, `fromCaregiverId`, `toCaregiverId`, `shiftId`, `patientId`, `notes`, `flaggedItems[]`, `createdAt` | `/src/backend/models/shift.model.ts` | EDIT |
| 9.2 | Add `ShiftRating` type to shift model: `id`, `shiftId`, `ratedBy`, `ratedByRole`, `rating: 1-5`, `comment`, `createdAt` | `/src/backend/models/shift.model.ts` | EDIT |
| 9.3 | Add mock data for handoffs and ratings | `/src/backend/api/mock/caregiverMocks.ts` | EDIT |
| 9.4 | Add `createHandoffNote()`, `getHandoffNotes()`, `rateShift()` to caregiver service | `/src/backend/services/caregiver.service.ts` | EDIT |
| 9.5 | Create `useHandoffNotes` hook | `/src/frontend/hooks/useHandoffNotes.ts` | CREATE |
| 9.6 | Create `ShiftHandoffPage` - outgoing caregiver writes notes, flags items, for incoming caregiver | `/src/frontend/pages/caregiver/ShiftHandoffPage.tsx` | CREATE |
| 9.7 | Create `ShiftRatingModal` component - stars + comment, shown to guardian after shift ends | `/src/frontend/components/shared/ShiftRatingModal.tsx` | CREATE |
| 9.8 | Add routes | `/src/app/routes.ts` | EDIT - add `caregiver/shift-handoff/:id` |
| 9.9 | Update `ShiftCheckOutPage` (from Phase 5) - prompt handoff note flow before checkout | `/src/frontend/pages/caregiver/ShiftCheckOutPage.tsx` | EDIT |
| 9.10 | Update `GuardianPlacementDetailPage` - show shift rating option for completed shifts | `/src/frontend/pages/guardian/GuardianPlacementDetailPage.tsx` | EDIT |

---

## Phase 10 - Guardian Notifications, Emergency SOS, Expiry Alerts, Care Templates, Vitals Chart (Additional A3, A4, A5, A6, A7)

| # | Task | File Path | Action |
|---|------|-----------|--------|
| 10.1 | Add `EmergencySOS` type to patient model: `id`, `triggeredBy`, `patientId`, `gps`, `timestamp`, `notifiedContacts[]`, `status` | `/src/backend/models/patient.model.ts` | EDIT |
| 10.2 | Add `CarePlanTemplate` type to agency model: `id`, `name`, `condition`, `tasks[]`, `medications[]`, `schedule` | `/src/backend/models/agency.model.ts` | EDIT |
| 10.3 | Add mock SOS data, care templates, vitals history | `/src/backend/api/mock/patientMocks.ts` | EDIT |
| 10.4 | Add `triggerSOS()`, `getSOSHistory()` to `patient.service.ts` | `/src/backend/services/patient.service.ts` | EDIT |
| 10.5 | Add `getCareTemplates()`, `applyTemplate()` to `agency.service.ts` | `/src/backend/services/agency.service.ts` | EDIT |
| 10.6 | Add document expiry check `getExpiringDocuments(daysAhead)` to `caregiver.service.ts` | `/src/backend/services/caregiver.service.ts` | EDIT |
| 10.7 | Create `EmergencySOSButton` component - floating, red, one-tap, sends GPS + alerts | `/src/frontend/components/shared/EmergencySOSButton.tsx` | CREATE |
| 10.8 | Create `EmergencySOSPage` - confirmation screen, contact list, GPS, status | `/src/frontend/pages/patient/EmergencySOSPage.tsx` | CREATE |
| 10.9 | Create `DocumentExpiryWidget` component - shows expiring docs with countdown | `/src/frontend/components/shared/DocumentExpiryWidget.tsx` | CREATE |
| 10.10 | Create `CarePlanTemplatePage` (agency) - browse/apply templates per condition | `/src/frontend/pages/agency/CarePlanTemplatePage.tsx` | CREATE |
| 10.11 | Update `VitalsTrackingPage` - add recharts-based longitudinal trend chart for BP, sugar, temperature over weeks | `/src/frontend/pages/patient/VitalsTrackingPage.tsx` | EDIT |
| 10.12 | Update `CaregiverDashboardPage` - add `DocumentExpiryWidget` | `/src/frontend/pages/caregiver/CaregiverDashboardPage.tsx` | EDIT |
| 10.13 | Update `PatientDashboardPage` - add `EmergencySOSButton` | `/src/frontend/pages/patient/PatientDashboardPage.tsx` | EDIT |
| 10.14 | Add routes | `/src/app/routes.ts` | EDIT - add `patient/emergency-sos`, `agency/care-templates` |
| 10.15 | Add guardian auto-notification mock to notification service - shift start/end/incident triggers | `/src/backend/services/notification.service.ts` | EDIT |

---

## Totals

| Category | Creates | Edits |
|----------|---------|-------|
| Models (`/src/backend/models/`) | 3 new files | 7 existing files |
| Mock Data (`/src/backend/api/mock/`) | 3 new files | 5 existing files |
| Services (`/src/backend/services/`) | 3 new files | 7 existing files |
| Hooks (`/src/frontend/hooks/`) | 10 new files | 1 existing file |
| Shared Components (`/src/frontend/components/shared/`) | 8 new files | 0 |
| Pages (`/src/frontend/pages/`) | 14 new pages | 12 existing pages |
| Routes (`/src/app/routes.ts`) | 0 | 1 file, multiple edits |
| Barrels (`index.ts` files) | 0 | 4 existing files |
| **TOTAL** | **41 creates** | **37 edits** |

- **New pages: 14** (168 -> 182 total)
- **New model types: ~18**
- **New service methods: ~30**
- **New hooks: 10**
- **New shared components: 8**

---

## Phase Dependencies

```
Phase 1 (File Upload Infrastructure)
  |
  +---> Phase 2 (Profile Selfie + Document Upload)
  |       |
  |       +---> Phase 3 (Agency + Admin Verification)
  |
  +---> Phase 5 (Shift Check-in + GPS)
  |       |
  |       +---> Phase 9 (Handoff Notes + Rating)
  |
  +---> Phase 7 (Enhanced Incident Reporting)
  |
  +---> Phase 8 (Medical Document Upload)

Phase 4 (Daily Schedule / To-Do) --- independent, can run in parallel

Phase 6 (Backup Caregiver + Shift Replacement) --- independent, can run in parallel

Phase 10 (SOS, Expiry, Templates, Vitals, Notifications) --- depends on Phases 2, 5
```

---

## New Routes Summary

| Route Path | Page | Phase |
|------------|------|-------|
| `agency/document-verification` | AgencyDocumentVerificationPage | 3 |
| `schedule/daily` | DailySchedulePage | 4 |
| `caregiver/shift-checkin/:id` | ShiftCheckInPage | 5 |
| `caregiver/shift-checkout/:id` | ShiftCheckOutPage | 5 |
| `agency/backup-roster` | BackupRosterPage | 6 |
| `agency/reassignment-history` | ReassignmentHistoryPage | 6 |
| `caregiver/incident-report` | CaregiverIncidentReportPage | 7 |
| `guardian/incident-report` | GuardianIncidentReportPage | 7 |
| `documents/view/:id` | MedicalDocumentViewerPage | 8 |
| `caregiver/shift-handoff/:id` | ShiftHandoffPage | 9 |
| `patient/emergency-sos` | EmergencySOSPage | 10 |
| `agency/care-templates` | CarePlanTemplatePage | 10 |
