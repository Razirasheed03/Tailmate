// src/pages/NotFound.tsx
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/UiComponents/UserNavbar";
import { Button } from "@/components/UiComponents/button";
import { Home, ArrowLeft } from "lucide-react";
import { APP_ROUTES } from "@/constants/routes";
import { useAuth } from "@/context/AuthContext";
import FuzzyText from "@/components/UiComponents/FuzzyText";

export default function NotFound() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF7ED] text-[#111827]">
      {user?.role === "user" && <Navbar />}

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        {/* Fuzzy Animated 404 */}
        <div className="relative mb-6">
          <FuzzyText
            baseIntensity={0.2}
            hoverIntensity={0.6}
            enableHover={true}
            fontSize="clamp(4rem, 20vw, 12rem)"
            color="#FB923C"
            fontWeight={900}
          >
            404
          </FuzzyText>
        </div>

        <h1 className="mt-6 text-3xl sm:text-4xl font-extrabold">Page not found</h1>
        <p className="mt-2 text-sm sm:text-base text-[#6B7280]">
          The page you’re looking for doesn’t exist or has moved.
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="border-[#FCD34D]/50 bg-white/70 hover:bg-white text-[#1F2937]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go back
          </Button>
          <Button
            onClick={() => navigate(APP_ROUTES.USER_HOME)}
            className="bg-[#F97316] hover:bg-[#EA580C] text-white"
          >
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
        </div>
      </main>

      <footer className="py-8 border-t border-[#FED7AA] bg-[#FFF7ED]/60">
        <div className="container mx-auto px-6 text-center text-sm text-[#6B7280]">
          © {new Date().getFullYear()} TailMate
        </div>
      </footer>
    </div>
  );
}
