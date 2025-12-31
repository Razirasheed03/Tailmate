import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

type Role = "admin" | "doctor" | "user";

interface SignupFormInputs {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: Role;
}

const Signup = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<SignupFormInputs>({
    defaultValues: { role: "user" }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isDoctor, setIsDoctor] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) navigate("/");
  }, [navigate]);

  const passwordValue = watch("password");

  const onSubmit = async (data: SignupFormInputs) => {
    try {
      // Replace with your actual signup service call
      console.log("Signup data:", data);
      toast.success("Account created! Please verify your email.");
      navigate("/verify-otp", { state: { email: data.email } });
    } catch (error: any) {
      if (error?.code === "ECONNABORTED") {
        toast.loading("Waking up server, please wait…", { duration: 4000 });
        return;
      }
      toast.error(error?.response?.data?.message || "Signup failed. Please try again.");
    }
  };

  const handleDoctorCheckbox = (checked: boolean) => {
    setIsDoctor(checked);
    setValue("role", checked ? "doctor" : "user");
  };

  // Form fields component to avoid duplication
  const FormFields = ({ isMobile = false }: { isMobile?: boolean }) => (
    <form className={isMobile ? "space-y-3" : "space-y-5"} onSubmit={handleSubmit(onSubmit)}>
      {/* Username */}
      <div>
        <label className={`block font-medium ${isMobile ? 'text-sm text-gray-700 mb-1' : 'text-sm text-gray-600 mb-2'}`}>
          Username
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <svg className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <input
            type="text"
            {...register("username", { required: "Username is required" })}
            placeholder="Enter your username"
            className={`w-full ${isMobile ? 'pl-10 py-2.5 text-sm' : 'pl-12 py-3'} pr-4 border ${errors.username ? 'border-red-400' : 'border-gray-300'} rounded-full focus:outline-none focus:ring-2 focus:ring-[#e4a574] focus:border-transparent bg-white`}
          />
        </div>
        {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
      </div>

      {/* Email */}
      <div>
        <label className={`block font-medium ${isMobile ? 'text-sm text-gray-700 mb-1' : 'text-sm text-gray-600 mb-2'}`}>
          Email
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <svg className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <input
            type="email"
            {...register("email", {
              required: "Email is required",
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email" }
            })}
            placeholder="email@gmail.com"
            className={`w-full ${isMobile ? 'pl-10 py-2.5 text-sm' : 'pl-12 py-3'} pr-4 border ${errors.email ? 'border-red-400' : 'border-gray-300'} rounded-full focus:outline-none focus:ring-2 focus:ring-[#e4a574] focus:border-transparent bg-white`}
          />
        </div>
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
      </div>

      {/* Password */}
      <div>
        <label className={`block font-medium ${isMobile ? 'text-sm text-gray-700 mb-1' : 'text-sm text-gray-600 mb-2'}`}>
          Password
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <svg className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <input
            type={showPassword ? "text" : "password"}
            {...register("password", {
              required: "Password is required",
              minLength: { value: 8, message: "Password must be at least 8 characters" },
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$%^&*\-]).{8,}$/,
                message: "Must include uppercase, lowercase, number, and special character"
              }
            })}
            placeholder="Create a strong password"
            className={`w-full ${isMobile ? 'pl-10 pr-10 py-2.5 text-sm' : 'pl-12 pr-12 py-3'} border ${errors.password ? 'border-red-400' : 'border-gray-300'} rounded-full focus:outline-none focus:ring-2 focus:ring-[#e4a574] focus:border-transparent bg-white`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className={isMobile ? "w-4 h-4" : "w-5 h-5"} /> : <Eye className={isMobile ? "w-4 h-4" : "w-5 h-5"} />}
          </button>
        </div>
        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
      </div>

      {/* Confirm Password */}
      <div>
        <label className={`block font-medium ${isMobile ? 'text-sm text-gray-700 mb-1' : 'text-sm text-gray-600 mb-2'}`}>
          Confirm Password
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <svg className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <input
            type={showConfirmPassword ? "text" : "password"}
            {...register("confirmPassword", {
              required: "Please confirm your password",
              validate: value => value === passwordValue || "Passwords do not match"
            })}
            placeholder="Confirm your password"
            className={`w-full ${isMobile ? 'pl-10 pr-10 py-2.5 text-sm' : 'pl-12 pr-12 py-3'} border ${errors.confirmPassword ? 'border-red-400' : 'border-gray-300'} rounded-full focus:outline-none focus:ring-2 focus:ring-[#e4a574] focus:border-transparent bg-white`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showConfirmPassword ? <EyeOff className={isMobile ? "w-4 h-4" : "w-5 h-5"} /> : <Eye className={isMobile ? "w-4 h-4" : "w-5 h-5"} />}
          </button>
        </div>
        {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
      </div>

      {/* Doctor Checkbox */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={isMobile ? "doctor-checkbox-mobile" : "doctor-checkbox"}
          checked={isDoctor}
          onChange={(e) => handleDoctorCheckbox(e.target.checked)}
          className="w-4 h-4 accent-[#e4a574] rounded"
        />
        <label htmlFor={isMobile ? "doctor-checkbox-mobile" : "doctor-checkbox"} className={`${isMobile ? 'text-xs text-gray-700' : 'text-sm text-gray-600'}`}>
          I want to work with Tailmate as a doctor
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full bg-[#e4a574] hover:bg-[#d4956a] text-white font-medium ${isMobile ? 'py-2.5 text-sm' : 'py-3'} rounded-full transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-70`}
      >
        {isSubmitting ? (
          <>
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="4" opacity="0.25" />
              <path d="M22 12a10 10 0 0 1-10 10" stroke="white" strokeWidth="4" />
            </svg>
            Submitting...
          </>
        ) : (
          "Sign Up"
        )}
      </button>

      {/* Divider */}
      <div className="flex items-center justify-center my-3">
        <span className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>— or —</span>
      </div>

      {/* Login Link */}
      <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 text-center`}>
        Already have an account?{" "}
        <Link to="/login" className="text-[#d4956a] hover:underline font-semibold">
          Login
        </Link>
      </p>
    </form>
  );

  return (
    <div className="min-h-screen w-full bg-[#f8f9fa] relative overflow-hidden">
      {/* Desktop Layout */}
      <div className="hidden md:flex min-h-screen w-full flex-row">
        {/* Left Side - Form */}
        <div className="md:w-1/2 w-full flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <h1 className="text-4xl font-bold mb-8 text-gray-900">
              Create Account!
            </h1>
            <FormFields isMobile={false} />
          </div>
        </div>

        {/* Right Side - Image */}
        <div className="md:w-1/2 w-full flex items-center justify-center relative">
          <div className="relative w-full h-full flex items-end justify-center py-12">
            <div className="absolute bottom-0 w-[500px] h-[780px] bg-[#f3e8d3] rounded-t-[250px]"></div>
            <img
              src="/loginp.png"
              alt="Signup Character"
              className="relative z-10 w-[85%] max-w-[560px] object-contain pb-50"
            />
          </div>
        </div>
      </div>

      {/* Mobile Layout - Arch background with transparent form */}
      <div className="md:hidden min-h-screen w-full bg-[#f3e8d3] flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-5 text-gray-900 text-center">
            Create Account!
          </h1>
          <FormFields isMobile={true} />
        </div>
      </div>
    </div>
  );
};

export default Signup;
