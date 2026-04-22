import { useState, useEffect } from "react";
import { cn } from "@/frontend/theme/tokens";
import { Camera, Edit3, CheckCircle, MapPin, Briefcase, Phone, Mail } from "lucide-react";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { caregiverService } from "@/backend/services/caregiver.service";
import { PageSkeleton } from "@/frontend/components/PageSkeleton";
import { useTranslation } from "react-i18next";

export default function CaregiverProfilePage() {
  const { t: tDocTitle } = useTranslation("common");
  useDocumentTitle(tDocTitle("pageTitles.caregiverProfile", "Caregiver Profile"));

  const { data: profileData, loading } = useAsyncData(() => caregiverService.getProfileData());
  const [editing, setEditing] = useState(false);
  const [profileOverrides, setProfileOverrides] = useState<{ bio?: string }>({});

  if (loading || !profileData) return <PageSkeleton cards={3} />;

  const profile = { ...profileData, ...profileOverrides };

  return (
    <>
      <div className="space-y-6 max-w-3xl">
        {/* Profile Header Card */}
        <div className="finance-card overflow-hidden">
          <div className="h-28" style={{ background: "radial-gradient(143.86% 887.35% at -10.97% -22.81%, #FEB4C5 0%, #DB869A 100%)" }} />
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 mb-4">
              <div className="relative w-fit">
                <div className="w-24 h-24 rounded-2xl border-4 border-white flex items-center justify-center text-3xl font-bold text-white"
                  style={{ background: "radial-gradient(143.86% 887.35% at -10.97% -22.81%, #FEB4C5 0%, #DB869A 100%)" }}>
                  {profile.name.charAt(0)}
                </div>
                <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center border-2 border-white"
                  style={{ background: "#DB869A" }}>
                  <Camera className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
              <button onClick={() => setEditing(!editing)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-all"
                style={{ borderColor: "#DB869A", color: "#DB869A" }}>
                <Edit3 className="w-4 h-4" /> {editing ? "Cancel" : "Edit Profile"}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-3">
              <h1 className="text-xl font-bold" style={{ color: "#535353" }}>{profile.name}</h1>
              <span className="badge-pill" style={{ background: "#7CE57720", color: "#5FB865" }}>
                <CheckCircle className="w-3 h-3 mr-1" /> Verified
              </span>
            </div>
            <p className="text-sm font-medium mb-2" style={{ color: "#DB869A" }}>{profile.title}</p>

            <div className="flex flex-wrap gap-4 text-sm mb-3">
              <span className="flex items-center gap-1" style={{ color: "#848484" }}><MapPin className="w-4 h-4" />{profile.location}</span>
              <span className="flex items-center gap-1" style={{ color: "#848484" }}><Briefcase className="w-4 h-4" />{profile.experience} experience</span>
              <span className="flex items-center gap-1" style={{ color: "#5FB865" }}>★ 4.8 (128 reviews)</span>
            </div>

            {editing ? (
              <textarea className="w-full p-3 rounded-lg border text-sm outline-none" rows={3}
                style={{ borderColor: "#E5E7EB", color: "#535353" }}
                value={profile.bio} onChange={e => setProfileOverrides(p => ({ ...p, bio: e.target.value }))} />
            ) : (
              <p className="text-sm leading-relaxed" style={{ color: "#848484" }}>{profile.bio}</p>
            )}
          </div>
        </div>

        {/* Contact & Rate */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="finance-card p-5">
            <h2 className="font-semibold mb-4" style={{ color: "#535353" }}>Contact Info</h2>
            <div className="space-y-3">
              {[
                { icon: Phone, label: "Phone", value: profile.phone },
                { icon: Mail, label: "Email", value: profile.email },
                { icon: MapPin, label: "Location", value: profile.location },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "#FEB4C520" }}>
                      <Icon className="w-4 h-4" style={{ color: "#DB869A" }} />
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: "#848484" }}>{item.label}</p>
                      <p className="text-sm font-medium" style={{ color: "#535353" }}>{item.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="finance-card p-5">
            <h2 className="font-semibold mb-4" style={{ color: "#535353" }}>Rate & Availability</h2>
            <div className="p-4 rounded-xl mb-4" style={{ background: "#F9FAFB" }}>
              <p className="text-xs" style={{ color: "#848484" }}>Daily Rate</p>
              <p className="text-lg font-bold" style={{ color: "#535353" }}>{profile.rate}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri"].map(d => (
                <span key={d} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "#FEB4C520", color: "#DB869A" }}>{d}</span>
              ))}
              {["Sat", "Sun"].map(d => (
                <span key={d} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "#F3F4F6", color: "#848484" }}>{d}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="finance-card p-5">
          <h2 className="font-semibold mb-4" style={{ color: "#535353" }}>Skills & Specializations</h2>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map(s => (
              <span key={s} className="px-3 py-1.5 rounded-full text-sm border" style={{ borderColor: "#FEB4C5", color: "#DB869A", background: "#FEB4C510" }}>{s}</span>
            ))}
          </div>
        </div>

        {/* Languages */}
        <div className="finance-card p-5">
          <h2 className="font-semibold mb-4" style={{ color: "#535353" }}>Languages</h2>
          <div className="flex flex-wrap gap-2">
            {profile.languages.map(l => (
              <span key={l} className="px-3 py-1.5 rounded-full text-sm" style={{ background: "#F3F4F6", color: "#535353" }}>{l}</span>
            ))}
          </div>
        </div>

        {editing && (
          <div className="flex gap-3 pb-24 md:pb-6">
            <button onClick={() => setEditing(false)} className="flex-1 py-3 rounded-xl font-medium border text-sm" style={{ borderColor: "#E5E7EB", color: "#535353" }}>
              Cancel
            </button>
            <button onClick={() => setEditing(false)} className="flex-1 py-3 rounded-xl text-white font-medium text-sm"
              style={{ background: "radial-gradient(143.86% 887.35% at -10.97% -22.81%, #FEB4C5 0%, #DB869A 100%)" }}>
              Save Changes
            </button>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: "\n        .finance-card { background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }\n        .badge-pill { display: inline-flex; align-items: center; padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.7rem; font-weight: 500; }\n      " }} />
    </>
  );
}