import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/UiComponents/Card";
import { Button } from "@/components/UiComponents/button";
import DoctorSidebar from "@/components/UiComponents/DoctorSidebar";
import { doctorService } from "@/services/doctorService";
import { useAuth } from "@/context/AuthContext";
import { CheckCircle2, Info, Loader2 } from "lucide-react";

type VerificationStatus = "pending" | "verified" | "rejected";

type ProfileForm = {
  displayName: string;
  bio: string;
  specialties: string[]; // comma-separated input becomes array
  experienceYears: number | "";
  licenseNumber: string;
  avatarUrl: string;
  consultationFee: number | ""; // per hour
};

export default function Profile() {
  const { user } = useAuth();

  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>("pending");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<ProfileForm>({
    displayName: "",
    bio: "",
    specialties: [],
    experienceYears: "",
    licenseNumber: "",
    avatarUrl: "",
    consultationFee: "",
  });

  const isVerified = verificationStatus === "verified";

  const statusBadge = useMemo(() => {
    if (verificationStatus === "verified")
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
          Verified
        </span>
      );
    if (verificationStatus === "pending")
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
          Pending
        </span>
      );
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
        Rejected
      </span>
    );
  }, [verificationStatus]);

  // Why: hydrate verification + profile so UI reflects current server state
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // get verification
        const v = await doctorService.getVerification();
        if (!mounted) return;
        setVerificationStatus(v.status as VerificationStatus);

        // get profile (will throw if not verified, so wrap)
        try {
          const p = await doctorService.getProfile();
          if (!mounted) return;

          setForm({
            displayName: p?.displayName || "",
            bio: p?.bio || "",
            specialties: Array.isArray(p?.specialties) ? p.specialties : [],
            experienceYears:
              typeof p?.experienceYears === "number" ? p.experienceYears : "",
            licenseNumber: p?.licenseNumber || "",
            avatarUrl: p?.avatarUrl || "",
            consultationFee:
              typeof p?.consultationFee === "number" ? p.consultationFee : "",
          });
        } catch {
          // If not verified, server may block; ignore and keep defaults
        }
      } catch (e: any) {
        setError(e?.response?.data?.message || "Failed to load profile");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Why: keep inputs controlled with small validation
  const setField = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onSpecialtiesChange = (value: string) => {
    // split by comma, trim, dedupe
    const arr = value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    setField("specialties", Array.from(new Set(arr)));
  };

  const specialtiesText = useMemo(() => form.specialties.join(", "), [form.specialties]);

  const validate = (): string | null => {
    if (!isVerified) return "Profile can be edited after verification";
    if (form.displayName.trim().length === 0) return "Display name is required";
    if (form.bio.trim().length > 5000) return "Bio is too long (max 5000)";
    if (form.experienceYears !== "" && Number(form.experienceYears) < 0)
      return "Experience cannot be negative";
    if (form.consultationFee !== "" && Number(form.consultationFee) < 0)
      return "Fee cannot be negative";
    if (form.avatarUrl && !/^https?:\/\//.test(form.avatarUrl))
      return "Avatar URL must start with http/https";
    return null;
  };

  const onSave = async () => {
    const errMsg = validate();
    if (errMsg) {
      setError(errMsg);
      return;
    }
    try {
      setSaving(true);
      setError(null);

      const payload = {
        displayName: form.displayName.trim(),
        bio: form.bio.trim(),
        specialties: form.specialties,
        experienceYears:
          form.experienceYears === "" ? undefined : Number(form.experienceYears),
        licenseNumber: form.licenseNumber.trim(),
        avatarUrl: form.avatarUrl.trim(),
        consultationFee:
          form.consultationFee === "" ? undefined : Number(form.consultationFee),
      };

      await doctorService.updateProfile(payload);
      alert("Profile saved");
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white via-[#F9FAFB] to-[#F3F6FA] text-[#1F2937]">
      <div className="flex">
        {/* Keep sidebar visible on profile */}
        <DoctorSidebar isVerified={isVerified} />

        <div className="flex-1 min-h-screen">
          {/* Header */}
          <header className="border-b border-[#EEF2F7] bg-white/70 backdrop-blur">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
              <h1 className="text-lg font-semibold">Profile</h1>
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#6B7280]">{user?.username ?? "doctor"}</span>
                {statusBadge}
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="container mx-auto px-6 py-8">
            {loading ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </div>
            ) : (
              <>
                {!isVerified && (
                  <Card className="mb-4 border-0 bg-amber-50 backdrop-blur rounded-2xl shadow-[0_10px_25px_rgba(16,24,40,0.06)]">
                    <CardContent className="p-4 text-amber-800 text-sm flex items-start gap-2">
                      <Info className="w-4 h-4 mt-0.5" />
                      Profile editing is enabled after verification. Review and upload certificate in the Doctor page if pending or rejected.
                    </CardContent>
                  </Card>
                )}

                {error && (
                  <Card className="mb-4 border-0 bg-rose-50 rounded-2xl shadow-[0_10px_25px_rgba(16,24,40,0.06)]">
                    <CardContent className="p-4 text-rose-700 text-sm">{error}</CardContent>
                  </Card>
                )}

                <Card className="border-0 bg-white/80 backdrop-blur rounded-2xl shadow-[0_10px_25px_rgba(16,24,40,0.06)]">
                  <CardContent className="p-6 space-y-6">
                    {/* Top summary */}
                    <div className="flex items-start gap-3">
                      <CheckCircle2
                        className={`w-5 h-5 mt-0.5 ${isVerified ? "text-green-600" : "text-gray-300"}`}
                      />
                      <div>
                        <h2 className="text-lg font-semibold">
                          {isVerified ? "Public profile" : "Profile (view only)"}
                        </h2>
                        <p className="text-sm text-[#6B7280]">
                          Add a short bio, areas of expertise, license number, and set consultation fee per hour.
                        </p>
                      </div>
                    </div>

                    {/* Form grid */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Display name</label>
                        <input
                          type="text"
                          value={form.displayName}
                          onChange={(e) => setField("displayName", e.target.value)}
                          disabled={!isVerified || saving}
                          className="w-full border rounded-lg px-3 py-2 text-sm"
                          placeholder="Dr. Jane Doe"
                        />
                        <p className="text-xs text-gray-500">Shown to patients across the app.</p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">License number</label>
                        <input
                          type="text"
                          value={form.licenseNumber}
                          onChange={(e) => setField("licenseNumber", e.target.value)}
                          disabled={!isVerified || saving}
                          className="w-full border rounded-lg px-3 py-2 text-sm"
                          placeholder="e.g., TCMC/123456"
                        />
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-medium">Bio</label>
                        <textarea
                          rows={5}
                          value={form.bio}
                          onChange={(e) => setField("bio", e.target.value)}
                          disabled={!isVerified || saving}
                          className="w-full border rounded-lg px-3 py-2 text-sm"
                          placeholder="Describe experience, approach, and areas of interest..."
                        />
                        <div className="text-xs text-gray-500">
                          Max 5000 characters. Keep it clear and patient-friendly.
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Specialties</label>
                        <input
                          type="text"
                          value={specialtiesText}
                          onChange={(e) => onSpecialtiesChange(e.target.value)}
                          disabled={!isVerified || saving}
                          className="w-full border rounded-lg px-3 py-2 text-sm"
                          placeholder="Cardiology, Pediatrics, Telemedicine"
                        />
                        <p className="text-xs text-gray-500">Comma-separated. Example: Dermatology, Cosmetology</p>
                        {form.specialties.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {form.specialties.map((s) => (
                              <span
                                key={s}
                                className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Experience (years)</label>
                        <input
                          type="number"
                          min={0}
                          value={form.experienceYears}
                          onChange={(e) =>
                            setField("experienceYears", e.target.value === "" ? "" : Number(e.target.value))
                          }
                          disabled={!isVerified || saving}
                          className="w-full border rounded-lg px-3 py-2 text-sm"
                          placeholder="e.g., 8"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Avatar URL</label>
                        <input
                          type="url"
                          value={form.avatarUrl}
                          onChange={(e) => setField("avatarUrl", e.target.value)}
                          disabled={!isVerified || saving}
                          className="w-full border rounded-lg px-3 py-2 text-sm"
                          placeholder="https://..."
                        />
                        <p className="text-xs text-gray-500">
                          Optional. If empty, a placeholder avatar is used.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Consultation fee (per hour)</label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">₹</span>
                          <input
                            type="number"
                            min={0}
                            value={form.consultationFee}
                            onChange={(e) =>
                              setField("consultationFee", e.target.value === "" ? "" : Number(e.target.value))
                            }
                            disabled={!isVerified || saving}
                            className="w-full border rounded-lg px-3 py-2 text-sm"
                            placeholder="e.g., 1200"
                          />
                        </div>
                        <p className="text-xs text-gray-500">This is billed as an hourly rate.</p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button
                        onClick={onSave}
                        disabled={!isVerified || saving}
                        className="bg-[#0EA5E9] hover:bg-[#0284C7]"
                      >
                        {saving ? (
                          <span className="inline-flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                          </span>
                        ) : (
                          "Save profile"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
