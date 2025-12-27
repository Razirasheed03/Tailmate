import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import LoginImage from "/loginp.png";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import userService, { type SignupPayload } from "@/services/userService";

type Role = "admin" | "doctor" | "user";

interface SignupFormInputs {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: Role; // used role instead of isDoctor/admin
}

const Signup = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<SignupFormInputs>({
    defaultValues: { role: "user" }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) navigate("/");
  }, [navigate]);

  const passwordValue = watch("password");

const onSubmit = async (data: SignupFormInputs) => {
  try {
    const payload: SignupPayload = {
      username: data.username,
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      role: data.role,
    };
    const response = await userService.signup(payload);
    if (response.success) {
      navigate("/verify-otp", { state: { email: data.email } });
    }
  } catch (error: any) {
    toast.error(error?.response?.data?.message || "Signup failed");
  }
};


  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#f8f9fa]">
      <div className="md:w-1/2 w-full flex items-center justify-center px-6 py-12 order-2 md:order-1">
        <div className="w-full max-w-md">
          <h1 className="text-4xl font-bold mb-4 text-gray-900">Create Account!</h1>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Username</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  {...register("username", {
                    required: "Username is required",
                    minLength: { value: 3, message: "Username too short" }
                  })}
                  placeholder="John Doe"
                  className={`w-full pl-12 pr-4 py-3 border ${errors.username ? 'border-red-400' : 'border-gray-300'} rounded-full focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent`}
                />
              </div>
              {errors.username && (
                <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Email</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  {...register("email", {
                    required: "Email is required",
                    pattern: { value: /^\S+@\S+$/i, message: "Invalid email" }
                  })}
                  placeholder="email@gmail.com"
                  className={`w-full pl-12 pr-4 py-3 border ${errors.email ? 'border-red-400' : 'border-gray-300'} rounded-full focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent`}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Password</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password", {
                    required: "Password is required",
                    minLength: { value: 8, message: "Password must be at least 8 characters" },
                    pattern: {
                      value: /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&\*\-]).{8,}$/,
                      message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
                    }
                  })}
                  placeholder="Create a Stronger password"
                  className={`w-full pl-12 pr-12 py-3 border ${errors.password ? 'border-red-400' : 'border-gray-300'} rounded-full focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Confirm Password</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  {...register("confirmPassword", {
                    required: "Please confirm password",
                    validate: value => value === passwordValue || "Passwords do not match",
                  })}
                  placeholder="Confirm your password"
                  className={`w-full pl-12 pr-12 py-3 border ${errors.confirmPassword ? 'border-red-400' : 'border-gray-300'} rounded-full focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Role selection (checkbox -> role) */}
            <div className="flex items-center gap-2 pt-2">
              <input
                id="asDoctor"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-[#e4a574] focus:ring-[#e4a574]"
                {...register("role")}
                onChange={(e) => {
                  // Manually set role based on checkbox
                  // react-hook-form: controlled workaround
                  const checked = e.target.checked;
                  const roleField = (document.getElementById("role-hidden") as HTMLInputElement);
                  roleField.value = checked ? "doctor" : "user";
                  roleField.dispatchEvent(new Event("input", { bubbles: true }));
                }}
              />
              <label htmlFor="asDoctor" className="text-sm text-gray-700">
                I want to work with Tailmate as a doctor
              </label>
              {/* Hidden input to hold "role" controlled by checkbox */}
              <input id="role-hidden" type="hidden" {...register("role")} />
            </div>

            <button
              type="submit"
              className="w-full bg-[#e4a574] hover:bg-[#d4956a] text-white font-medium py-3 rounded-full transition-colors duration-200"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Sign Up"}
            </button>

            <div className="flex items-center justify-center my-1">
              <span className="text-gray-400 text-sm">— or —</span>
            </div>

            <p className="text-sm text-gray-600 text-center mt-5">
              Already have an account?{" "}
              <Link to="/login" className="text-[#e4a574] hover:underline font-medium">
                Login
              </Link>
            </p>
          </form>
        </div>
      </div>

      <div className="md:w-1/2 w-full flex items-center justify-center relative order-1 md:order-2">
        <div className="relative w-full h-full flex items-end justify-center py-12">
          <div className="absolute bottom-0 w-[360px] h-[600px] md:w-[500px] md:h-[780px] bg-[#f3e8d3] rounded-t-[250px]"></div>
          <img
            src={LoginImage}
            alt="Signup Character"
            className="relative z-10 w-[85%] max-w-[400px] md:max-w-[560px] object-contain pb-50"
          />
        </div>
      </div>
    </div>
  );
};

export default Signup;
