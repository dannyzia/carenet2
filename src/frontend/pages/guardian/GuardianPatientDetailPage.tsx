import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { ArrowLeft, Edit3, Phone, Trash2, ShieldAlert, FileText } from "lucide-react";
import { useDocumentTitle } from "@/frontend/hooks";
import { useTranslation } from "react-i18next";
import { cn } from "@/frontend/theme/tokens";
import { USE_SUPABASE, sb, currentUserId } from "@/backend/services/_sb";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";

interface PatientDetail {
  id: string;
  name: string;
  age: number;
  gender: string | null;
  relation: string | null;
  bloodGroup: string | null;
  dob: string | null;
  location: string;
  phone: string | null;
  emergencyContactName: string | null;
  conditions: string[];
  conditionNotes: string | null;
  status: string;
  createdAt: string;
}

export default function GuardianPatientDetailPage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.patientDetail", "Patient Details"));

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        if (USE_SUPABASE) {
          const userId = await currentUserId();
          const { data, error: sbErr } = await sb()
            .from("patients")
            .select("*")
            .eq("id", id)
            .eq("guardian_id", userId)
            .single();
          if (sbErr) throw sbErr;
          if (!data) { setError("Patient not found"); return; }
          setPatient({
            id: data.id,
            name: data.name,
            age: data.age,
            gender: data.gender,
            relation: data.relation,
            bloodGroup: data.blood_group,
            dob: data.dob,
            location: data.location,
            phone: data.phone,
            emergencyContactName: data.emergency_contact_name,
            conditions: data.conditions || [],
            conditionNotes: data.condition_notes,
            status: data.status,
            createdAt: data.created_at,
          });
        }
      } catch (err: any) {
        setError(err.message || "Failed to load patient");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleRemove = async () => {
    if (!patient || !confirm(`Remove ${patient.name}? This cannot be undone.`)) return;
    try {
      if (USE_SUPABASE) {
        const { error: delErr } = await sb().from("patients").delete().eq("id", patient.id);
        if (delErr) throw delErr;
      }
      navigate("/guardian/patients");
    } catch (err: any) {
      alert(err.message || "Failed to remove patient");
    }
  };

  if (loading) return <PageSkeleton cards={3} />;
  if (error || !patient) {
    return (
      <div className="text-center py-20">
        <p className="text-lg" style={{ color: cn.text }}>{error || "Patient not found"}</p>
        <Link to="/guardian/patients" className="mt-4 inline-flex items-center gap-2 text-sm" style={{ color: cn.green }}>
          <ArrowLeft className="w-4 h-4" /> Back to patients
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 cn-touch-target" style={{ color: cn.textSecondary }}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl" style={{ color: cn.text }}>{patient.name}</h1>
          <p className="text-sm" style={{ color: cn.textSecondary }}>
            {patient.relation || "No relation set"}{patient.age ? ` \u2022 Age ${patient.age}` : ""}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="cn-card-flat p-5">
            <h2 className="text-lg mb-4" style={{ color: cn.text }}>Profile</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs" style={{ color: cn.textSecondary }}>Gender</p>
                <p className="text-sm mt-0.5" style={{ color: cn.text }}>{patient.gender || "Not set"}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: cn.textSecondary }}>Age</p>
                <p className="text-sm mt-0.5" style={{ color: cn.text }}>{patient.age || "Not set"}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: cn.textSecondary }}>Blood Group</p>
                <p className="text-sm mt-0.5" style={{ color: cn.text }}>{patient.bloodGroup || "Not set"}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: cn.textSecondary }}>Date of Birth</p>
                <p className="text-sm mt-0.5" style={{ color: cn.text }}>{patient.dob ? new Date(patient.dob).toLocaleDateString() : "Not set"}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: cn.textSecondary }}>Status</p>
                <span className="inline-block mt-0.5 text-xs px-2 py-0.5 rounded-full" style={{
                  background: patient.status === "active" ? `${cn.green}20` : `${cn.purple}20`,
                  color: patient.status === "active" ? cn.green : cn.purple,
                }}>
                  {patient.status}
                </span>
              </div>
              <div>
                <p className="text-xs" style={{ color: cn.textSecondary }}>Added</p>
                <p className="text-sm mt-0.5" style={{ color: cn.text }}>{new Date(patient.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div className="cn-card-flat p-5">
            <h2 className="text-lg mb-4" style={{ color: cn.text }}>Medical Conditions</h2>
            {patient.conditions.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-4">
                {patient.conditions.map((c: string) => (
                  <span key={c} className="px-3 py-1.5 rounded-lg text-sm" style={{ background: `${cn.green}15`, color: cn.green }}>{c}</span>
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ color: cn.textSecondary }}>No conditions listed</p>
            )}
            {patient.conditionNotes && (
              <div className="mt-3 p-4 rounded-xl" style={{ background: cn.bgInput }}>
                <p className="text-xs font-medium mb-1" style={{ color: cn.textSecondary }}>Detailed Notes</p>
                <p className="text-sm whitespace-pre-wrap" style={{ color: cn.text }}>{patient.conditionNotes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="cn-card-flat p-5">
            <h2 className="text-lg mb-4 flex items-center gap-2" style={{ color: cn.text }}>
              <Phone className="w-5 h-5" style={{ color: cn.green }} /> Contact
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs" style={{ color: cn.textSecondary }}>Phone</p>
                {patient.phone ? (
                  <a href={`tel:${patient.phone}`} className="text-sm mt-0.5 block" style={{ color: cn.green }}>{patient.phone}</a>
                ) : (
                  <p className="text-sm mt-0.5" style={{ color: cn.textSecondary }}>Not set</p>
                )}
              </div>
              <div>
                <p className="text-xs" style={{ color: cn.textSecondary }}>Location</p>
                <p className="text-sm mt-0.5" style={{ color: cn.text }}>{patient.location || "Not set"}</p>
              </div>
            </div>
          </div>

          <div className="cn-card-flat p-5">
            <h2 className="text-lg mb-4 flex items-center gap-2" style={{ color: cn.text }}>
              <ShieldAlert className="w-5 h-5" style={{ color: "#DB869A" }} /> Emergency Contact
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs" style={{ color: cn.textSecondary }}>Contact Name</p>
                <p className="text-sm mt-0.5" style={{ color: cn.text }}>{patient.emergencyContactName || "Not set"}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: cn.textSecondary }}>Contact Phone</p>
                {patient.phone ? (
                  <a href={`tel:${patient.phone}`} className="text-sm mt-0.5 block" style={{ color: cn.green }}>{patient.phone}</a>
                ) : (
                  <p className="text-sm mt-0.5" style={{ color: cn.textSecondary }}>Not set</p>
                )}
              </div>
            </div>
          </div>

          <div className="cn-card-flat p-5">
            <h2 className="text-lg mb-4" style={{ color: cn.text }}>Actions</h2>
            <div className="space-y-2">
              {patient.phone && (
                <a href={`tel:${patient.phone}`} className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm no-underline" style={{ background: cn.bgInput, color: cn.text }}>
                  <Phone className="w-4 h-4" /> Call {patient.phone}
                </a>
              )}
              <Link
                to={`/guardian/care-diary?patientId=${patient.id}`}
                className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm no-underline"
                style={{ background: cn.purpleBg, color: cn.purple }}
              >
                <FileText className="w-4 h-4" /> Care Log
              </Link>
              <Link
                to={`/guardian/patient-intake?edit=${patient.id}`}
                className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm no-underline"
                style={{ background: cn.greenBg, color: cn.green }}
              >
                <Edit3 className="w-4 h-4" /> Edit Patient
              </Link>
              <button
                onClick={handleRemove}
                className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                style={{ background: "#FEF2F2", color: "#EF4444" }}
              >
                <Trash2 className="w-4 h-4" /> Remove Patient
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
