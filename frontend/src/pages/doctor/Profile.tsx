import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/UiComponents/Card";
import { Button } from "@/components/UiComponents/button";
import DoctorSidebar from "@/components/UiComponents/DoctorSidebar";
import { doctorService } from "@/services/doctorService";
import { useAuth } from "@/context/AuthContext";
import { Info, Loader2, Camera, Pencil } from "lucide-react";

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

    const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>("pending");
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

    const [editOpen, setEditOpen] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);

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

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                setError(null);
                const v = await doctorService.getVerification();
                if (!mounted) return;
                setVerificationStatus(v.status as VerificationStatus);

                try {
                    const p = await doctorService.getProfile();
                    if (!mounted) return;
                    setForm({
                        displayName: p?.displayName || "",
                        bio: p?.bio || "",
                        specialties: Array.isArray(p?.specialties) ? p.specialties : [],
                        experienceYears: typeof p?.experienceYears === "number" ? p.experienceYears : "",
                        licenseNumber: p?.licenseNumber || "",
                        avatarUrl: p?.avatarUrl || "",
                        consultationFee: typeof p?.consultationFee === "number" ? p.consultationFee : "",
                    });
                } catch {
                    // not verified or no profile yet
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

    const setField = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const onSpecialtiesChange = (value: string) => {
        const arr = value
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        setField("specialties", Array.from(new Set(arr)));
    };

    const validate = (): string | null => {
        if (!isVerified) return "Profile can be edited after verification";
        if (form.displayName.trim().length === 0) return "Display name is required";
        if (form.bio.trim().length > 5000) return "Bio is too long (max 5000)";
        if (form.experienceYears !== "" && Number(form.experienceYears) < 0) return "Experience cannot be negative";
        if (form.consultationFee !== "" && Number(form.consultationFee) < 0) return "Fee cannot be negative";
        if (form.avatarUrl && !/^https?:\/\//.test(form.avatarUrl)) return "Avatar URL must start with http/https";
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
                experienceYears: form.experienceYears === "" ? undefined : Number(form.experienceYears),
                licenseNumber: form.licenseNumber.trim(),
                avatarUrl: form.avatarUrl.trim(),
                consultationFee: form.consultationFee === "" ? undefined : Number(form.consultationFee),
            };
            await doctorService.updateProfile(payload);
            setEditOpen(false);
        } catch (e: any) {
            setError(e?.response?.data?.message || "Failed to save profile");
        } finally {
            setSaving(false);
        }
    };

    const onPickAvatar = (file: File | null) => {
        if (!file) return;
        if (!/^image\/(png|jpe?g|gif|webp)$/i.test(file.type)) {
            alert("Please upload an image (png, jpg, jpeg, gif, webp)");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert("Image too large. Max 5MB.");
            return;
        }
        (async () => {
            try {
                setAvatarUploading(true);
                const url = await doctorService.uploadAvatar(file);
                await doctorService.updateProfile({ avatarUrl: url }); // persist immediately
                setField("avatarUrl", url);
            } catch (e: any) {
                alert(e?.response?.data?.message || "Avatar upload failed");
            } finally {
                setAvatarUploading(false);
            }
        })();
    };

    const avatarSrc =
        form.avatarUrl ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(form.displayName || user?.username || "Dr")}`;

    return (
        <div className="min-h-screen w-full bg-gradient-to-b from-white via-[#F9FAFB] to-[#F3F6FA] text-[#1F2937]">
            <div className="flex">
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

                    <main className="container mx-auto px-6 py-8 space-y-6">
                        {loading ? (
                            <div className="flex items-center gap-2 text-gray-500">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading...
                            </div>
                        ) : (
                            <>
                                {!isVerified && (
                                    <Card className="border-0 bg-amber-50 rounded-2xl shadow-[0_10px_25px_rgba(16,24,40,0.06)]">
                                        <CardContent className="p-4 text-amber-800 text-sm flex items-start gap-2">
                                            <Info className="w-4 h-4 mt-0.5" />
                                            Profile editing is enabled after verification. Review and upload certificate in the Doctor page if pending or rejected.
                                        </CardContent>
                                    </Card>
                                )}

                                {error && (
                                    <Card className="border-0 bg-rose-50 rounded-2xl shadow-[0_10px_25px_rgba(16,24,40,0.06)]">
                                        <CardContent className="p-4 text-rose-700 text-sm">{error}</CardContent>
                                    </Card>
                                )}

                                {/* View card */}
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
                                                        (!isVerified || avatarUploading) ? "opacity-60 cursor-not-allowed" : "",
                                                    ].join(" ")}
                                                    title={isVerified ? "Change photo" : "Available after verification"}
                                                >
                                                    <Camera className="w-3.5 h-3.5" />
                                                    {avatarUploading ? "Uploading..." : "Change"}
                                                    <input
                                                        type="file"
                                                        accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                                                        className="hidden"
                                                        disabled={!isVerified || avatarUploading}
                                                        onChange={(e) => onPickAvatar(e.target.files?.[0] ?? null)}
                                                    />
                                                </label>
                                            </div>

                                            <div className="mt-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <h2 className="text-xl font-semibold">
                                                        {form.displayName || user?.username || "Doctor"}
                                                    </h2>
                                                    {isVerified && (
                                                        <button
                                                            onClick={() => setEditOpen(true)}
                                                            className="p-1.5 rounded-full hover:bg-gray-100 transition"
                                                            title="Edit profile"
                                                            disabled={!isVerified}
                                                        >
                                                            <Pencil className="w-4 h-4 text-gray-600" />
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500 mt-0.5">{form.licenseNumber || "License: —"}</p>
                                            </div>

                                            {/* Details grid under the avatar */}
                                            <div className="mt-6 w-full max-w-3xl grid sm:grid-cols-2 gap-4 text-sm">
                                                <div className="p-4 rounded-xl bg-gray-50">
                                                    <p className="text-gray-500">Experience</p>
                                                    <p className="font-medium">{form.experienceYears || 0} years</p>
                                                </div>
                                                <div className="p-4 rounded-xl bg-gray-50">
                                                    <p className="text-gray-500">Consultation fee</p>
                                                    <p className="font-medium">{form.consultationFee ? `₹${form.consultationFee}` : "—"}</p>
                                                </div>
                                                <div className="p-4 rounded-xl bg-gray-50 sm:col-span-2">
                                                    <p className="text-gray-500">Specialties</p>
                                                    {form.specialties.length ? (
                                                        <div className="mt-1 flex flex-wrap gap-1.5">
                                                            {form.specialties.map((s) => (
                                                                <span key={s} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs">
                                                                    {s}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="font-medium">—</p>
                                                    )}
                                                </div>
                                                <div className="p-4 rounded-xl bg-gray-50 sm:col-span-2">
                                                    <p className="text-gray-500">Bio</p>
                                                    <p className="font-medium whitespace-pre-wrap">{form.bio || "—"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Edit modal */}
                                {editOpen && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3">
                                        <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl">
                                            <div className="flex items-center justify-between px-5 py-4 border-b">
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
                                                        <label className="text-sm font-medium">Display name</label>
                                                        <input
                                                            type="text"
                                                            value={form.displayName}
                                                            onChange={(e) => setField("displayName", e.target.value)}
                                                            disabled={!isVerified || saving}
                                                            className="w-full border rounded-lg px-3 py-2 text-sm"
                                                            placeholder="Dr. Jane Doe"
                                                        />
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
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">Specialties</label>
                                                        <input
                                                            type="text"
                                                            value={form.specialties.join(",")}
                                                            onChange={(e) => onSpecialtiesChange(e.target.value)}
                                                            disabled={!isVerified || saving}
                                                            className="w-full border rounded-lg px-3 py-2 text-sm"
                                                            placeholder="Cardiology, Pediatrics, Telemedicine"
                                                        />
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
                                                    </div>

                                                    <div className="space-y-2 md:col-span-2">
                                                        <label className="text-sm font-medium">Avatar URL (optional)</label>
                                                        <input
                                                            type="url"
                                                            value={form.avatarUrl}
                                                            onChange={(e) => setField("avatarUrl", e.target.value)}
                                                            disabled={!isVerified || saving}
                                                            className="w-full border rounded-lg px-3 py-2 text-sm"
                                                            placeholder="https://..."
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t">
                                                <Button
                                                    variant="outline"
                                                    className="border-[#E5E7EB] bg-white hover:bg-white/90"
                                                    onClick={() => setEditOpen(false)}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button onClick={onSave} disabled={!isVerified || saving} className="bg-[#0EA5E9] hover:bg-[#0284C7]">
                                                    {saving ? (
                                                        <span className="inline-flex items-center gap-2">
                                                            <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                                                        </span>
                                                    ) : (
                                                        "Save changes"
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
