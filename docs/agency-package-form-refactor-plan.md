# Agency Package Creation Form — Refactor Implementation Plan

**File under review:** `src/frontend/pages/agency/AgencyPackageCreatePage.tsx`  
**Supporting files touched:** `src/locales/en/guardian.json`, `src/locales/bn/guardian.json`, `src/imports/agency-package-create-wizard-fields.json`  
**Do NOT touch:** `src/backend/domain/uccf/`, `src/backend/models/`, any migration files, `supabase/`, `PackageDetailPage.tsx`, the guardian requirement wizard

---

## Guiding Principle

This form creates a **supply-side offer** — an agency declaring what they *can provide*. The current form was largely copied from the demand-side requirement wizard (what a family *needs* for their patient). Every field in this plan is assessed by that lens. Fields that describe a specific patient are removed. Fields that describe the agency's capabilities are kept, reframed, or added.

---

## Part 1 — Form State Changes

### 1A. Keys to DELETE from the `useState` initializer (lines 85–149)

Remove the following keys entirely from the form state object. Do not replace them with anything.

```
targetAge
targetGender
targetCondition
adlBathing
feedingOral
feedingTube
toiletingAssisted
toiletingFull
adlMobility
monitorVitals
diagnosis
includedHours
overtimeRate
extraCharges
```

**Rationale for each removal:**
- `targetAge / targetGender / targetCondition` — These describe a specific patient. An agency selling a package does not have a patient at this stage. They map to `care_subject.*` in the payload, which is the patient-data path from the guardian wizard.
- `adlBathing / toiletingAssisted / toiletingFull` — Exact duplicates of `personal_care: ["bathing", "toileting"]` in the service checklist. The service checklists are displayed on `PackageDetailPage`; the ADL toggles are not shown anywhere to the client.
- `feedingOral / feedingTube` — Feeding is already captured by `personal_care` checklist and by `advanced_care: ["NG_tube"]` and `devices: ["feeding_tube"]`. Asking for it a third time as a dedicated toggle adds no value.
- `adlMobility` — Captured by service checklist tasks; not displayed on PackageDetailPage.
- `monitorVitals` — Exact duplicate of `medical_support: ["vitals"]` in the service checklist.
- `diagnosis` — A patient's diagnosis. An agency does not have a diagnosis when creating a package. It maps to `medical.diagnosis` which is the patient's medical record field.
- `includedHours / overtimeRate` — The system has no hour-tracking mechanism. There is no comparison of worked hours against included hours in any billing, payroll, or shift service. These fields are only rendered as decorative text on PackageDetailPage; displaying them misleads clients into believing overtime is enforced by the platform.
- `extraCharges` — Declared in state but no UI has ever been rendered for it. Always submits `[]`. Remove it; if the system later gains this capability it should be designed from scratch.

### 1B. Keys to KEEP (no change to key name or type)

```
title
categories
city
serviceAreas
newArea
durationType
locationType
accommodationProvided
foodProvided
travelDistanceKm
monitorSupervision
companionship
medicationComplexity
devices
procedures
equipmentSlugs
equipmentProvider
caregiverCount
nurseCount
staffLevel
genderPref
experienceYears
certifications
personal_care
medical_support
household_support
advanced_care
coordination
exclusions
addOns
hoursPerDay
shiftType
staffPattern
basePrice
pricingModel
replacementHours
emergencyMinutes
attendancePercent
reportingFreq
backgroundVerified
medicalFit
contractRequired
trialAvailable
```

### 1C. Default value changes

Change the following default values in the `useState` initializer:

| Key | Current default | New default | Reason |
|-----|----------------|-------------|--------|
| `city` | `"Dhaka"` | `""` | Hard-coded city causes wrong location for non-Dhaka agencies who don't notice the pre-fill |
| `serviceAreas` | `["Gulshan"]` | `[]` | Same reason — a fake pre-filled area passes validation and gets published with wrong data |

---

## Part 2 — `handlePublish` Function Changes (lines 168–318)

### 2A. Remove the entire `care_subject` construction and submission

Delete these lines completely (approximately lines 230–238):

```typescript
const targetAgeNum = parseInt(form.targetAge, 10);
const care_subject =
  form.targetAge || form.targetGender || form.targetCondition.trim()
    ? {
        age: !Number.isNaN(targetAgeNum) && targetAgeNum > 0 ? targetAgeNum : 0,
        gender: form.targetGender || undefined,
        condition_summary: form.targetCondition.trim() || undefined,
        mobility: "assisted" as const,
      }
    : undefined;
```

Also remove the `care_subject,` line from the `pkg` object passed to `createAgencyPackage`.

### 2B. Remove the entire `adl` construction

Delete these lines completely (approximately lines 188–197):

```typescript
const adl: NonNullable<UCCFCareNeeds["ADL"]> = {};
if (form.adlBathing) adl.bathing = true;
if (form.feedingTube) adl.feeding = "tube";
else if (form.feedingOral) adl.feeding = "oral";
if (form.toiletingFull) adl.toileting = "full";
else if (form.toiletingAssisted) adl.toileting = "assisted";
if (form.adlMobility) adl.mobility_support = true;
```

### 2C. Update the `monitoring` construction

