# Care Requirement Wizard — Agent Implementation Plan

## Already Done (do not redo)

| # | File | Change |
|---|------|--------|
| ✅ | `supabase/migrations/20260425080000_add_patient_clinical_fields.sql` | Adds `mobility`, `cognitive`, `care_city`, `care_area` columns to `patients` |
| ✅ | `src/backend/models/uccf.model.ts` | Added `shift_start_time?: string` to `UCCFSchedule` interface |
| ✅ | `src/backend/services/guardian.service.ts` | `getPatients()` now maps `mobility`, `cognitive`, `careCity`, `careArea`, `conditionNotes` from DB rows |

---

## Task 1 — `PatientIntakePage.tsx`

**File:** `src/frontend/pages/guardian/PatientIntakePage.tsx`

### New fields to add to `formData` state

```ts
{
  // existing fields kept unchanged:
  name: "",
  relationship: "",
  age: "",
  gender: "",
  conditions: [] as string[],
  conditionNotes: "",
  emergencyName: "",
  emergencyPhone: "",

  // NEW:
  mobility: "" as "" | "independent" | "assisted" | "bedridden",
  cognitive: "" as "" | "normal" | "impaired" | "dependent",
  careCity: "Dhaka",
  careArea: "",
  bloodGroup: "" as "" | "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-",
}
```

### Load on edit — add to the existing `useEffect` that reads from Supabase

```ts
mobility: data.mobility || "",
cognitive: data.cognitive || "",
careCity: data.care_city || "Dhaka",
careArea: data.care_area || "",
bloodGroup: data.blood_group || "",
```

### Save — add to both `sb().from("patients").update(...)` and `.insert(...)` calls

```ts
mobility: formData.mobility || null,
cognitive: formData.cognitive || null,
care_city: formData.careCity.trim() || null,
care_area: formData.careArea.trim() || null,
blood_group: formData.bloodGroup || null,
```

### UI to add — insert a new section between "Medical Condition" and "Emergency Contact"

Section heading: **"Mobility & Awareness"** (icon: `Activity`)

**Mobility** — 3 chip-buttons (full width row), single select:
- `"independent"` → label: **"Walks independently"**
- `"assisted"` → label: **"Needs assistance"**
- `"bedridden"` → label: **"Fully bedridden"**

**Cognitive status** — 3 chip-buttons (full width row), single select:
- `"normal"` → label: **"Alert & oriented"**
- `"impaired"` → label: **"Memory impaired"**
- `"dependent"` → label: **"Fully dependent"**

Then a **"Care Location"** section (icon: `MapPin`):
- **City** — text input, defaulted to "Dhaka"
- **Area / Neighbourhood** — text input, placeholder "e.g. Dhanmondi, Gulshan"
- Helper text: *"Where will the patient receive care? This pre-fills your care requests."*

Then **Blood Group** — a `<select>` dropdown with options: `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`, plus empty "Select…".

**Remove** the auto-populate hack in `toggleCondition` that prepends "Selected conditions: ..." into `conditionNotes`. Just toggle conditions and leave notes alone.

Add hint text below `conditionNotes` textarea: *"Include medication schedule or special instructions if relevant."*

---

## Task 2 — `CareRequirementWizardPage.tsx`

**File:** `src/frontend/pages/guardian/CareRequirementWizardPage.tsx`

This is a full rewrite of the step content only. The outer shell (step indicator, nav buttons, pre-wizard choice screen, submit handler structure) stays.

---

### 2a. Update `steps` array (line 35–42)

Replace with:
```ts
const steps = [
  { id: 1, name: "Agency",    icon: Building2 },
  { id: 2, name: "Patient",   icon: User },
  { id: 3, name: "Care Needs", icon: HeartPulse },
  { id: 4, name: "Schedule",  icon: Calendar },
  { id: 5, name: "Budget",    icon: Wallet },
  { id: 6, name: "Review",    icon: ClipboardCheck },
];
```

Step count stays at 6. Step 1 (agency) is unchanged.

---

### 2b. Replace `formData` state (lines 80–132)

Remove all fields and replace with this exact shape:

