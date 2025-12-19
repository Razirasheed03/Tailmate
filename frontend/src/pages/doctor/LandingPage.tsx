import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/UiComponents/button";
import { Card, CardContent } from "@/components/UiComponents/Card";
import {
  Upload,
  CheckCircle2,
  Clock,
  Calendar,
  Users,
  AlertTriangle,
  Send,
  IndianRupee,
} from "lucide-react";
import { doctorService } from "@/services/doctorService";
import DoctorSidebar from "@/components/UiComponents/DoctorSidebar";
import DoctorNavbar from "@/components/UiComponents/DoctorNavbar";
import { toast } from "sonner";
import DoctorStatusPie from "@/components/common/DoctorStatusPie";
import RevenueBarChart from "@/components/common/RevenueBarChart";

type VerificationStatus = "not_submitted" | "pending" | "verified" | "rejected";

type ProfileData = {
  displayName: string;
  bio: string;
  specialties: string[];
  experienceYears: number | "";
  licenseNumber: string;
  consultationFee: number | "";
};

type DoctorDashboardStats = {
  appointmentsToday: number;
  totalPatients: number;
  earningsThisMonth: number;
  chart: {
    months: string[];
    earnings: number[];
  };
};

export default function DoctorLandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>("not_submitted");
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [rejectionReasons, setRejectionReasons] = useState<string[] | null>(
    null
  );

  const [petTrends, setPetTrends] = useState<
    Array<{ categoryName: string; count: number }>
  >([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [statusChart, setStatusChart] = useState({
    pending: 0,
    completed: 0,
    cancelled: 0,
  });

  const [dashboardStats, setDashboardStats] = useState<DoctorDashboardStats>({
    appointmentsToday: 0,
    totalPatients: 0,
    earningsThisMonth: 0,
    chart: { months: [], earnings: [] },
  });

  const [profile, setProfile] = useState<ProfileData>({
    displayName: "",
    bio: "",
    specialties: [],
    experienceYears: "",
    licenseNumber: "",
    consultationFee: "",
  });

  const [specialtyInput, setSpecialtyInput] = useState("");

  const isVerified = verificationStatus === "verified";
  const canShowForm =
    verificationStatus === "not_submitted" || verificationStatus === "rejected";

  // FETCH VERIFICATION + PROFILE
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const v = await doctorService.getVerification();
        if (!isMounted) return;

        const actualStatus: VerificationStatus =
          v.status === "verified"
            ? "verified"
            : v.status === "rejected"
            ? "rejected"
            : v.certificateUrl
            ? "pending"
            : "not_submitted";

        setVerificationStatus(actualStatus);

        if (v.rejectionReasons?.length) {
          setRejectionReasons(v.rejectionReasons);
        }

        try {
          const p = await doctorService.getProfile();
          if (!isMounted) return;
          setProfile({
            displayName: p?.displayName || "",
            bio: p?.bio || "",
            specialties: Array.isArray(p?.specialties) ? p.specialties : [],
            experienceYears:
              typeof p?.experienceYears === "number" ? p.experienceYears : "",
            licenseNumber: p?.licenseNumber || "",
            consultationFee:
              typeof p?.consultationFee === "number" ? p.consultationFee : "",
          });
        } catch {}
      } catch {}
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // FETCH DASHBOARD STATS
  useEffect(() => {
    if (!isVerified) return;
    (async () => {
      try {
        const stats = await doctorService.getDashboardStats();
        setDashboardStats(stats);
      } catch (err) {}
    })();
  }, [isVerified]);

  // FETCH STATUS PIE CHART
  useEffect(() => {
    if (!isVerified) return;
    (async () => {
      try {
        const data = await doctorService.getStatusChart();
        setStatusChart(data);
      } catch (err) {}
    })();
  }, [isVerified]);

  // FETCH PET TRENDS
  useEffect(() => {
    if (!isVerified) return;
    (async () => {
      try {
        const trends = await doctorService.getPetTrends();
        setPetTrends(trends);
      } catch (e) {}
    })();
  }, [isVerified]);

  const statusBadge = useMemo(() => {
    if (verificationStatus === "verified")
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
          Verified
        </span>
      );
    if (verificationStatus === "pending")
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
          Under Review
        </span>
      );
    if (verificationStatus === "rejected")
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-100">
          Rejected
        </span>
      );
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-100">
        Not Submitted
      </span>
    );
  }, [verificationStatus]);

  // Certificate Upload
  const handleChooseFile = (file: File | null) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Max 10MB.");
      return;
    }
    setCertificateFile(file);
  };

  const onAddSpecialty = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && specialtyInput.trim()) {
      e.preventDefault();
      if (!profile.specialties.includes(specialtyInput.trim())) {
        setProfile((prev) => ({
          ...prev,
          specialties: [...prev.specialties, specialtyInput.trim()],
        }));
      }
      setSpecialtyInput("");
    }
  };

  const onRemoveSpecialty = (s: string) => {
    setProfile((prev) => ({
      ...prev,
      specialties: prev.specialties.filter((item) => item !== s),
    }));
  };

  const isFormComplete = () =>
    !!certificateFile &&
    !!profile.displayName.trim() &&
    !!profile.bio.trim() &&
    profile.specialties.length > 0 &&
    profile.experienceYears !== "" &&
    !!profile.licenseNumber.trim() &&
    profile.consultationFee !== "";

  const handleSubmitAll = async () => {
    if (!isFormComplete()) {
      toast.error("Please complete all fields and upload a certificate");
      return;
    }
    try {
      setIsSubmitting(true);
      await doctorService.uploadCertificate(certificateFile!);
      await doctorService.updateProfile({
        displayName: profile.displayName.trim(),
        bio: profile.bio.trim(),
        specialties: profile.specialties,
        experienceYears: Number(profile.experienceYears),
        licenseNumber: profile.licenseNumber.trim(),
        consultationFee: Number(profile.consultationFee),
      });
      await doctorService.submitForReview();
      setVerificationStatus("pending");
      setRejectionReasons(null);
      toast.success("Submitted for admin review!");
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message || e?.message || "Submission failed"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white via-[#F9FAFB] to-[#F3F6FA] text-[#1F2937]">
      <div className="flex">
        <DoctorSidebar isVerified={isVerified} />

        <div className="flex-1 min-h-screen">
          <header className="border-b bg-white sticky top-0 z-50">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
              <h1 className="text-lg font-semibold">Doctor Portal</h1>
              <DoctorNavbar />
            </div>
          </header>

          <main className="container mx-auto px-6 py-8 space-y-6">
            {verificationStatus === "pending" && (
              <Card className="bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-amber-500" />
                    <h2 className="text-xl font-semibold">Under Review</h2>
                  </div>
                  <p className="text-slate-600">
                    Your profile is under review. You’ll be notified once
                    verified.
                  </p>
                </CardContent>
              </Card>
            )}

            {verificationStatus === "rejected" && (
              <Card className="bg-rose-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-rose-500" />
                      <h2 className="text-xl font-semibold">
                        Verification Rejected
                      </h2>
                    </div>
                    {statusBadge}
                  </div>
                  <p className="text-slate-600 mb-3">
                    Please fix the issues and resubmit.
                  </p>
                  <ul className="text-sm list-disc list-inside">
                    {(rejectionReasons ?? []).map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {isVerified && (
              <>
                <section className="space-y-6">
                  <Card className="bg-white">
                    <CardContent className="p-6">
                      <div className="flex justify-between">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                          <div>
                            <h2 className="text-lg font-semibold">
                              Welcome, {profile.displayName || user?.username}
                            </h2>
                            <p className="text-sm text-slate-600">
                              Manage appointments, patients and earnings.
                            </p>
                          </div>
                        </div>
                        {statusBadge}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="p-5 md:col-span-2 lg:col-span-2 bg-white">
                      <div className="flex justify-between mb-4">
                        <h2 className="text-lg font-semibold">
                          Booking & Earnings Overview
                        </h2>
                        <span className="text-xs text-slate-500">
                          Last 6 months
                        </span>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="h-48">
                          <DoctorStatusPie
                            pending={statusChart.pending}
                            completed={statusChart.completed}
                            cancelled={statusChart.cancelled}
                          />
                        </div>

                        <div className="h-48">
                          <RevenueBarChart
                            months={dashboardStats.chart.months}
                            income={dashboardStats.chart.earnings}
                          />
                        </div>
                      </div>
                    </Card>

                    <Tile
                      icon={<Calendar className="w-5 h-5 text-blue-500" />}
                      title="Appointments"
                      value={`${dashboardStats.appointmentsToday}`}
                      hint="Today"
                      onClick={() => navigate("/doctor/appointments")}
                    />

                    <Tile
                      icon={<Users className="w-5 h-5 text-purple-500" />}
                      title="Patients"
                      value={`${dashboardStats.totalPatients}`}
                      hint="Total"
                      onClick={() => navigate("/doctor/patients")}
                    />

                    <Tile
                      icon={
                        <IndianRupee className="w-5 h-5 text-green-500" />
                      }
                      title="Earnings"
                      value={`₹${dashboardStats.earningsThisMonth}`}
                      hint="This month"
                      onClick={() => navigate("/doctor/wallet")}
                    />
                  </div>
                </section>
                <Card className="p-5">
                  <h2 className="text-lg font-semibold mb-3">
                    Most Booked Pet Categories
                  </h2>

                  {petTrends.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No booking trends found.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {petTrends.map((t, i) => (
                        <li
                          key={i}
                          className="flex justify-between p-2 bg-slate-50 rounded-lg border"
                        >
                          <span className="font-medium">
                            {t.categoryName}
                          </span>
                          <span className="text-slate-600">
                            {t.count} bookings
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </>
            )}

            {canShowForm && (
              <section className="mt-4">
                <Card className="bg-white">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">
                      {verificationStatus === "rejected"
                        ? "Update Your Profile"
                        : "Complete Your Profile"}
                    </h3>

                    <div className="space-y-5">
                      <div>
                        <label className="text-sm font-medium block mb-2">
                          Medical Certificate (PDF){" "}
                          <span className="text-rose-500">*</span>
                        </label>
                        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed bg-white cursor-pointer hover:bg-gray-50">
                          <Upload className="w-4 h-4" />
                          <span className="text-sm">
                            {certificateFile?.name || "Choose PDF"}
                          </span>
                          <input
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            onChange={(e) =>
                              handleChooseFile(e.target.files?.[0] ?? null)
                            }
                          />
                        </label>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium block mb-2">
                            Display Name{" "}
                            <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={profile.displayName}
                            onChange={(e) =>
                              setProfile((prev) => ({
                                ...prev,
                                displayName: e.target.value,
                              }))
                            }
                            className="w-full border rounded-lg px-3 py-2 text-sm"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium block mb-2">
                            License Number{" "}
                            <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={profile.licenseNumber}
                            onChange={(e) =>
                              setProfile((prev) => ({
                                ...prev,
                                licenseNumber: e.target.value,
                              }))
                            }
                            className="w-full border rounded-lg px-3 py-2 text-sm"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium block mb-2">
                            Experience (years){" "}
                            <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={profile.experienceYears}
                            onChange={(e) =>
                              setProfile((prev) => ({
                                ...prev,
                                experienceYears:
                                  e.target.value === ""
                                    ? ""
                                    : Number(e.target.value),
                              }))
                            }
                            className="w-full border rounded-lg px-3 py-2 text-sm"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium block mb-2">
                            Consultation Fee (₹){" "}
                            <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={profile.consultationFee}
                            onChange={(e) =>
                              setProfile((prev) => ({
                                ...prev,
                                consultationFee:
                                  e.target.value === ""
                                    ? ""
                                    : Number(e.target.value),
                              }))
                            }
                            className="w-full border rounded-lg px-3 py-2 text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium block mb-2">
                          Specialties <span className="text-rose-500">*</span>
                        </label>
                        <div className="flex flex-wrap gap-2 border rounded-lg px-3 py-2">
                          {profile.specialties.map((s) => (
                            <span
                              key={s}
                              className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs flex items-center gap-1"
                            >
                              {s}
                              <button
                                type="button"
                                onClick={() => onRemoveSpecialty(s)}
                                className="text-gray-500 hover:text-red-500"
                              >
                                ✕
                              </button>
                            </span>
                          ))}

                          <input
                            type="text"
                            value={specialtyInput}
                            onChange={(e) => setSpecialtyInput(e.target.value)}
                            onKeyDown={onAddSpecialty}
                            className="flex-1 min-w-[120px] border-0 focus:ring-0 text-sm"
                            placeholder="Type & press Enter"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium block mb-2">
                          Bio <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          rows={4}
                          value={profile.bio}
                          onChange={(e) =>
                            setProfile((prev) => ({
                              ...prev,
                              bio: e.target.value,
                            }))
                          }
                          className="w-full border rounded-lg px-3 py-2 text-sm"
                          placeholder="Describe your experience and expertise..."
                        />
                      </div>

                      <Button
                        onClick={handleSubmitAll}
                        disabled={!isFormComplete() || isSubmitting}
                        className="bg-green-600 text-white p-2 rounded-lg"
                      >
                        <Send className="w-4 h-4" />
                        {isSubmitting ? "Submitting..." : "Submit for Review"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function Tile({
  icon,
  title,
  value,
  hint,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  hint?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left rounded-2xl w-full bg-white shadow p-5 hover:shadow-xl transition"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
            {icon}
          </div>
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-xl font-semibold">{value}</p>
          </div>
        </div>
        <span className="text-xs text-gray-400">{hint}</span>
      </div>
    </button>
  );
}
