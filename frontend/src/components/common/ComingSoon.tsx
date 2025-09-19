// components/common/ComingSoon.tsx
import { ArrowLeft, Hammer, Home } from "lucide-react";
import Navbar from "../UiComponents/UserNavbar";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { APP_ROUTES } from "@/constants/routes";
import { Button } from "../UiComponents/button";

export default function ComingSoon({ title = "Coming Soon", description = "This section is under development." }) {
  const navigate=useNavigate()
  const {user}=useAuth();
  return (
    <>
      {user?.role==='user'&&<Navbar/>}
    <div className="min-h-[50vh] flex items-center justify-center p-6">
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center max-w-md w-full">
        <div className="mx-auto w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
          <Hammer className="w-6 h-6 text-orange-600" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-gray-900">{title}</h2>
        <p className="mt-2 text-sm text-gray-600">{description}</p>
        
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
      </div>
    </div>
    </>
  );
}