```ts
const [formData, setFormData] = useState({
  // Step 2 — location override (pre-filled from patient record)
  city: "Dhaka",
  area: "",
  locationType: "" as "" | "home" | "hospital",

  // Step 3 — unified service checklist (replaces ADL toggles + bucket chips)
  services: [] as string[],          // slugs from UNIFIED_SERVICES
  devices: [] as string[],           // UCCF_MEDICAL_DEVICES slugs
  procedures: [] as string[],        // UCCF_MEDICAL_PROCEDURES slugs
  medicationComplexity: "" as "" | "low" | "medium" | "high",
  equipment: [] as string[],         // UCCF_EQUIPMENT_SLUGS
  equipmentProvider: "" as "" | "patient" | "agency" | "mixed",
  exclusions: [] as string[],
  addOns: [] as string[],

  // Step 4 — schedule & staffing
  startDate: "",
  durationType: "monthly" as "short" | "monthly" | "long_term",
  shiftType: "day" as ShiftType,
  hoursPerDay: 8 as 8 | 12 | 24,
  shiftStartTime: "",               // HH:MM, only for 8h/12h
  staffLevel: "L2" as StaffLevel,
  staffPattern: "single" as StaffPattern,
  caregiverCount: 1,
  nurseCount: 0,

  // Step 5 — budget & posting
  preferredModel: "monthly" as "monthly" | "daily" | "hourly",
  budgetMin: "",
  budgetMax: "",
  accommodationProvided: false,
  foodProvided: false,
  travelDistanceKm: "",
  expiryDays: "15",
});
```

Also keep existing top-level state:
```ts
const [selectedAgency, setSelectedAgency] = useState(preselectedAgency || "");
const [selectedCareTypes, setSelectedCareTypes] = useState<CareCategory[]>([]);
const [selectedPatientId, setSelectedPatientId] = useState<string>("");
const [postToMarketplace, setPostToMarketplace] = useState(skipChoice);
```

**Remove** `contactName`, `contactPhone`, `patientName`, `patientAge`, `gender`, `conditions`, `notes`, `mobility`, `cognitive`, `riskLevel`, `diagnosis`, `adlBathing`, `feedingOral`, `feedingTube`, `toiletingAssisted`, `toiletingFull`, `adlMobility`, `monitorVitals`, `monitorSupervision`, `companionship`, `personal_care`, `medical_support`, `household_support`, `advanced_care`, `coordination` from formData entirely.

---

### 2c. Add UNIFIED_SERVICES constant (add near top of file after imports)

```ts
/** Single source of truth for Step 3 service chips. Each entry maps to a UCCF bucket + optional ADL/monitoring field. */
const UNIFIED_SERVICES = [
  // personal_care
  { slug: "bathing",           label: "Bathing",              group: "Daily Living" },
  { slug: "grooming",          label: "Grooming",             group: "Daily Living" },
  { slug: "feeding_oral",      label: "Oral feeding",         group: "Daily Living" },
  { slug: "feeding_tube",      label: "Tube feeding",         group: "Daily Living" },
  { slug: "toileting_assisted",label: "Toileting (assisted)", group: "Daily Living" },
  { slug: "toileting_full",    label: "Full toileting care",  group: "Daily Living" },
  { slug: "mobility_support",  label: "Mobility support",     group: "Daily Living" },
  // medical_support
  { slug: "vitals",            label: "Vitals monitoring",    group: "Medical Support" },
  { slug: "medication",        label: "Medication management",group: "Medical Support" },
  { slug: "wound_care",        label: "Wound dressing",       group: "Medical Support" },
  { slug: "supervision",       label: "Continuous supervision",group: "Medical Support" },
  { slug: "companionship",     label: "Companionship",        group: "Medical Support" },
  // household_support
  { slug: "meal_prep",         label: "Meal preparation",     group: "Household" },
  { slug: "patient_laundry",   label: "Patient laundry",      group: "Household" },
  // advanced_care
  { slug: "NG_tube",           label: "NG tube care",         group: "Advanced Care" },
  { slug: "suction",           label: "Suctioning",           group: "Advanced Care" },
  { slug: "oxygen_therapy",    label: "Oxygen therapy",       group: "Advanced Care" },
  // coordination
  { slug: "doctor_visit",      label: "Doctor visit escort",  group: "Coordination" },
  { slug: "hospital_support",  label: "Hospital support",     group: "Coordination" },
] as const;
```