The current monitoring block (approximately lines 198–200) includes `vitals`. Remove that line. Keep `continuous_supervision`.

Current:
```typescript
const monitoring: NonNullable<UCCFCareNeeds["monitoring"]> = {};
if (form.monitorVitals) monitoring.vitals = true;
if (form.monitorSupervision) monitoring.continuous_supervision = true;
```

Replace with:
```typescript
const monitoring: NonNullable<UCCFCareNeeds["monitoring"]> = {};
if (form.monitorSupervision) monitoring.continuous_supervision = true;
```

### 2D. Update the `care_needs` construction

The current block (approximately lines 201–204):
```typescript
const care_needs: UCCFCareNeeds = {};
if (Object.keys(adl).length) care_needs.ADL = adl;
if (Object.keys(monitoring).length) care_needs.monitoring = monitoring;
if (form.companionship) care_needs.companionship = true;
```

Replace with (no `adl` anymore):
```typescript
const care_needs: UCCFCareNeeds = {};
if (Object.keys(monitoring).length) care_needs.monitoring = monitoring;
if (form.companionship) care_needs.companionship = true;
```

### 2E. Update the `medical` construction

Remove `diagnosis` from the condition guard and from the object body. The current block (approximately lines 205–214):

```typescript
const medical: UCCFMedical | undefined =
  form.diagnosis.trim() || form.medicationComplexity || form.devices.length || form.procedures.length
    ? {
        diagnosis: form.diagnosis.trim() || undefined,
        medication_complexity: form.medicationComplexity || undefined,
        devices: form.devices.length ? (form.devices as UCCFMedical["devices"]) : undefined,
        procedures_required: form.procedures.length
          ? (form.procedures as UCCFMedical["procedures_required"])
          : undefined,
      }
    : undefined;
```

Replace with:
```typescript
const medical: UCCFMedical | undefined =
  form.medicationComplexity || form.devices.length || form.procedures.length
    ? {
        medication_complexity: form.medicationComplexity || undefined,
        devices: form.devices.length ? (form.devices as UCCFMedical["devices"]) : undefined,
        procedures_required: form.procedures.length
          ? (form.procedures as UCCFMedical["procedures_required"])
          : undefined,
      }
    : undefined;
```

### 2F. Update the `pricing` submission block

The current pricing object in `pkg` (approximately lines 282–288):

```typescript
pricing: {
  base_price: form.basePrice,
  pricing_model: form.pricingModel,
  included_hours: form.includedHours,
  overtime_rate: form.overtimeRate,
  extra_charges: form.extraCharges,
},
```

Replace with:

```typescript
pricing: {
  base_price: form.basePrice,
  pricing_model: form.pricingModel,
},
```

---

## Part 3 — Step 1 JSX Changes ("Package Information")

### 3A. Remove the entire "Typical client profile" section

Delete the entire `<div>` block that starts at approximately line 401 with:
```tsx
<div className="pt-2 space-y-3" style={{ borderTop: `1px solid ${cn.borderLight}` }}>
  <p className="text-sm font-medium" style={{ color: cn.text }}>Typical client profile (optional)</p>
```

This block contains all of the following children — delete all of them together:
- Age number input (`targetAge`)
- Gender select (`targetGender`)
- Medical Conditions text input (`targetCondition`)
- Care Location select (`locationType`)
- Accommodation/Food checkboxes (`accommodationProvided`, `foodProvided`)
- Travel Distance number input (`travelDistanceKm`)

**Important:** Do NOT delete `locationType`, `accommodationProvided`, `foodProvided`, `travelDistanceKm` from form state — they are being *moved* to Step 3 (see Part 4I below). Only delete the JSX here.

### 3B. Fix hardcoded label strings in Step 1

| Current hardcoded string | Replace with |
|--------------------------|-------------|
| `<h2 ...>Package Information</h2>` | `<h2 ...>{tg("wizard.agencyPackageInfoTitle")}</h2>` |
| `label="Package Title"` | `label={tg("wizard.agencyPackageTitle")}` |
| `label="Care Categories"` | `label={tg("wizard.agencyCareCategories")}` |
| `label="City"` | `label={tg("wizard.agencyCity")}` |
| `label="Duration Type"` | `label={tg("wizard.durationType")}` (key already exists in locale) |

---

## Part 4 — Step 3 JSX Changes ("Services")

Step 3 is the most heavily changed step. The structure after changes:

1. Monitoring & companionship (kept, vitals toggle removed)
2. Medical capability (renamed, diagnosis field removed)
3. **Service logistics** (NEW — moved here from Step 1)
4. Equipment (unchanged)
5. Service checklists (unchanged)
6. Exclusions (unchanged)
7. Add-ons (unchanged)

### 4A. Remove the entire "Daily Living" ADL toggle block

Delete the `<div>` block (approximately lines 498–512) that contains:
- The `<p>` heading using `tg("wizard.dailyLiving")`
- All 6 toggle buttons: adlBathing, feedingOral, feedingTube, toiletingAssisted, toiletingFull, adlMobility

### 4B. Remove the `monitorVitals` button from the monitoring block

