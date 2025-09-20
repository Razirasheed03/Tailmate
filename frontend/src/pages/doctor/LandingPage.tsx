import { useState, useMemo, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/UiComponents/button";
import { Card, CardContent } from "@/components/UiComponents/Card";
import {
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  Calendar,
  Users,
  MessageSquare,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { doctorService } from "@/services/doctorService";
import DoctorSidebar from "@/components/UiComponents/DoctorSidebar";
import { toast } from "sonner";

type VerificationStatus = "pending" | "verified" | "rejected";

export default function DoctorLandingPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>("pending");
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificateFilename, setCertificateFilename] = useState<string | null>(null);
  const [rejectionReasons, setRejectionReasons] = useState<string[] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isVerified = verificationStatus === "verified";

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const v = await doctorService.getVerification();
        if (!isMounted) return;
        setVerificationStatus(v.status);
        if (v.certificateUrl) {
          const parts = v.certificateUrl.split("/");
          setCertificateFilename(parts[parts.length - 1] || "certificate.pdf");
        }
        if (v.rejectionReasons?.length) setRejectionReasons(v.rejectionReasons);
        else setRejectionReasons(null);
      } catch {
        // ignore
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

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

  const handleChooseFile = (file: File | null) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast("Please upload a PDF file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast("File too large. Max 10MB.");
      return;
    }
    setCertificateFile(file);
    setCertificateFilename(file.name);
  };

  const handleSubmitCertificate = async () => {
    if (!certificateFile) {
      toast("Please select a PDF certificate first.");
      return;
    }
    try {
      setIsSubmitting(true);
      const resp = await doctorService.uploadCertificate(certificateFile);
      setVerificationStatus(resp.verification.status);
      setRejectionReasons(null);
      toast("Certificate submitted. Your profile is now under review.");
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Upload failed. Please try again.";
      toast(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const actions = (
    <div className="flex gap-2">
      <Button
        variant="outline"
        className="border-[#E5E7EB] bg-white hover:bg-white/90"
        onClick={async () => {
          await logout();
          navigate("/login");
        }}
      >
        Logout
      </Button>
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
        {/* Sidebar replaced with component */}
        <DoctorSidebar isVerified={isVerified} />

        {/* Main column */}
        <div className="flex-1 min-h-screen">
          {/* Top header */}
          <header className="border-b border-[#EEF2F7] bg-white/70 backdrop-blur">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
              <h1 className="text-lg font-semibold">Doctor Portal</h1>
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#6B7280]">{user?.username ?? "doctor"}</span>
                {statusBadge}
                {actions}
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="container mx-auto px-6 py-8">
            {/* Pending */}
            {verificationStatus === "pending" && (
              <section className="grid lg:grid-cols-2 gap-6">
                <Card className="border-0 bg-white/80 backdrop-blur rounded-2xl shadow-[0_10px_25px_rgba(16,24,40,0.06)]">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-5 h-5 text-amber-500" />
                      <h2 className="text-xl font-semibold">Under Review</h2>
                    </div>
                    <p className="text-[#6B7280]">
                      Thanks for submitting your credentials. The team will verify your document shortly.
                    </p>
                    {certificateFilename && (
                      <p className="mt-4 text-sm">
                        Submitted file: <span className="font-medium">{certificateFilename}</span>
                      </p>
                    )}
                  </CardContent>
                </Card>
              </section>
            )}
            {/* Rejected */}
            {verificationStatus === "rejected" && (
              <section className="grid lg:grid-cols-2 gap-6">
                <Card className="border-0 bg-white/80 backdrop-blur rounded-2xl shadow-[0_10px_25px_rgba(16,24,40,0.06)]">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-rose-500" />
                      <h2 className="text-xl font-semibold">Verification Rejected</h2>
                    </div>
                    <p className="text-[#6B7280]">
                      Please review the reasons and resubmit your certificate.
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-[#374151] list-disc list-inside">
                      {(rejectionReasons ?? ["Document is blurry", "Missing registration number"]).map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

               
              </section>
            )}

            {/* Verified dashboard */}
            {verificationStatus === "verified" && (
              <section className="space-y-6">
                <Card className="border-0 bg-white/80 backdrop-blur rounded-2xl shadow-[0_10px_25px_rgba(16,24,40,0.06)]">
                  <CardContent className="p-6 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h2 className="text-lg font-semibold">Welcome, {user?.username ?? "Doctor"}</h2>
                      <p className="text-sm text-[#6B7280]">
                        You’re verified. Manage appointments, patients, messages, and earnings from here.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Tile
                    icon={<Calendar className="w-5 h-5 text-[#0EA5E9]" />}
                    title="Today’s Appointments"
                    value="3"
                    hint="Next in 25 min"
                    onClick={() => navigate("/doctor/appointments")}
                  />
                  <Tile
                    icon={<Users className="w-5 h-5 text-[#8B5CF6]" />}
                    title="Patients"
                    value="128"
                    hint="5 new this week"
                    onClick={() => navigate("/doctor/patients")}
                  />
                  <Tile
                    icon={<MessageSquare className="w-5 h-5 text-[#F59E0B]" />}
                    title="Unread Messages"
                    value="7"
                    hint="2 urgent"
                    onClick={() => navigate("/doctor/messages")}
                  />
                  <Tile
                    icon={<DollarSign className="w-5 h-5 text-[#22C55E]" />}
                    title="Earnings (Month)"
                    value="$2,340"
                    hint="Next payout Fri"
                    onClick={() => navigate("/doctor/earnings")}
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => navigate("/doctor/appointments")} className="bg-[#0EA5E9] hover:bg-[#0284C7]">
                    Manage Appointments
                  </Button>
                  <Button
                    variant="outline"
                    className="border-[#E5E7EB] bg-white hover:bg-white/90"
                    onClick={() => navigate("/doctor/availability")}
                  >
                    Edit Availability
                  </Button>
                  <Button
                    variant="outline"
                    className="border-[#E5E7EB] bg-white hover:bg-white/90"
                    onClick={() => navigate("/doctor/profile")}
                  >
                    Update Profile
                  </Button>
                </div>
              </section>
            )}

            {/* If not verified: onboarding area */}
            {verificationStatus !== "verified" && (
              <section className="mt-8">
                <Card className="border-0 bg-white/80 backdrop-blur rounded-2xl shadow-[0_10px_25px_rgba(16,24,40,0.06)]">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-3">Upload Certificate (PDF)</h3>
                    <p className="text-sm text-[#6B7280] mb-4">
                      Upload a valid license or certification document to get verified.
                    </p>
                    <div className="flex items-center gap-3">
                      <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-[#E5E7EB] bg-white cursor-pointer hover:bg-white/90">
                        <Upload className="w-4 h-4" />
                        <span className="text-sm">Choose PDF</span>
                        <input
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={(e) => handleChooseFile(e.target.files?.[0] ?? null)}
                        />
                      </label>
                      {certificateFilename && (
                        <span className="text-sm text-[#374151] inline-flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          {certificateFilename}
                        </span>
                      )}
                    </div>
                    <div className="mt-4">
                      <Button
                        onClick={handleSubmitCertificate}
                        disabled={isSubmitting || !certificateFile}
                        className="bg-[#0EA5E9] hover:bg-[#0284C7]"
                      >
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
          <div className="w-9 h-9 rounded-xl bg-[#F3F4F6] flex items-center justify-center">{icon}</div>
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