---

### 2d. Update UCCF payload builder in `handleSubmit`

Replace the ADL / monitoring / services building logic with this mapping:

```ts
const sel = formData.services;

// Build ADL
const adl: NonNullable<UCCFCareNeeds["ADL"]> = {};
if (sel.includes("bathing"))           adl.bathing = true;
if (sel.includes("feeding_tube"))      adl.feeding = "tube";
else if (sel.includes("feeding_oral")) adl.feeding = "oral";
if (sel.includes("toileting_full"))    adl.toileting = "full";
else if (sel.includes("toileting_assisted")) adl.toileting = "assisted";
if (sel.includes("mobility_support"))  adl.mobility_support = true;

// Build monitoring
const monitoring: NonNullable<UCCFCareNeeds["monitoring"]> = {};
if (sel.includes("vitals"))      monitoring.vitals = true;
if (sel.includes("supervision")) monitoring.continuous_supervision = true;

// Build care_needs
const care_needs: UCCFCareNeeds = {};
if (Object.keys(adl).length)        care_needs.ADL = adl;
if (Object.keys(monitoring).length) care_needs.monitoring = monitoring;
if (sel.includes("companionship"))  care_needs.companionship = true;

// Build services (bucket arrays — exclude ADL/monitoring slugs already handled above)
const services: UCCFServices = {};
const PC = ["bathing","grooming","feeding_oral","feeding_tube","toileting_assisted","toileting_full","mobility_support"];
const MS = ["vitals","medication","wound_care","supervision","companionship"];
const HS = ["meal_prep","patient_laundry"];
const AC = ["NG_tube","suction","oxygen_therapy"];
const CO = ["doctor_visit","hospital_support"];
const pcSlugs = sel.filter(s => PC.includes(s)).map(s => s === "feeding_oral" ? "feeding_oral" : s);
const msSlugs = sel.filter(s => MS.includes(s));
const hsSlugs = sel.filter(s => HS.includes(s));
const acSlugs = sel.filter(s => AC.includes(s));
const coSlugs = sel.filter(s => CO.includes(s));
if (pcSlugs.length) services.personal_care   = pcSlugs;
if (msSlugs.length) services.medical_support  = msSlugs;
if (hsSlugs.length) services.household_support = hsSlugs;
if (acSlugs.length) services.advanced_care    = acSlugs;
if (coSlugs.length) services.coordination     = coSlugs;
```

For the schedule section of the payload, add:
```ts
schedule: {
  hours_per_day: formData.hoursPerDay,
  shift_type: formData.shiftType,
  staff_pattern: formData.staffPattern,
  shift_start_time: (formData.hoursPerDay < 24 && formData.shiftStartTime)
    ? formData.shiftStartTime
    : undefined,
},
```

For `party` (contact info), read from the user profile silently — no form fields:
```ts
party: {
  role: "patient",
  name: user?.name?.trim() || "",
  contact_phone: user?.phone?.trim() || "",
},
```

For `care_subject`, read from the selected patient record:
```ts
// Look up selected patient
const pt = myPatients?.find(p => p.id === selectedPatientId);
care_subject: {
  age: pt?.age ?? 0,
  gender: pt?.gender
    ? (pt.gender === "Male" ? "male" : pt.gender === "Female" ? "female" : "other")
    : undefined,
  condition_summary: pt?.conditionNotes || (pt?.conditions?.join(", ")) || undefined,
  mobility: (pt?.mobility as UCCFCareSubject["mobility"]) || "assisted",
  cognitive: pt?.cognitive as UCCFCareSubject["cognitive"] || undefined,
},
```

For `medical`:
```ts
medical: (formData.devices.length || formData.procedures.length || formData.medicationComplexity)
  ? {
      medication_complexity: formData.medicationComplexity || undefined,
      devices: formData.devices.length ? formData.devices as UCCFMedical["devices"] : undefined,
      procedures_required: formData.procedures.length ? formData.procedures as UCCFMedical["procedures_required"] : undefined,
    }
  : undefined,
```

---

### 2e. Step 2 — Patient & Location (replace entire Step 2 JSX block)

