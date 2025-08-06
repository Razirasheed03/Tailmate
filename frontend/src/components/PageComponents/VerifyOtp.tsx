import { useEffect, useState } from "react";
import LoginImage from "/loginp.png";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";


const OtpVerify = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      navigate("/");
    }
  }, []);

  // Extract email from navigation state (from signup page)
  const email = (location.state as any)?.email || "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(30); // TIMING NOW 30 SECONDS
  const [isResendEnabled, setIsResendEnabled] = useState(false);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setIsResendEnabled(true);
    }
  }, [timer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleOtpChange = (index: number, value: any) => {
    if (value.length > 1) return;
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: any) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: any) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      if (/^\d$/.test(pastedData[i])) newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
  };

  // **REDEFINED** Resend OTP: 30s cooldown, call backend
  const handleResend = async () => {
    setTimer(30);
    setIsResendEnabled(false);
    setOtp(["", "", "", "", "", ""]);
    try {
      // Call your backend to actually send a new OTP.
      // Adjust the endpoint as needed:
      await axios.post("http://localhost:4000/api/auth/resend-otp", { email });
      alert("A new OTP has been sent to your email.");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Could not resend OTP right now.");
    }
  };

  const isOtpComplete = otp.every((digit) => digit !== "");

  const handleVerify = async () => {
    try {
      const otpString = otp.join("");
      const res = await axios.post("http://localhost:4000/api/auth/verify-otp", {
        email,
        otp: otpString,
      });
      console.log("JWT from backend:", res.data.token);
      localStorage.setItem("auth_token", res.data.token);

      toast.success('Otp Verified and User Created Successfully')
      navigate("/");
    } catch (err: any) {
      alert(err?.response?.data?.message || "OTP verification failed");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#f8f9fa]">
      <>
        <div className="md:w-1/2 w-full flex items-center justify-center relative order-1 md:order-1">
          <div className="relative w-full h-full flex items-end justify-center py-12">
            <div className="absolute bottom-0 w-[360px] h-[600px] md:w-[500px] md:h-[780px] bg-[#f3e8d3] rounded-t-[250px]"></div>
            <img
              src={LoginImage}
              alt="Login Character"
              className="relative z-10 w-[85%] max-w-[400px] md:max-w-[560px] object-contain pb-50"
            />
          </div>
        </div>
        <div className="md:w-1/2 w-full flex items-center justify-center px-6 py-12 order-2 md:order-2">
          <div className="w-full max-w-md">
            <h1 className="text-4xl font-bold mb-4 ml-3 text-gray-900">
              Verify Your Account
            </h1>
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
                      maxLength="1"
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
                    <span className="font-semibold text-[#e4a574]">
                      {formatTime(timer)}
                    </span>
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
      </>
    </div>
  );
};

export default OtpVerify;