In the monitoring/companionship toggle array (approximately lines 503–510), delete only this one entry:
```tsx
{ key: "monitorVitals" as const, label: tg("wizard.monitorVitals") },
```
Keep the `monitorSupervision` and `companionship` entries.

### 4C. Update the monitoring section heading

The heading currently uses `tg("wizard.monitoringCompanionship")` — this key is shared with the guardian wizard. Do not change the shared key. Instead, replace the heading text with the new agency-specific key:

Change:
```tsx
<p className="text-sm font-medium pt-2" style={{ color: cn.text }}>{tg("wizard.monitoringCompanionship")}</p>
```
To:
```tsx
<p className="text-sm font-medium pt-2" style={{ color: cn.text }}>{tg("wizard.agencyMonitoringCapabilityHeading")}</p>
```

### 4D. Remove the `diagnosis` input from the medical section

Delete the entire `PackageWizardInputField` block for diagnosis (approximately lines 515–517):
```tsx
<PackageWizardInputField label={tg("wizard.diagnosis")}>
  <input type="text" value={form.diagnosis} onChange={(e) => update({ diagnosis: e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle} />
</PackageWizardInputField>
```

### 4E. Rename the medical section heading

Change the `<p>` heading for the medical section from:
```tsx
<p className="text-sm font-medium" style={{ color: cn.text }}>{tg("wizard.medicalOptional")}</p>
```
To:
```tsx
<p className="text-sm font-medium" style={{ color: cn.text }}>{tg("wizard.agencyMedicalCapabilityHeading")}</p>
```

### 4F. Update the `medicationComplexity` label

Change:
```tsx
<PackageWizardInputField label={tg("wizard.medicationComplexity")}>
```
To:
```tsx
<PackageWizardInputField label={tg("wizard.agencyMaxMedicationComplexity")}>
```

### 4G. Replace "Prefer not to say" with "Not specified" in two selects

In the `medicationComplexity` select and the `equipmentProvider` select, change the blank/empty option from:
```tsx
<option value="">{tg("wizard.preferNotSay")}</option>
```
To:
```tsx
<option value="">{tg("wizard.agencyNotSpecified")}</option>
```

Do **not** change the `locationType` select at this point — it is being relocated (see 4I below) and its blank option will be updated when it arrives in Step 3.

Do **not** change any usage of `wizard.preferNotSay` in the guardian requirement wizard. That key stays.

### 4H. Update the devices and procedures section headings

Change the `<p>` above the devices checklist from:
```tsx
<p className="text-xs" style={{ color: cn.textSecondary }}>{tg("wizard.devices")}</p>
```
To:
```tsx
<p className="text-xs" style={{ color: cn.textSecondary }}>{tg("wizard.agencyDevicesCapability")}</p>
```

Change the `<p>` above the procedures checklist from:
```tsx
<p className="text-xs" style={{ color: cn.textSecondary }}>{tg("wizard.procedures")}</p>
```
To:
```tsx
<p className="text-xs" style={{ color: cn.textSecondary }}>{tg("wizard.agencyProceduresCapability")}</p>
```

### 4I. Add "Service logistics" subsection (fields moved from Step 1)

Insert the following block into Step 3 JSX, placed **after** the equipment section and **before** the service checklists heading (`agencyPackageServiceChecklistsHeading`):

```tsx
<div className="space-y-3 p-4 rounded-xl" style={{ background: cn.bgInput, border: `1px solid ${cn.borderLight}` }}>
  <p className="text-sm font-medium" style={{ color: cn.text }}>{tg("wizard.agencyServiceLogisticsHeading")}</p>
  <PackageWizardInputField label={tg("wizard.locationType")}>
    <select value={form.locationType} onChange={(e) => update({ locationType: e.target.value as typeof form.locationType })} className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle}>
      <option value="">{tg("wizard.agencyNotSpecified")}</option>
      <option value="home">{tg("wizard.locationHome")}</option>
      <option value="hospital">{tg("wizard.locationHospital")}</option>
    </select>
  </PackageWizardInputField>
  <div className="flex flex-wrap gap-3">
    <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: cn.text }}>
      <input type="checkbox" checked={form.accommodationProvided} onChange={(e) => update({ accommodationProvided: e.target.checked })} className="rounded" />
      {tg("wizard.accommodationProvided")}
    </label>
    <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: cn.text }}>
      <input type="checkbox" checked={form.foodProvided} onChange={(e) => update({ foodProvided: e.target.checked })} className="rounded" />
      {tg("wizard.foodProvided")}
    </label>
  </div>
  <PackageWizardInputField label={tg("wizard.travelDistanceKm")}>
    <input type="number" min={0} value={form.travelDistanceKm} onChange={(e) => update({ travelDistanceKm: e.target.value })} className="w-full px-4 py-3 rounded-xl border text-sm" style={inputStyle} />
  </PackageWizardInputField>
</div>
```

---

## Part 5 — Step 2 JSX Changes ("Staffing")

### 5A. Fix hardcoded label strings in Step 2

| Current hardcoded string | Replace with |
|--------------------------|-------------|
| `label="Caregivers"` | `label={tg("wizard.agencyCaregiversCount")}` |
| `label="Nurses"` | `label={tg("wizard.agencyNursesCount")}` |
| `label="Gender Preference"` | `label={tg("wizard.agencyGenderPreference")}` |
| `label="Min Experience (years)"` | `label={tg("wizard.agencyMinExperience")}` |
| `<option value="none">No Preference</option>` | `<option value="none">{tg("wizard.agencyNoGenderPreference")}</option>` |

