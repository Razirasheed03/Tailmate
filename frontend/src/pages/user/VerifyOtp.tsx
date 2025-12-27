import { useEffect, useState } from "react";
import LoginImage from "/loginp.png";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { APP_ROUTES } from "@/constants/routes";
import userService from "@/services/userService";
import httpClient from "@/services/httpClient";

const OtpVerify = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Email passed from Signup page
  const email = (location.state as any)?.email || "";

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_user");
    if (token && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user?.isBlocked) {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("auth_user");
          return;
        }
        if (user?.role === "admin") {
          navigate(APP_ROUTES.ADMIN_DASHBOARD);
          return;
        }
        if (user?.role === "doctor") {
          navigate(APP_ROUTES.DOCTOR_DASHBOARD);
          return;
        }
        navigate(APP_ROUTES.USER_HOME);
      } catch {
        // ignore parse errors
      }
    }
  }, [navigate]);

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(30); // 30s to align with backend's strict 30s window
  const [isResendEnabled, setIsResendEnabled] = useState(false);

  // Countdown for resend
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
    setIsResendEnabled(true);
  }, [timer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`) as HTMLInputElement | null;
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`) as HTMLInputElement | null;
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      if (/^\d$/.test(pastedData[i])) newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
  };

  const handleResend = async () => {
    setTimer(30);
    setIsResendEnabled(false);
    setOtp(["", "", "", "", "", ""]);
    try {
      await userService.resendOtp(email)
      toast.success("A new OTP has been sent to your email.");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not resend OTP right now.");
    }
  };

  const isOtpComplete = otp.every((digit) => digit !== "");

  const handleVerify = async () => {
    if (!email) {
      toast.error("Missing email for verification. Please sign up again.");
      return navigate(APP_ROUTES.SIGNUP);
    }

    try {
      const otpString = otp.join("");
    const res = await httpClient.post("/auth/verify-otp", {
  email,
  otp: otpString,
});

     const accessToken = res?.data?.data?.accessToken;
const user = res?.data?.data?.user;

      if (!accessToken || !user) {
        toast.error("Unexpected response from server.");
        return;
      }

      // Persist and sync context
      localStorage.setItem("auth_token", accessToken);
      localStorage.setItem("auth_user", JSON.stringify(user));
      login(accessToken, user);

      toast.success("OTP verified and account created!");

      // Redirect based on role (requirement: after signup, user → /home)
      if (user.role === "admin") {
        navigate(APP_ROUTES.ADMIN_DASHBOARD);
      } else if (user.role === "doctor") {
        navigate(APP_ROUTES.DOCTOR_DASHBOARD);
      } else {
        navigate(APP_ROUTES.USER_HOME);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || "OTP verification failed";
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#f8f9fa]">
      <div className="md:w-1/2 w-full flex items-center justify-center relative order-1 md:order-1">
        <div className="relative w-full h-full flex items-end justify-center py-12">
          <div className="absolute bottom-0 w-[360px] h-[600px] md:w-[500px] md:h-[780px] bg-[#f3e8d3] rounded-t-[250px]"></div>
          <img
            src={LoginImage}
            alt="OTP Illustration"
            className="relative z-10 w-[85%] max-w-[400px] md:max-w-[560px] object-contain pb-50"
          />
        </div>
      </div>

      <div className="md:w-1/2 w-full flex items-center justify-center px-6 py-12 order-2 md:order-2">
        <div className="w-full max-w-md">
          <h1 className="text-4xl font-bold mb-4 ml-3 text-gray-900">Verify Your Account</h1>
          <p className="text-gray-600 mb-8 text-center">
            We've sent a 6-digit verification code to your email address.
            Please enter it below to verify your account.
          </p>

          <div className="space-y-8">
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-600 text-center">
                Enter Verification Code
              </label>
              <div className="flex justify-center space-x-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="w-14 h-14 text-center text-xl font-semibold border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent transition-all duration-200"
                    placeholder="0"
                  />
                ))}
              </div>
            </div>

            <div className="text-center">
              {!isResendEnabled ? (
                <p className="text-gray-500 text-sm">
                  Resend code in{" "}
                  <span className="font-semibold text-[#e4a574]">{formatTime(timer)}</span>
                </p>
              ) : (
                <button
                  onClick={handleResend}
                  className="text-[#e4a574] hover:underline font-medium text-sm"
                >
                  Resend Code
                </button>
              )}
            </div>

            <button
              onClick={handleVerify}
              disabled={!isOtpComplete}
              className={`w-full font-medium py-3 rounded-full transition-all duration-200 ${
                isOtpComplete
                  ? "bg-[#e4a574] hover:bg-[#d4956a] text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Verify Account
            </button>

            <p className="text-sm text-gray-600 text-center mt-6">
              Didn't receive the code?{" "}
              <button className="text-[#e4a574] hover:underline font-medium">
                Contact Support
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtpVerify;
