"use client";
import React, { useState, useEffect } from "react";
import { UserPlus, Heart, Calendar, FileText, ShieldAlert, ChevronRight, Stethoscope, Activity, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { useNavigate, useSearchParams, useLocation } from "react-router";
import { PageHero } from "@/frontend/components/PageHero";
import { cn } from "@/frontend/theme/tokens";
import { useDocumentTitle } from "@/frontend/hooks";
import { useTranslation } from "react-i18next";
import { USE_SUPABASE, sbWrite, sb, currentUserId } from "@/backend/services/_sb";

function sanitizeInternalReturnTo(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string" || !raw.startsWith("/")) return null;
  if (!raw.startsWith("/guardian/") && !raw.startsWith("/patient/")) return null;
  return raw;
}

const MEDICAL_CONDITIONS = [
  "Diabetes", "Hypertension", "Dementia", "Post-Stroke", 
  "Cardiac Issue", "Mobility Restricted", "Post-Surgery"
];

export default function PatientIntakePage() {
  const { t: tDocTitle } = useTranslation("common");
  const { t: tGuardian } = useTranslation("guardian");
  useDocumentTitle(tDocTitle("pageTitles.patientIntake", "Patient Intake"));

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const returnTo =
    sanitizeInternalReturnTo((location.state as { returnTo?: string } | null)?.returnTo) ??
    sanitizeInternalReturnTo(searchParams.get("returnTo"));
  const isEditing = !!editId;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    relationship: "",
    age: "",
    gender: "",
    conditions: [] as string[],
    conditionNotes: "",
    emergencyName: "",
    emergencyPhone: "",
  });

  useEffect(() => {
    if (!editId || !USE_SUPABASE) return;
    (async () => {
      try {
        const { data, error } = await sb().from("patients").select("*").eq("id", editId).single();
        if (error) throw error;
        if (data) {
          setFormData({
            name: data.name || "",
            relationship: data.relation || "",
            age: data.age?.toString() || "",
            gender: data.gender || "",
            conditions: data.conditions || [],
            conditionNotes: data.condition_notes || "",
            emergencyName: data.emergency_contact_name || "",
            emergencyPhone: data.phone || "",
          });
        }
      } catch (err) {
        console.error("Failed to load patient:", err);
      }
    })();
  }, [editId]);

  const toggleCondition = (condition: string) => {
    setFormData(prev => {
      const newConditions = prev.conditions.includes(condition)
        ? prev.conditions.filter(c => c !== condition)
        : [...prev.conditions, condition];
      
      // Auto-populate condition notes with selected conditions
      const conditionsList = newConditions.length > 0 
        ? `Selected conditions: ${newConditions.join(", ")}\n\n`
        : "";
      const existingNotes = prev.conditionNotes.replace(/^Selected conditions:.*\n\n?/i, "");
      
      return {
        ...prev,
        conditions: newConditions,
        conditionNotes: conditionsList + existingNotes
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Please enter patient name");
      return;
    }

    setLoading(true);
    try {
      if (USE_SUPABASE) {
        if (isEditing) {
          const { error } = await sb().from("patients").update({
            name: formData.name,
            age: parseInt(formData.age) || 0,
            gender: formData.gender || null,
            relation: formData.relationship,
            conditions: formData.conditions,
            condition_notes: formData.conditionNotes.trim() || null,
            emergency_contact_name: formData.emergencyName.trim() || null,
            phone: formData.emergencyPhone.trim() || null,
          }).eq("id", editId);
          if (error) throw error;
        } else {
          const userId = await currentUserId();
          const { data, error } = await sb().from("patients").insert({
            guardian_id: userId,
            name: formData.name,
            age: parseInt(formData.age) || 0,
            gender: formData.gender || null,
            relation: formData.relationship,
            conditions: formData.conditions,
            condition_notes: formData.conditionNotes.trim() || null,
            emergency_contact_name: formData.emergencyName.trim() || null,
            phone: formData.emergencyPhone.trim() || null,
            location: "",
            status: "active",
          }).select().single();

          if (error) throw error;
        }
      } else {
        // Mock mode - get existing patients and add new one
        const existing = localStorage.getItem("mock_patients");
        const patients = existing ? JSON.parse(existing) : [];
        const newPatient = {
          id: `p-${Date.now()}`,
          name: formData.name,
          age: parseInt(formData.age) || 0,
          gender: formData.gender,
          relation: formData.relationship,
          conditions: formData.conditions,
          conditionNotes: formData.conditionNotes,
          emergencyContactName: formData.emergencyName.trim() || undefined,
          phone: formData.emergencyPhone.trim() || undefined,
          status: "Active",
        };
        patients.push(newPatient);
        localStorage.setItem("mock_patients", JSON.stringify(patients));
      }
      navigate(returnTo ?? "/guardian/patients");
    } catch (err: any) {
      console.error("Failed to create patient:", err);
      alert(err.message || "Failed to create patient");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHero gradient="radial-gradient(143.86% 887.35% at -10.97% -22.81%, #7CE577 0%, #5FB865 100%)" className="pt-12 pb-24 px-6 relative overflow-hidden"><div className="max-w-3xl mx-auto relative z-10 text-white"><h1 className="text-3xl font-bold mb-3">{isEditing ? "Edit Patient" : "Add New Patient"}</h1><p className="text-white/80">{isEditing ? "Update the health profile for your loved one." : "Complete the health profile to get the best care matches for your loved one."}</p></div><div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl animate-pulse" /></PageHero>
      {/* Match PageHero horizontal breakout so the card aligns with the hero (avoids double main padding + px-6 on mobile). */}
      <div className="-mx-4 md:-mx-6 px-6 -mt-12 relative z-20">
        <div className="max-w-3xl mx-auto">
        <div className="finance-card p-5 sm:p-8 md:p-12 rounded-2xl md:rounded-[2rem] lg:rounded-[2.75rem]">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <div className="w-10 h-10 rounded-xl bg-[#E8F9E7] flex items-center justify-center mr-4">
                  <UserPlus className="w-5 h-5 text-[#5FB865]" />
                </div>
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500 uppercase ml-1">Full Name *</label>
                  <input 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full h-14 px-5 rounded-2xl bg-gray-50 border border-gray-100 focus:ring-2 focus:ring-[#7CE577] outline-none transition-all" 
                    placeholder="e.g. Mr. Abdul Haque" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500 uppercase ml-1">Relationship</label>
                  <select 
                    value={formData.relationship}
                    onChange={e => setFormData({...formData, relationship: e.target.value})}
                    className="w-full h-14 px-5 rounded-2xl bg-gray-50 border border-gray-100 focus:ring-2 focus:ring-[#7CE577] outline-none transition-all appearance-none"
                  >
                    <option value="">Select...</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500 uppercase ml-1">Age</label>
                  <input 
                    type="number"
                    value={formData.age}
                    onChange={e => setFormData({...formData, age: e.target.value})}
                    className="w-full h-14 px-5 rounded-2xl bg-gray-50 border border-gray-100 focus:ring-2 focus:ring-[#7CE577] outline-none transition-all" 
                    placeholder="e.g. 75" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500 uppercase ml-1">Gender</label>
                  <div className="flex gap-2 h-14">
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, gender: "Male"})}
                      className={`flex-1 rounded-2xl font-bold transition-all ${formData.gender === "Male" ? "bg-[#7CE577] text-white border-[#7CE577]" : "border border-gray-200 text-gray-600 hover:border-[#7CE577] hover:bg-[#E8F9E7]"}`}
                    >
                      Male
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, gender: "Female"})}
                      className={`flex-1 rounded-2xl font-bold transition-all ${formData.gender === "Female" ? "bg-[#7CE577] text-white border-[#7CE577]" : "border border-gray-200 text-gray-600 hover:border-[#7CE577] hover:bg-[#E8F9E7]"}`}
                    >
                      Female
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Medical Condition */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mr-4">
                  <Activity className="w-5 h-5 text-red-400" />
                </div>
                Medical Condition
              </h2>
              <div className="space-y-4">
                <p className="text-sm text-gray-500">Select all that apply:</p>
                <div className="flex flex-wrap gap-2">
                  {MEDICAL_CONDITIONS.map(tag => (
                    <button 
                      key={tag}
                      type="button"
                      onClick={() => toggleCondition(tag)}
                      className={`px-5 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        formData.conditions.includes(tag)
                          ? "bg-[#7CE577] border-[#7CE577] text-white"
                          : "border-gray-200 hover:border-[#7CE577] hover:bg-[#E8F9E7]"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500 uppercase ml-1">
                    Detailed Condition Note {formData.conditionNotes && `(${formData.conditionNotes.length} chars)`}
                  </label>
                  <textarea 
                    value={formData.conditionNotes}
                    onChange={e => setFormData({...formData, conditionNotes: e.target.value})}
                    className="w-full p-5 rounded-2xl bg-gray-50 border border-gray-100 focus:ring-2 focus:ring-[#7CE577] outline-none transition-all min-h-[120px]" 
                    placeholder="Add details about the selected conditions, medications, special instructions..."
                  />
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Emergency Contact — may be someone other than the guardian */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <div className="w-10 h-10 rounded-xl bg-[#FFF5F7] flex items-center justify-center mr-4">
                  <ShieldAlert className="w-5 h-5 text-[#DB869A]" />
                </div>
                Emergency Contact
              </h2>
              <p className="text-sm text-gray-500 -mt-2">
                {tGuardian("patientIntake.emergencyContactHint")}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500 uppercase ml-1">Contact Person Name</label>
                  <input 
                    value={formData.emergencyName}
                    onChange={e => setFormData({...formData, emergencyName: e.target.value})}
                    className="w-full h-14 px-5 rounded-2xl bg-gray-50 border border-gray-100 focus:ring-2 focus:ring-[#FEB4C5] outline-none transition-all" 
                    placeholder="Primary contact"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500 uppercase ml-1">Phone Number</label>
                  <input 
                    value={formData.emergencyPhone}
                    onChange={e => setFormData({...formData, emergencyPhone: e.target.value})}
                    className="w-full h-14 px-5 rounded-2xl bg-gray-50 border border-gray-100 focus:ring-2 focus:ring-[#FEB4C5] outline-none transition-all" 
                    placeholder="+880 1XXXXXXXXX"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-16 rounded-2xl font-bold text-lg shadow-xl" 
                style={{ background: "radial-gradient(143.86% 887.35% at -10.97% -22.81%, #7CE577 0%, #5FB865 100%)" }}
              >
                {loading ? (isEditing ? "Saving..." : "Creating...") : (
                  <>
                    {isEditing ? "Save Changes" : "Create Profile"}
                    <ChevronRight className="ml-2 w-6 h-6" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: ".finance-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.4); box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05); }" }} />
    </div>
  );
}