**Patient selection:**
- Same patient card picker as before (keep existing code for patient list display)
- After selecting, show a **read-only summary card** with: Name, Age, Gender, Conditions, Mobility, Cognitive status (all from patient record — no editable fields)
- If no patients: show "Add a patient first" CTA (same as existing)
- **Remove** all manual name/age/gender/conditions/contact inputs from this step

**Location section** (below patient card):
- Heading: "Where will care take place?"
- Subheading: "Pre-filled from patient profile — update if different (e.g. hospital)"
- `city` text input — pre-filled from `pt?.careCity || "Dhaka"` when patient selected
- `area` text input — pre-filled from `pt?.careArea || ""`
- `locationType` — 2 chip buttons: **"Home care"** (`"home"`) and **"Hospital"** (`"hospital"`)

**Step 2 validation:**
```ts
if (!selectedPatientId) {
  toast.error("Please select a patient");
  return;
}
```

---

### 2f. Step 3 — Care Needs (replace entire Step 3 JSX block)

**Section A — Care Type** (unchanged chip grid, same as before)

**Section B — Services Needed**

Group `UNIFIED_SERVICES` by `group` and render each group as a labeled section with chip-toggle buttons. Selected chips highlighted in pink (`cn.pink` / `cn.pinkBg`).

Toggle via: `setFormData(fd => ({ ...fd, services: fd.services.includes(slug) ? fd.services.filter(s => s !== slug) : [...fd.services, slug] }))`

**Section C — Medical Equipment** (always visible)

Label: "Equipment Needed"
Chips from `UCCF_EQUIPMENT_SLUGS`: render with plain labels:
- `"hospital_bed"` → "Hospital bed"
- `"oxygen"` → "Oxygen concentrator"
- `"monitor"` → "Patient monitor"

Then **Equipment Provider** dropdown (only shown if any equipment selected):
- "" → "Select who provides..."
- "patient" → "Patient provides"
- "agency" → "Agency provides"
- "mixed" → "Mix of both"

**Section D — Advanced Medical Needs** (shown only if `services` contains any of: `vitals`, `medication`, `wound_care`, `NG_tube`, `suction`, `oxygen_therapy`)

Collapsed behind a chevron/disclosure by default. Label: "Medical Details (optional)"

Inside:
- Medication complexity chips: `"low"` → "Simple", `"medium"` → "Moderate", `"high"` → "Complex"
- Medical Devices chips from `UCCF_MEDICAL_DEVICES` with plain labels:
  - `"oxygen"` → "Oxygen concentrator"
  - `"catheter"` → "Catheter"
  - `"feeding_tube"` → "Feeding tube"
  - `"ventilator"` → "Ventilator"
- Medical Procedures chips from `UCCF_MEDICAL_PROCEDURES` with plain labels:
  - `"injection"` → "Injection"
  - `"IV"` → "IV drip"
  - `"suction"` → "Suctioning"
  - `"wound_care"` → "Wound dressing"

**Section E — Exclusions & Add-ons** (collapsed behind a "+" toggle)

Exclusions with plain labels:
- `"heavy_household_work"` → "Heavy housework"
- `"non_patient_tasks"` → "Non-patient errands"
- `"high_risk_procedures"` → "High-risk procedures"

Add-ons (remove `"doctor_visit"` — already in services):
- `"physiotherapy"` → "Physiotherapy"
- `"ambulance"` → "Ambulance service"
- `"diagnostics"` → "Diagnostic tests"

**Step 3 validation:** same as before — `selectedCareTypes.length === 0` triggers toast.

---

### 2g. Step 4 — Schedule & Staffing (replace entire Step 4 JSX block)

**Schedule panel:**

1. **Preferred Start Date** — `<input type="date">` for `formData.startDate`
2. **Care Duration** — 3 chip buttons: "Short stay" (`"short"`), "Monthly" (`"monthly"`), "Long-term" (`"long_term"`)
3. **Shift** — 3 chip buttons: "Day shift" (`"day"`), "Night shift" (`"night"`), "Rotational" (`"rotational"`)
4. **Hours per day** — 3 chip buttons: `8h`, `12h`, `24h`
5. **Shift start time** — `<input type="time">` for `formData.shiftStartTime`. **Only render this field when `formData.hoursPerDay !== 24`.**
   - Label: "Shift starts at"
   - Placeholder: "e.g. 10:00"
   - Helper text: "Default is 08:00 — change only if different"

