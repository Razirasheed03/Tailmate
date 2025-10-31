// src/components/LogicalComponents/VerifiedDoctorRoute.tsx
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { doctorService } from "@/services/doctorService";
import { Loader2 } from "lucide-react";

export default function VerifiedDoctorRoute({ children }: { children: React.ReactNode }) {
  const [verified, setVerified] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    (async () => {
      try {
        const v = await doctorService.getVerification();
        if (!mounted) return;
        setVerified(v.status === "verified");
      } catch {
        if (!mounted) return;
        setVerified(false);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-white via-[#F9FAFB] to-[#F3F6FA]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#0EA5E9]" />
          <p className="text-sm text-gray-500">Checking verification status...</p>
        </div>
      </div>
    );
  }

  if (!verified) {
    return <Navigate to="/doctor" replace />;
  }

  return <>{children}</>;
}