### 5B. Fix the staffLevel L2 sub-label

In the L1–L4 button grid (approximately lines 460–468), find the inline ternary:
```tsx
{l === "L1" ? "Caregiver" : l === "L2" ? "Trained" : l === "L3" ? "Nurse" : "ICU Nurse"}
```
Change to:
```tsx
{l === "L1" ? "Caregiver" : l === "L2" ? "Trained Caregiver" : l === "L3" ? "Nurse" : "ICU Nurse"}
```

### 5C. Add the certifications UI

`certifications` exists in form state but has no UI. Add the following block as the last `PackageWizardInputField` in Step 2, after the Min Experience field:

```tsx
<PackageWizardInputField label={tg("wizard.agencyCertifications")}>
  <p className="text-xs mb-2 leading-relaxed" style={{ color: cn.textSecondary }}>
    {tg("wizard.agencyCertificationsHelp")}
  </p>
  <div className="flex flex-wrap gap-2">
    {(["BNMC", "CPR", "BLS", "Wound Care", "Physiotherapy Assist"] as const).map((cert) => (
      <button
        key={cert}
        type="button"
        onClick={() => update({ certifications: toggleArray(form.certifications, cert) })}
        className="px-3 py-2 rounded-xl border text-xs cn-touch-target"
        style={{
          borderColor: form.certifications.includes(cert) ? cn.teal : cn.border,
          background: form.certifications.includes(cert) ? cn.tealBg : "transparent",
          color: form.certifications.includes(cert) ? cn.teal : cn.textSecondary,
        }}
      >
        {cert}
      </button>
    ))}
  </div>
</PackageWizardInputField>
```

---

## Part 6 — Step 4 JSX Changes ("Schedule")

### 6A. Fix hardcoded label strings in Step 4

| Current hardcoded string | Replace with |
|--------------------------|-------------|
| `<h2 ...>Schedule</h2>` | `<h2 ...>{tg("wizard.agencyScheduleTitle")}</h2>` |
| `label="Hours Per Day"` | `label={tg("wizard.agencyHoursPerDay")}` |
| `label="Shift Type"` | `label={tg("wizard.agencyShiftType")}` |
| `label="Staff Pattern"` | `label={tg("wizard.agencyStaffPattern")}` |
| `<option value="single">Single Staff</option>` | `<option value="single">{tg("wizard.staffPattern_single")}</option>` |
| `<option value="double">Double Staff</option>` | `<option value="double">{tg("wizard.staffPattern_double")}</option>` |
| `<option value="rotational_team">Rotational Team</option>` | `<option value="rotational_team">{tg("wizard.staffPattern_rotational_team")}</option>` |

For the shift type buttons, the current code uses:
```tsx
{t.charAt(0).toUpperCase() + t.slice(1)}
```
Replace with:
```tsx
{tg(`wizard.shiftType_${t}`)}
```
These keys (`wizard.shiftType_day`, `wizard.shiftType_night`, `wizard.shiftType_rotational`) already exist in the locale file.

### 6B. Fix the `hoursPerDay` button sub-labels

Find the inline ternary (approximately line 626):
```tsx
{h === 8 ? "Day Shift" : h === 12 ? "Half Day" : "24/7 Care"}
```
Replace with:
```tsx
{h === 8 ? tg("wizard.agencyHours8Sub") : h === 12 ? tg("wizard.agencyHours12Sub") : tg("wizard.agencyHours24Sub")}
```

---

## Part 7 — Step 5 JSX Changes ("Pricing & SLA")

### 7A. Remove the `includedHours` and `overtimeRate` input fields

Find and delete the entire `<div className="grid grid-cols-2 gap-4">` block that contains both the "Included Hours" and "Overtime Rate (BDT/hr)" inputs (approximately lines 660–668). This is the only two-column grid in Step 5 that appears between the Pricing Model select and the SLA heading. Delete it entirely.

### 7B. Fix hardcoded label strings in Step 5

