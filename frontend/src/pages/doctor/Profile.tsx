import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/UiComponents/Card";
import { Button } from "@/components/UiComponents/button";
import DoctorSidebar from "@/components/UiComponents/DoctorSidebar";
import { doctorService } from "@/services/doctorService";
import { useAuth } from "@/context/AuthContext";
import { Info, Loader2, Camera, Pencil, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type VerificationStatus = "pending" | "verified" | "rejected";

type ProfileForm = {
  displayName: string;
  bio: string;
  specialties: string[];
  experienceYears: number | "";
  licenseNumber: string;
  avatarUrl: string;
  consultationFee: number | "";
};

export default function Profile() {
  const { user } = useAuth();

  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>("pending");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const [form, setForm] = useState<ProfileForm>({
    displayName: "",
    bio: "",
    specialties: [],
    experienceYears: "",
    licenseNumber: "",
    avatarUrl: "",
    consultationFee: "",
  });

  const [specialtyInput, setSpecialtyInput] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const isVerified = verificationStatus === "verified";
  const canEdit = verificationStatus !== "pending" || !hasSubmitted;

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
          {hasSubmitted ? "Under Review" : "Draft"}
        </span>
      );
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
        Rejected
      </span>
    );
  }, [verificationStatus, hasSubmitted]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const v = await doctorService.getVerification();
        if (!mounted) return;
        setVerificationStatus(v.status as VerificationStatus);

        setHasSubmitted(v.status === "pending" && !!v.certificateUrl);

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
          // profile not available yet
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

  const setField = <K extends keyof ProfileForm>(
    key: K,
    value: ProfileForm[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const onAddSpecialty = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && specialtyInput.trim()) {
      e.preventDefault();
      setField("specialties", [...form.specialties, specialtyInput.trim()]);
      setSpecialtyInput("");
    }
  };

  const onRemoveSpecialty = (s: string) => {
    setField(
      "specialties",
      form.specialties.filter((item) => item !== s)
    );
  };

  const validate = (): string | null => {
    if (hasSubmitted && verificationStatus === "pending") {
      return "Cannot edit profile while under admin review";
    }
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
          form.experienceYears === ""
            ? undefined
            : Number(form.experienceYears),
        licenseNumber: form.licenseNumber.trim(),
        avatarUrl: form.avatarUrl.trim(),
        consultationFee:
          form.consultationFee === ""
            ? undefined
            : Number(form.consultationFee),
      };
      await doctorService.updateProfile(payload);
      setEditOpen(false);
      toast("Profile saved successfully");
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const onPickAvatar = (file: File | null) => {
    if (!file) return;
    if (!/^image\/(png|jpe?g|gif|webp)$/i.test(file.type)) {
      toast("Please upload an image (png, jpg, jpeg, gif, webp)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast("Image too large. Max 5MB.");
      return;
    }
    (async () => {
      try {
        setAvatarUploading(true);
        const url = await doctorService.uploadAvatar(file);
        await doctorService.updateProfile({ avatarUrl: url });
        setField("avatarUrl", url);
        toast("Avatar updated");
      } catch (e: any) {
        toast(e?.response?.data?.message || "Avatar upload failed");
      } finally {
        setAvatarUploading(false);
      }
    })();
  };

  const avatarSrc =
    form.avatarUrl ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
      form.displayName || user?.username || "Dr"
    )}`;

  const profileCompletionPercent = useMemo(() => {
    const fields = [
      form.displayName.trim(),
      form.bio.trim(),
      form.specialties.length > 0,
      form.experienceYears !== "",
      form.licenseNumber.trim(),
      form.consultationFee !== "",
    ];
    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  }, [form]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white via-[#F9FAFB] to-[#F3F6FA] text-[#1F2937]">
      <div className="flex">
        <DoctorSidebar isVerified={isVerified} />

        <div className="flex-1 min-h-screen">
          <header className="border-b border-[#EEF2F7] bg-white/70 backdrop-blur">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
              <h1 className="text-lg font-semibold">Profile</h1>
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#6B7280]">
                  {user?.username ?? "doctor"}
                </span>
                {statusBadge}
              </div>
            </div>
          </header>

          <main className="container mx-auto px-6 py-8 space-y-6">
            {loading ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </div>
            ) : (
              <>
                {!isVerified && (
                  <Card className="border-0 bg-blue-50 rounded-2xl shadow-[0_10px_25px_rgba(16,24,40,0.06)]">
                    <CardContent className="p-4 text-blue-800 text-sm flex items-start gap-2">
                      <Info className="w-4 h-4 mt-0.5" />
                      <div>
                        {hasSubmitted ? (
                          <p>
                            Your profile is under admin review. You cannot edit
                            until a decision is made.
                          </p>
                        ) : verificationStatus === "rejected" ? (
                          <p>
                            Your submission was rejected. Please update your
                            profile and certificate, then resubmit from the
                            Dashboard.
                          </p>
                        ) : (
                          <p>
                            Complete all required fields (marked with *) and
                            upload a certificate on the Dashboard to submit for
                            verification.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!isVerified && !hasSubmitted && (
                  <Card className="border-0 bg-white/80 rounded-2xl shadow-[0_10px_25px_rgba(16,24,40,0.06)]">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          Profile Completion
                        </span>
                        <span className="text-sm font-semibold text-[#0EA5E9]">
                          {profileCompletionPercent}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-[#0EA5E9] h-2 rounded-full transition-all"
                          style={{ width: `${profileCompletionPercent}%` }}
                        />
                      </div>
                      {profileCompletionPercent < 100 && (
                        <p className="text-xs text-gray-500 mt-2">
                          Complete all required fields to enable submission for
                          review
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {error && (
                  <Card className="border-0 bg-rose-50 rounded-2xl shadow-[0_10px_25px_rgba(16,24,40,0.06)]">
                    <CardContent className="p-4 text-rose-700 text-sm flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5" />
                      {error}
                    </CardContent>
                  </Card>
                )}

                <Card className="border-0 bg-white/80 rounded-2xl shadow-[0_10px_25px_rgba(16,24,40,0.06)]">
                  <CardContent className="p-8">
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        <img
                          src={avatarSrc}
                          alt="avatar"
                          className="w-40 h-40 rounded-full object-cover ring-2 ring-white shadow-md"
                        />
                        <label
                          className={[
                            "absolute bottom-2 right-2 inline-flex items-center gap-1",
                            "px-3 py-1.5 rounded-full bg-[#0EA5E9] text-white text-xs",
                            "cursor-pointer hover:bg-[#0284C7] transition",
                            !canEdit || avatarUploading
                              ? "opacity-60 cursor-not-allowed"
                              : "",
                          ].join(" ")}
                          title={
                            canEdit
                              ? "Change photo"
                              : "Not available during review"
                          }
                        >
                          <Camera className="w-3.5 h-3.5" />
                          {avatarUploading ? "Uploading..." : "Change"}
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                            className="hidden"
                            disabled={!canEdit || avatarUploading}
                            onChange={(e) =>
                              onPickAvatar(e.target.files?.[0] ?? null)
                            }
                          />
                        </label>
                      </div>

                      <div className="mt-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <h2 className="text-xl font-semibold">
                            {form.displayName || user?.username || "Doctor"}{" "}
                            {!form.displayName && (
                              <span className="text-rose-500">*</span>
                            )}
                          </h2>
                          {canEdit && (
                            <button
                              onClick={() => setEditOpen(true)}
                              className="p-1.5 rounded-full hover:bg-gray-100 transition"
                              title="Edit profile"
                            >
                              <Pencil className="w-4 h-4 text-gray-600" />
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {form.licenseNumber || (
                            <span className="text-rose-500">
                              License: Required *
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="mt-6 w-full max-w-3xl grid sm:grid-cols-2 gap-4 text-sm">
                        <div className="p-4 rounded-xl bg-gray-50">
                          <p className="text-gray-500">Experience</p>
                          <p className="font-medium">
                            {form.experienceYears !== "" ? (
                              `${form.experienceYears} years`
                            ) : (
                              <span className="text-rose-500">Required *</span>
                            )}
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-gray-50">
                          <p className="text-gray-500">Consultation fee</p>
                          <p className="font-medium">
                            {form.consultationFee !== "" ? (
                              `₹${form.consultationFee}`
                            ) : (
                              <span className="text-rose-500">Required *</span>
                            )}
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-gray-50 sm:col-span-2">
                          <p className="text-gray-500">Specialties</p>
                          {form.specialties.length ? (
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {form.specialties.map((s) => (
                                <span
                                  key={s}
                                  className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="font-medium text-rose-500">
                              Required * (Add at least one)
                            </p>
                          )}
                        </div>
                        <div className="p-4 rounded-xl bg-gray-50 sm:col-span-2">
                          <p className="text-gray-500">Bio</p>
                          <p className="font-medium whitespace-pre-wrap">
                            {form.bio || (
                              <span className="text-rose-500">Required *</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {editOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
                      <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white z-10">
                        <h3 className="text-lg font-semibold">Edit profile</h3>
                        <button
                          onClick={() => setEditOpen(false)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition"
                          aria-label="Close"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="p-5">
                        <div className="grid md:grid-cols-2 gap-5">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              Display name{" "}
                              <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={form.displayName}
                              onChange={(e) =>
                                setField("displayName", e.target.value)
                              }
                              disabled={!canEdit || saving}
                              className="w-full border rounded-lg px-3 py-2 text-sm"
                              placeholder="Dr. Jane Doe"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              License number{" "}
                              <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={form.licenseNumber}
                              onChange={(e) =>
                                setField("licenseNumber", e.target.value)
                              }
                              disabled={!canEdit || saving}
                              className="w-full border rounded-lg px-3 py-2 text-sm"
                              placeholder="e.g., TCMC/123456"
                            />
                          </div>

                          <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-medium">
                              Bio <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                              rows={5}
                              value={form.bio}
                              onChange={(e) => setField("bio", e.target.value)}
                              disabled={!canEdit || saving}
                              className="w-full border rounded-lg px-3 py-2 text-sm"
                              placeholder="Describe experience, approach, and areas of interest..."
                            />
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium">
                              Specialties{" "}
                              <span className="text-rose-500">*</span>
                            </label>
                            <div className="flex flex-wrap gap-2 border rounded-lg px-3 py-2">
                              {form.specialties.map((s) => (
                                <span
                                  key={s}
                                  className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs flex items-center gap-1"
                                >
                                  {s}
                                  <button
                                    type="button"
                                    onClick={() => onRemoveSpecialty(s)}
                                    className="text-gray-500 hover:text-red-500"
                                    disabled={!canEdit || saving}
                                  >
                                    ✕
                                  </button>
                                </span>
                              ))}
                              <input
                                type="text"
                                value={specialtyInput}
                                onChange={(e) =>
                                  setSpecialtyInput(e.target.value)
                                }
                                onKeyDown={onAddSpecialty}
                                disabled={!canEdit || saving}
                                className="flex-1 min-w-[120px] border-0 focus:ring-0 text-sm"
                                placeholder="Type & press Enter"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              Experience (years){" "}
                              <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={form.experienceYears}
                              onChange={(e) =>
                                setField(
                                  "experienceYears",
                                  e.target.value === ""
                                    ? ""
                                    : Number(e.target.value)
                                )
                              }
                              disabled={!canEdit || saving}
                              className="w-full border rounded-lg px-3 py-2 text-sm"
                              placeholder="e.g., 8"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              Consultation fee{" "}
                              <span className="text-rose-500">*</span>
                            </label>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">₹</span>
                              <input
                                type="number"
                                min={0}
                                value={form.consultationFee}
                                onChange={(e) =>
                                  setField(
                                    "consultationFee",
                                    e.target.value === ""
                                      ? ""
                                      : Number(e.target.value)
                                  )
                                }
                                disabled={!canEdit || saving}
                                className="w-full border rounded-lg px-3 py-2 text-sm"
                                placeholder="e.g., 1200"
                              />
                            </div>
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium">
                              Avatar URL (optional)
                            </label>
                            <input
                              type="url"
                              value={form.avatarUrl}
                              onChange={(e) =>
                                setField("avatarUrl", e.target.value)
                              }
                              disabled={!canEdit || saving}
                              className="w-full border rounded-lg px-3 py-2 text-sm"
                              placeholder="https://..."
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 px-5 py-4 border-t sticky bottom-0 bg-white z-10">
                        <Button
                          onClick={() => setEditOpen(false)}
                          variant="outline"
                          disabled={saving}
                        >
                          Cancel
                        </Button>
                        <Button onClick={onSave} disabled={!canEdit || saving}>
                          {saving ? (
                            <span className="flex items-center gap-1">
                              <Loader2 className="w-4 h-4 animate-spin" />{" "}
                              Saving...
                            </span>
                          ) : (
                            "Save"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
