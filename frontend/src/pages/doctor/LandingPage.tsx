import React, { useState, useMemo, useEffect, useRef } from "react";
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
  MessageSquare,
  DollarSign,
  AlertTriangle,
  Send,
  Bell,
} from "lucide-react";
import { doctorService } from "@/services/doctorService";
import DoctorSidebar from "@/components/UiComponents/DoctorSidebar";
import { toast } from "sonner";
import { io, Socket } from "socket.io-client";

type VerificationStatus = "not_submitted" | "pending" | "verified" | "rejected";

type ProfileData = {
  displayName: string;
  bio: string;
  specialties: string[];
  experienceYears: number | "";
  licenseNumber: string;
  consultationFee: number | "";
};

type DoctorNotification = {
  id: string;
  message: string;
  date?: string;
  time?: string;
  createdAt?: string;
  bookingId?: string;
  bookingsUrl?: string;
  read: boolean;
};


const SOCKET_URL = "http://localhost:4000"; // update as needed

export default function DoctorLandingPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>("not_submitted");
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [rejectionReasons, setRejectionReasons] = useState<string[] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmittedCertificate, setHasSubmittedCertificate] = useState(false);
   const [notifications, setNotifications] = useState<DoctorNotification[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length

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
        setHasSubmittedCertificate(!!v.certificateUrl);

        if (v.rejectionReasons?.length) setRejectionReasons(v.rejectionReasons);

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

   useEffect(() => {
    if (user?.role === "doctor" && user?._id) {
      const socket = io(SOCKET_URL, {
        withCredentials: true, transports: ["websocket"],
      });
      socketRef.current = socket;
      socket.emit("identify_as_doctor", user._id);

      socket.on("doctor_notification", (data) => {
        toast.info(data.message || "New booking received!");
        setNotifications(prev => [
          {
            id: `${Date.now()}`,
            message: data.message,
            date: data.date,
            time: data.time,
            createdAt: data.createdAt,
            bookingId: data.bookingId,
            bookingsUrl: data.bookingsUrl,
            read: false,
          },
          ...prev,
        ]);
      });
      return () => { socket.disconnect(); };
    }
  }, [user]);

  const handleMarkAllAsRead = () =>
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const handleViewAllNotifications = () => {
    setShowAllNotifications(true); setIsNotificationOpen(true);
  };

  // Notification click
  const handleNotificationClick = (notification: DoctorNotification) => {
    setNotifications(prev =>
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
    // Navigate to bookings page (customize route if needed)
    if (notification.bookingsUrl) navigate(notification.bookingsUrl);
  };
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
          Under Review
        </span>
      );
    if (verificationStatus === "rejected")
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
          Rejected
        </span>
      );
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
        Not Submitted
      </span>
    );
  }, [verificationStatus]);

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

  const isFormComplete = () => {
    return !!(
      certificateFile &&
      profile.displayName.trim() &&
      profile.bio.trim() &&
      profile.specialties.length > 0 &&
      profile.experienceYears !== "" &&
      profile.licenseNumber.trim() &&
      profile.consultationFee !== ""
    );
  };

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
      setHasSubmittedCertificate(true);
      setRejectionReasons(null);
      toast.success("Submitted for admin review!");
    } catch (e: any) {
      console.error("Submission error:", e);
      toast.error(
        e?.response?.data?.message || e?.message || "Submission failed"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Notification dropdown renderer ---
   const renderNotifications = notifications.length === 0 ? (
    <div className="p-4 text-sm text-gray-500">
      No notifications yet.
    </div>
  ) : (
    notifications.map((notification) => (
      <div
        key={notification.id}
        className={`p-4 border-b border-gray-100 transition-colors cursor-pointer ${
          !notification.read ? "bg-orange-50" : "hover:bg-gray-50"
        }`}
        onClick={() => handleNotificationClick(notification)}
      >
        <p className="text-sm font-medium text-gray-900">
          {notification.message}
          {!notification.read && (
            <span className="ml-2 inline-block align-middle w-2 h-2 bg-orange-500 rounded-full"></span>
          )}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : ""}
        </p>
      </div>
    ))
  );


 const actions = (
    <div className="flex gap-2 items-center relative">
      <Button variant="outline" className="border-[#E5E7EB] bg-white hover:bg-white/90"
        onClick={async () => { await logout(); navigate("/login"); }}>Logout</Button>
      <div className="relative inline-block">
        <Button variant="outline" className="relative border-[#E5E7EB] bg-white hover:bg-white/90"
          style={{ padding: 0, minWidth: '40px' }}
          onClick={() => setIsNotificationOpen(!isNotificationOpen)}>
          <Bell className="w-6 h-6 text-gray-700" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
        {(isNotificationOpen || showAllNotifications) && (
          <>
            <div className="fixed inset-0 z-10"
              onClick={() => { setIsNotificationOpen(false); setShowAllNotifications(false); }} />
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                {notifications.length > 0 && (
                  <button
                    className="text-xs px-3 py-1 bg-orange-100 text-orange-600 rounded hover:bg-orange-200 transition-colors"
                    onClick={handleMarkAllAsRead}>Mark all as read</button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {renderNotifications}
              </div>
              <div className="p-2 border-t border-gray-200">
                <button
                  className="w-full text-center text-sm text-orange-600 hover:text-orange-700 py-2"
                  onClick={handleViewAllNotifications}
                >
                  View all notifications
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      <Button
        variant="outline"
        className="border-[#E5E7EB] bg-white hover:bg-white/90"
        onClick={() => navigate("/")}
      >
        Go to Site
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white via-[#F9FAFB] to-[#F3F6FA] text-[#1F2937]">
      <div className="flex">
        <DoctorSidebar isVerified={isVerified} />
        <div className="flex-1 min-h-screen">
          <header className="border-b border-[#EEF2F7] bg-white/70 backdrop-blur">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
              <h1 className="text-lg font-semibold">Doctor Portal</h1>
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#6B7280]">
                  {user?.username ?? "doctor"}
                </span>
                {statusBadge}
                {actions}
              </div>
            </div>
          </header>
          <main className="container mx-auto px-6 py-8">
            {verificationStatus === "pending" && (
              <Card className="border-0 bg-white/80 backdrop-blur rounded-2xl shadow-[0_10px_25px_rgba(16,24,40,0.06)]">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-amber-500" />
                    <h2 className="text-xl font-semibold">Under Review</h2>
                  </div>
                  <p className="text-[#6B7280]">
                    Your profile and certificate are being reviewed. You'll be
                    notified once verified.
                  </p>
                </CardContent>
              </Card>
            )}

            {verificationStatus === "rejected" && (
              <Card className="border-0 bg-rose-50 rounded-2xl shadow-[0_10px_25px_rgba(16,24,40,0.06)] mb-6">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                    <h2 className="text-xl font-semibold">
                      Verification Rejected
                    </h2>
                  </div>
                  <p className="text-[#6B7280] mb-3">
                    Please fix the issues and resubmit.
                  </p>
                  <ul className="space-y-2 text-sm text-[#374151] list-disc list-inside">
                    {(
                      rejectionReasons ?? [
                        "Document unclear",
                        "Missing information",
                      ]
                    ).map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* {isVerified && (
              <section className="space-y-6">
                <Card className="border-0 bg-white/80 backdrop-blur rounded-2xl shadow-[0_10px_25px_rgba(16,24,40,0.06)]">
                  <CardContent className="p-6 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h2 className="text-lg font-semibold">
                        Welcome, {profile.displayName || user?.username}
                      </h2>
                      <p className="text-sm text-[#6B7280]">
                        You're verified. Manage appointments, patients, and earnings.
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Tile
                    icon={<Calendar className="w-5 h-5 text-[#0EA5E9]" />}
                    title="Appointments"
                    value="3"
                    hint="Today"
                    onClick={() => navigate("/doctor/appointments")}
                  />
                  <Tile
                    icon={<Users className="w-5 h-5 text-[#8B5CF6]" />}
                    title="Patients"
                    value="128"
                    hint="Total"
                    onClick={() => navigate("/doctor/patients")}
                  />
                  <Tile
                    icon={<MessageSquare className="w-5 h-5 text-[#F59E0B]" />}
                    title="Messages"
                    value="7"
                    hint="Unread"
                    onClick={() => navigate("/doctor/messages")}
                  />
                  <Tile
                    icon={<DollarSign className="w-5 h-5 text-[#22C55E]" />}
                    title="Earnings"
                    value="$2,340"
                    hint="This month"
                    onClick={() => navigate("/doctor/wallet")}
                  />
                </div>
              </section>
            )} */}

            {canShowForm && (
              <section className="mt-8">
                <Card className="border-0 bg-white/80 backdrop-blur rounded-2xl shadow-[0_10px_25px_rgba(16,24,40,0.06)]">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">
                      {verificationStatus === "rejected"
                        ? "Update Your Profile"
                        : "Complete Your Profile"}
                    </h3>
                    <div className="space-y-5">
                      <div>
                        <label className="text-sm font-medium block mb-2">
                          Medical Certificate (PDF) <span className="text-rose-500">*</span>
                        </label>
                        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-[#E5E7EB] bg-white cursor-pointer hover:bg-gray-50">
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
                            Display Name <span className="text-rose-500">*</span>
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
                            placeholder="Dr. Jane Doe"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium block mb-2">
                            License Number <span className="text-rose-500">*</span>
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
                            placeholder="TCMC/123456"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium block mb-2">
                            Experience (years) <span className="text-rose-500">*</span>
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
                            placeholder="8"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium block mb-2">
                            Consultation Fee (₹) <span className="text-rose-500">*</span>
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
                            placeholder="1200"
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
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 inline-flex items-center gap-2"
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
      className="text-left group rounded-2xl w-full border-0 bg-white/80 backdrop-blur shadow-[0_10px_25px_rgba(16,24,40,0.06)] ring-1 ring-black/5 p-5 hover:shadow-[0_14px_34px_rgba(16,24,40,0.10)] transition"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#F3F4F6] flex items-center justify-center">
            {icon}
          </div>
          <div>
            <p className="text-sm text-[#6B7280]">{title}</p>
            <p className="text-xl font-semibold">{value}</p>
          </div>
        </div>
        <span className="text-xs text-[#9CA3AF]">{hint}</span>
      </div>
    </button>
  );
}