| Current hardcoded string | Replace with |
|--------------------------|-------------|
| `<h2 ...>Pricing & SLA</h2>` | `<h2 ...>{tg("wizard.agencyPricingSLATitle")}</h2>` |
| `label="Base Price (BDT)"` | `label={tg("wizard.agencyBasePrice")}` |
| `label="Pricing Model"` | `label={tg("wizard.agencyPricingModel")}` |
| `<option value="monthly">Monthly</option>` (pricing) | `<option value="monthly">{tg("wizard.modelMonthly")}</option>` |
| `<option value="daily">Daily</option>` (pricing) | `<option value="daily">{tg("wizard.modelDaily")}</option>` |
| `<option value="hourly">Hourly</option>` (pricing) | `<option value="hourly">{tg("wizard.modelHourly")}</option>` |
| `<h3 ...>Service Level Agreement</h3>` | `<h3 ...>{tg("wizard.agencySLAHeading")}</h3>` |
| `label="Replacement Time (hours)"` | `label={tg("wizard.agencyReplacementHours")}` |
| `label="Emergency Response (min)"` | `label={tg("wizard.agencyEmergencyMinutes")}` |
| `label="Attendance Guarantee (%)"` | `label={tg("wizard.agencyAttendancePercent")}` |
| `label="Reporting Frequency"` | `label={tg("wizard.agencyReportingFreq")}` |
| `<option value="daily">Daily</option>` (reporting) | `<option value="daily">{tg("wizard.agencyReportingDaily")}</option>` |
| `<option value="weekly">Weekly</option>` (reporting) | `<option value="weekly">{tg("wizard.agencyReportingWeekly")}</option>` |
| `<h3 ...>Compliance & Trust</h3>` | `<h3 ...>{tg("wizard.agencyComplianceHeading")}</h3>` |
| `label: "Background Verified"` | `label: tg("wizard.agencyBackgroundVerified")` |
| `label: "Medical Fitness Certified"` | `label: tg("wizard.agencyMedicalFit")` |
| `label: "Contract Required"` | `label: tg("wizard.agencyContractRequired")` |
| `label: "Trial Period Available"` | `label: tg("wizard.agencyTrialAvailable")` |

---

## Part 8 — Step 6 Review JSX Changes

### 8A. Remove the `agencyReviewClientCondition` row

Find and delete the following conditional spread from the review rows array:
```tsx
...(form.targetCondition.trim()
  ? [{ label: tg("wizard.agencyReviewClientCondition"), value: form.targetCondition.trim() }]
  : []),
```

### 8B. Add new review rows

After the existing SLA row, add the following rows to the same array. Each uses conditional spreading so the row only appears when the value is non-empty:

```tsx
...(form.certifications.length
  ? [{ label: tg("wizard.agencyReviewCertifications"), value: form.certifications.join(", ") }]
  : []),
{ label: tg("wizard.agencyReviewPricingModel"), value: tg(`wizard.model${form.pricingModel.charAt(0).toUpperCase() + form.pricingModel.slice(1)}`) },
...(form.locationType
  ? [{ label: tg("wizard.agencyReviewLocation"), value: tg(`wizard.location${form.locationType.charAt(0).toUpperCase() + form.locationType.slice(1)}`) }]
  : []),
...(form.accommodationProvided || form.foodProvided
  ? [{
      label: tg("wizard.agencyReviewLogistics"),
      value: [
        form.accommodationProvided ? tg("wizard.accommodationProvided") : null,
        form.foodProvided ? tg("wizard.foodProvided") : null,
      ].filter(Boolean).join(", "),
    }]
  : []),
...(form.travelDistanceKm
  ? [{ label: tg("wizard.travelDistanceKm"), value: `${form.travelDistanceKm} km` }]
  : []),
...(form.medicationComplexity
  ? [{ label: tg("wizard.agencyMaxMedicationComplexity"), value: form.medicationComplexity }]
  : []),
...(form.devices.length
  ? [{ label: tg("wizard.agencyDevicesCapability"), value: form.devices.join(", ") }]
  : []),
...(form.procedures.length
  ? [{ label: tg("wizard.agencyProceduresCapability"), value: form.procedures.map((p) => p.replace(/_/g, " ")).join(", ") }]
  : []),
...(form.equipmentSlugs.length
  ? [{ label: tg("wizard.equipment"), value: form.equipmentSlugs.map((s) => s.replace(/_/g, " ")).join(", ") }]
  : []),
...(form.monitorSupervision || form.companionship
  ? [{
      label: tg("wizard.agencyMonitoringCapabilityHeading"),
      value: [
        form.monitorSupervision ? tg("wizard.continuousSupervision") : null,
        form.companionship ? tg("wizard.companionship") : null,
      ].filter(Boolean).join(", "),
    }]
  : []),
...(form.exclusions.length
  ? [{ label: tg("wizard.exclusions"), value: form.exclusions.map((e) => e.replace(/_/g, " ")).join(", ") }]
  : []),
...(form.addOns.length
  ? [{ label: tg("wizard.addOns"), value: form.addOns.map((a) => a.replace(/_/g, " ")).join(", ") }]
  : []),
```

---

## Part 9 — Step Indicator Labels

The `steps` array is currently at module scope (lines 47–54), outside the component function. Because it uses hardcoded strings, it cannot call `tg()`.

**Move the entire `steps` array inside the `AgencyPackageCreatePage` component function body**, placing it immediately after the `const { t: tg } = useTranslation("guardian")` line. Then replace all six `name` strings:

```tsx
const steps = [
  { id: 1, name: tg("wizard.agencyStepPackageInfo"), icon: FileText },
  { id: 2, name: tg("wizard.agencyStepStaffing"), icon: Users },
  { id: 3, name: tg("wizard.agencyStepServices"), icon: ClipboardCheck },
  { id: 4, name: tg("wizard.agencyStepSchedule"), icon: Calendar },
  { id: 5, name: tg("wizard.agencyStepPricing"), icon: DollarSign },
  { id: 6, name: tg("wizard.agencyStepReview"), icon: Star },
];
```

---

## Part 10 — Inline Validation Additions

### 10A. Replace the `next()` function

The current `next()` function (approximately lines 159–165) only validates service areas on Step 1. Replace the entire function body:

```tsx
const next = () => {
  if (step === 1) {
    if (form.title.trim().length < 5) {
      toast.error(tg("wizard.agencyTitleTooShort"));
      return;
    }
    if (form.categories.length === 0) {
      toast.error(tg("wizard.agencyCategoriesRequired"));
      return;
    }
    if (form.serviceAreas.length === 0) {
      toast.error(tg("wizard.agencyServiceAreasRequired"));
      return;
    }
  }
  if (step === 5 && form.basePrice <= 0) {
    toast.error(tg("wizard.agencyBasePriceRequired"));
    return;
  }
  setStep((s) => Math.min(s + 1, 6));
};
```

### 10B. Simplify `handlePublish` validation block

Since title, categories, and service areas are now validated in `next()` before the user can ever reach Step 6, remove their duplicate checks from the top of `handlePublish` (approximately lines 169–185). Keep only the phone number check. The top of `handlePublish` should become:

```tsx
const handlePublish = async () => {
  const phone = user?.phone?.trim();
  if (!phone) {
    toast.error(tg("wizard.agencyPhoneRequired"));
    return;
  }
  const agencyName = user?.name?.trim() || "Agency";
  // ... rest of the function unchanged
};
```

---

## Part 11 — i18n File Updates

### 11A. Keys to ADD to `src/locales/en/guardian.json`

Open the file and locate the `"wizard"` object. It ends just before `"patientIntake"`. Insert all of the following new keys at the end of the `"wizard"` object, before its closing `}`. Do not modify any existing key.

```json
"agencyPackageInfoTitle": "Package Information",
"agencyPackageTitle": "Package title",
"agencyCareCategories": "Care categories",
"agencyCity": "City",
"agencyNotSpecified": "Not specified",
"agencyServiceLogisticsHeading": "Service logistics",
"agencyMonitoringCapabilityHeading": "Monitoring & companionship capability",
"agencyMedicalCapabilityHeading": "Medical capability (optional)",
"agencyMaxMedicationComplexity": "Max medication complexity we handle",
"agencyDevicesCapability": "Medical devices our staff can work with",
"agencyProceduresCapability": "Procedures our staff can perform",
"agencyCaregiversCount": "Number of caregivers",
"agencyNursesCount": "Number of nurses",
"agencyGenderPreference": "Caregiver gender preference",
"agencyNoGenderPreference": "No preference",
"agencyMinExperience": "Minimum experience (years)",
"agencyCertifications": "Required certifications",
"agencyCertificationsHelp": "Select certifications all staff must hold for this package",
"agencyScheduleTitle": "Schedule",
"agencyHoursPerDay": "Hours per day",
"agencyHours8Sub": "Part-day",
"agencyHours12Sub": "Full shift",
"agencyHours24Sub": "Round-the-clock",
"agencyShiftType": "Shift timing",
"agencyStaffPattern": "Staff coverage pattern",
"agencyPricingSLATitle": "Pricing & Service Level",
"agencyBasePrice": "Base price (BDT)",
"agencyPricingModel": "Billing cycle",
"agencySLAHeading": "Service Level Agreement",
"agencyReplacementHours": "Staff replacement time (hours)",
"agencyEmergencyMinutes": "Emergency response time (minutes)",
"agencyAttendancePercent": "Attendance guarantee (%)",
"agencyReportingFreq": "Progress reporting frequency",
"agencyReportingDaily": "Daily",
"agencyReportingWeekly": "Weekly",
"agencyComplianceHeading": "Compliance & Trust",
"agencyBackgroundVerified": "Background verified",
"agencyMedicalFit": "Medical fitness certified",
"agencyContractRequired": "Contract provided",
"agencyTrialAvailable": "Trial period available",
"agencyBasePriceRequired": "Enter a base price greater than zero before continuing.",
"agencyReviewCertifications": "Required certifications",
"agencyReviewPricingModel": "Billing cycle",
"agencyReviewLocation": "Care location",
"agencyReviewLogistics": "Logistics",
"agencyStepPackageInfo": "Package Info",
"agencyStepStaffing": "Staffing",
"agencyStepServices": "Services",
"agencyStepSchedule": "Schedule",
"agencyStepPricing": "Pricing",
"agencyStepReview": "Review"
```

### 11B. Keys to ADD to `src/locales/bn/guardian.json`

Add the same keys inside the `"wizard"` object with Bengali translations:

```json
"agencyPackageInfoTitle": "প্যাকেজের তথ্য",
"agencyPackageTitle": "প্যাকেজের শিরোনাম",
"agencyCareCategories": "সেবার ধরন",
"agencyCity": "শহর",
"agencyNotSpecified": "উল্লেখ নেই",
"agencyServiceLogisticsHeading": "সেবার লজিস্টিক্স",
"agencyMonitoringCapabilityHeading": "পর্যবেক্ষণ ও সঙ্গদান সক্ষমতা",
"agencyMedicalCapabilityHeading": "চিকিৎসা সক্ষমতা (ঐচ্ছিক)",
"agencyMaxMedicationComplexity": "সর্বোচ্চ ওষুধ জটিলতা যা আমরা সামলাতে পারি",
"agencyDevicesCapability": "আমাদের কর্মীরা যে মেডিকেল ডিভাইস নিয়ে কাজ করতে পারেন",
"agencyProceduresCapability": "আমাদের কর্মীরা যে প্রক্রিয়া সম্পাদন করতে পারেন",
"agencyCaregiversCount": "কেয়ারগিভারের সংখ্যা",
"agencyNursesCount": "নার্সের সংখ্যা",
"agencyGenderPreference": "কেয়ারগিভারের লিঙ্গ পছন্দ",
"agencyNoGenderPreference": "কোনো পছন্দ নেই",
"agencyMinExperience": "ন্যূনতম অভিজ্ঞতা (বছর)",
"agencyCertifications": "প্রয়োজনীয় সার্টিফিকেশন",
"agencyCertificationsHelp": "এই প্যাকেজের জন্য সকল কর্মীর যে সার্টিফিকেশন থাকতে হবে তা নির্বাচন করুন",
"agencyScheduleTitle": "সময়সূচি",
"agencyHoursPerDay": "প্রতিদিনের ঘণ্টা",
"agencyHours8Sub": "আংশিক দিন",
"agencyHours12Sub": "পূর্ণ শিফট",
"agencyHours24Sub": "চব্বিশ ঘণ্টা",
"agencyShiftType": "শিফটের সময়",
"agencyStaffPattern": "কর্মী কভারেজ ধরন",
"agencyPricingSLATitle": "মূল্য ও সেবার মান",
"agencyBasePrice": "মূল মূল্য (টাকা)",
"agencyPricingModel": "বিলিং চক্র",
"agencySLAHeading": "সেবার স্তরের চুক্তি",
"agencyReplacementHours": "কর্মী প্রতিস্থাপনের সময় (ঘণ্টা)",
"agencyEmergencyMinutes": "জরুরি প্রতিক্রিয়ার সময় (মিনিট)",
"agencyAttendancePercent": "উপস্থিতির গ্যারান্টি (%)",
"agencyReportingFreq": "অগ্রগতি রিপোর্টের ফ্রিকোয়েন্সি",
"agencyReportingDaily": "প্রতিদিন",
"agencyReportingWeekly": "সাপ্তাহিক",
"agencyComplianceHeading": "সম্মতি ও বিশ্বাস",
"agencyBackgroundVerified": "ব্যাকগ্রাউন্ড যাচাই করা হয়েছে",
"agencyMedicalFit": "চিকিৎসাগতভাবে সুস্থ সার্টিফাইড",
"agencyContractRequired": "চুক্তি প্রদান করা হয়",
"agencyTrialAvailable": "ট্রায়াল পিরিয়ড পাওয়া যাবে",
"agencyBasePriceRequired": "এগিয়ে যাওয়ার আগে শূন্যের বেশি মূল মূল্য লিখুন।",
"agencyReviewCertifications": "প্রয়োজনীয় সার্টিফিকেশন",
"agencyReviewPricingModel": "বিলিং চক্র",
"agencyReviewLocation": "সেবার স্থান",
"agencyReviewLogistics": "লজিস্টিক্স",
"agencyStepPackageInfo": "প্যাকেজ তথ্য",
"agencyStepStaffing": "কর্মী",
"agencyStepServices": "সেবা",
"agencyStepSchedule": "সময়সূচি",
"agencyStepPricing": "মূল্য",
"agencyStepReview": "পর্যালোচনা"
```

---

## Part 12 — Import Cleanup in AgencyPackageCreatePage.tsx

After all deletions, verify that no type imports became unused. All imports in the current file remain in use:

- `UCCFCareNeeds` — still used (monitoring + companionship in care_needs block). **Keep.**
- `UCCFMedical` — still used (medication_complexity + devices + procedures). **Keep.**
- `UCCFEquipment` — still used. **Keep.**
- `UCCFLogistics` — still used. **Keep.**
- `HoursPerDay` — still used. **Keep.**
- `ShiftType` — still used. **Keep.**
- `PricingModel` — still used. **Keep.**
- `StaffLevel` — still used. **Keep.**
- `CareCategory` — still used. **Keep.**

No imports need to be added or removed.

---

## Part 13 — Field Spec Doc Update

Update `src/imports/agency-package-create-wizard-fields.json`:

1. **Step 1 field list** — Remove entries for: `targetAge`, `targetGender`, `targetCondition`, `locationType`, `accommodationProvided`, `foodProvided`, `travelDistanceKm`
2. **Step 2 field list** — Update the `certifications` entry: change `"control": "unused in current UI"` to `"control": "multi-toggle (predefined: BNMC, CPR, BLS, Wound Care, Physiotherapy Assist)"`
3. **Step 3 field list** — Remove entries for: `adlBathing`, `feedingOral`, `feedingTube`, `toiletingAssisted`, `toiletingFull`, `adlMobility`, `monitorVitals`, `diagnosis`. Add new entries for the relocated logistics fields: `locationType`, `accommodationProvided`, `foodProvided`, `travelDistanceKm`
4. **Step 5 field list** — Remove entries for: `includedHours`, `overtimeRate`, `extraCharges`
5. **`$comment`** — Update to: `"Field inventory for AgencyPackageCreatePage (/agency/package-create). Refactored to remove demand-side patient fields, merge ADL duplicates into service checklists, remove unenforced pricing fields, and add certifications UI."`