**Staffing panel:**

1. **Staff Level** — `<select>` dropdown with these option labels (not L1/L2/L3/L4):
   - `"L1"` → "Basic Aide — hygiene & companionship"
   - `"L2"` → "Trained Caregiver — ADL & vitals"
   - `"L3"` → "Senior Caregiver — complex ADL & medication"
   - `"L4"` → "Nurse — clinical procedures"
2. **Staff Pattern** — 3 chip buttons with descriptions:
   - `"single"` → "One caregiver per shift"
   - `"double"` → "Two overlapping caregivers"
   - `"rotational_team"` → "Rotating team"
3. **Number of caregivers** — stepper (number input, min 0, default 1)
4. **Number of nurses** — stepper (number input, min 0, default 0). Only show this row if `formData.staffLevel === "L4"` or `formData.services` contains `"vitals"` or any advanced_care slug.

**Remove from this step:** city, area, address, location type, accommodation, food, travel distance (those move to Step 2 and Step 5).

---

### 2h. Step 5 — Budget & Posting (replace entire Step 5 JSX block)

1. **Pricing model** — 3 chip buttons: "Monthly", "Per day", "Hourly"
2. **Budget range** — two number inputs: Min ৳ and Max ৳ (side by side)
3. **Employer logistics** — compact section, label "Live-in / logistics":
   - `accommodationProvided` checkbox: "Accommodation provided"
   - `foodProvided` checkbox: "Meals provided"
   - If `accommodationProvided || foodProvided`: show `travelDistanceKm` number input, label "Max travel distance (km)"
4. **Listing expiry** — 4 chip buttons: 3, 7, 10, 15 days. Label: "How long should this stay open?"
5. **Post to Marketplace** toggle — same as existing (Globe icon, green highlight when on)

---

### 2i. Step 6 — Review (replace entire Step 6 JSX block)

Show read-only cards for each section. Each card has a small **Edit** link (navigate to that step via `setCurrentStep(n)`):

| Card | Content | Edit → Step |
|------|---------|-------------|
| Patient | Name, Age, Conditions, Mobility | 2 |
| Location | City, Area, Type | 2 |
| Care Types | Chips of selected categories | 3 |
| Services | Comma list of selected service labels | 3 |
| Medical | Devices + Procedures if any | 3 |
| Schedule | Start date, Duration, Shift, Hours, Start time | 4 |
| Staffing | Level label, Pattern label, Counts | 4 |
| Budget | ৳ Min – ৳ Max · Model | 5 |
| Listing | Expiry days · Marketplace on/off | 5 |

---

### 2j. useEffect — pre-fill city/area when patient selected

Add this effect below the existing patient pre-fill effect:

```ts
useEffect(() => {
  if (!selectedPatientId || !myPatients) return;
  const pt = myPatients.find(p => p.id === selectedPatientId);
  if (!pt) return;
  setFormData(fd => ({
    ...fd,
    city: pt.careCity || fd.city || "Dhaka",
    area: pt.careArea || fd.area || "",
  }));
}, [selectedPatientId, myPatients]);
```

Remove the existing `useEffect` that pre-filled `patientName`, `patientAge`, `gender`, `conditions` — those are now read-only from the patient record and not stored in `formData`.

---

## Files NOT changed

- `src/backend/domain/uccf/` — no changes needed; validator treats `shift_start_time` as an unknown optional field
- `src/backend/domain/uccf/constants.ts` — no changes; `UNIFIED_SERVICES` lives in the wizard component
- All other pages, services, and routes — unchanged

---

## Verification Checklist (for the implementing agent)

- [ ] No field appears in more than one wizard step
- [ ] `contactName` / `contactPhone` not shown in the form — taken from `user.name` / `user.phone`
- [ ] Selecting a patient pre-fills city/area in Step 2; guardian can still edit them
- [ ] `shiftStartTime` field hidden when `hoursPerDay === 24`
- [ ] "doctor_visit" slug NOT in add-ons (it's in services coordination bucket)
- [ ] Review step shows all sections with Edit links
- [ ] TypeScript compiles without errors (`npm run build` or `tsc --noEmit`)