---

## Part 14 — What NOT to Change

The following files are explicitly out of scope. Do not open or modify them:

1. **`src/backend/domain/uccf/`** — Do not touch any validation, mapper, or model files. `UCCFPricingOffer` intentionally retains `included_hours`, `overtime_rate`, `extra_charges` — the backend model is more permissive than the form.
2. **`src/frontend/pages/guardian/PackageDetailPage.tsx`** — Already handles missing `included_hours`, `overtime_rate`, and `care_subject` with null checks. No changes needed.
3. **`src/frontend/pages/guardian/CareRequirementWizardPage.tsx`** — Correctly uses `targetAge`, `targetGender`, `diagnosis` etc. on the demand side. Do not touch it.
4. **`supabase/`** — No migrations, no edge function changes.
5. **`src/backend/api/mock/uccfMocks.ts`** — Mock data retains `overtime_rate`, `included_hours`, `extra_charges`. PackageDetailPage still renders them if present in existing records.
6. **`src/locales/en/guardian.json` existing keys** — Only ADD new keys. Do not rename or delete anything. All existing keys are still in use by the guardian requirement wizard.
7. **`src/frontend/pages/agency/__tests__/AgencyPackageCreatePage.test.tsx`** — The test file will need updating after this refactor but is a separate follow-up task. Do not touch it now.

---

## Summary Checklist

Work through this list in order. Each item maps to its Part above.

- [ ] **Form state** — Remove 14 keys from `useState` initializer (Part 1A)
- [ ] **Form state** — Change `city` default to `""` and `serviceAreas` default to `[]` (Part 1C)
- [ ] **handlePublish** — Remove `care_subject` variable and its property in `pkg` (Part 2A)
- [ ] **handlePublish** — Remove entire `adl` variable declaration block (Part 2B)
- [ ] **handlePublish** — Remove `monitoring.vitals` line (Part 2C)
- [ ] **handlePublish** — Remove `care_needs.ADL = adl` line (Part 2D)
- [ ] **handlePublish** — Update medical block: remove `diagnosis.trim()` guard and `diagnosis:` property (Part 2E)
- [ ] **handlePublish** — Update pricing object: remove `included_hours`, `overtime_rate`, `extra_charges` (Part 2F)
- [ ] **Step 1 JSX** — Delete entire "Typical client profile" `<div>` block (Part 3A)
- [ ] **Step 1 JSX** — Replace 5 hardcoded label strings with `tg()` calls (Part 3B)
- [ ] **Step 3 JSX** — Delete the 6-button "Daily Living" ADL block (Part 4A)
- [ ] **Step 3 JSX** — Remove `monitorVitals` entry from monitoring button array (Part 4B)
- [ ] **Step 3 JSX** — Change monitoring heading key to `agencyMonitoringCapabilityHeading` (Part 4C)
- [ ] **Step 3 JSX** — Delete diagnosis `PackageWizardInputField` block (Part 4D)
- [ ] **Step 3 JSX** — Change medical section heading key to `agencyMedicalCapabilityHeading` (Part 4E)
- [ ] **Step 3 JSX** — Change medicationComplexity label key to `agencyMaxMedicationComplexity` (Part 4F)
- [ ] **Step 3 JSX** — Replace "Prefer not to say" with `agencyNotSpecified` in 2 selects (Part 4G)
- [ ] **Step 3 JSX** — Change devices and procedures heading keys (Part 4H)
- [ ] **Step 3 JSX** — Insert "Service logistics" subsection block (Part 4I)
- [ ] **Step 2 JSX** — Replace 5 hardcoded label strings (Part 5A)
- [ ] **Step 2 JSX** — Change L2 sub-label from `"Trained"` to `"Trained Caregiver"` (Part 5B)
- [ ] **Step 2 JSX** — Add certifications multi-toggle UI after Min Experience field (Part 5C)
- [ ] **Step 4 JSX** — Replace 7 hardcoded label strings and fix shift button rendering (Part 6A)
- [ ] **Step 4 JSX** — Fix 3 hoursPerDay sub-labels (Part 6B)
- [ ] **Step 5 JSX** — Delete includedHours + overtimeRate grid block (Part 7A)
- [ ] **Step 5 JSX** — Replace 18 hardcoded label strings (Part 7B)
- [ ] **Step 6 JSX** — Remove `agencyReviewClientCondition` row (Part 8A)
- [ ] **Step 6 JSX** — Add 12 new conditional review rows (Part 8B)
- [ ] **Step indicator** — Move `steps` array inside component, replace 6 name strings (Part 9)
- [ ] **Validation** — Replace `next()` with version that validates Steps 1 and 5 (Part 10A)
- [ ] **Validation** — Remove redundant title/category/service-area checks from `handlePublish` (Part 10B)
- [ ] **en/guardian.json** — Add 36 new keys at end of `"wizard"` object (Part 11A)
- [ ] **bn/guardian.json** — Add matching 36 Bengali keys at end of `"wizard"` object (Part 11B)
- [ ] **Field spec doc** — Update `agency-package-create-wizard-fields.json` (Part 13)
