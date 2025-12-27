import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import LoginImage from "/loginp.png";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import userService from "@/services/userService";
import { APP_ROUTES } from "@/constants/routes";
import { AUTH_ROUTES } from "@/constants/apiRoutes";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  useEffect(() => {
     const params = new URLSearchParams(window.location.search);
  const tokenFromGoogle = params.get("accessToken");
  const userFromGoogle = params.get("user");

  if (tokenFromGoogle && userFromGoogle) {
    try {
      const parsedUser = JSON.parse(userFromGoogle);

      // Blocked users should not be persisted
      if (parsedUser?.isBlocked) {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        return;
      }

      // Save via AuthContext (this writes to localStorage via your effect)
      login(tokenFromGoogle, parsedUser);

      // Clean the URL (remove query params)
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);

      // Redirect by role
      if (parsedUser.role === "admin") {
        navigate(APP_ROUTES.ADMIN_DASHBOARD);
      } else if (parsedUser.role === "doctor") {
        navigate(APP_ROUTES.DOCTOR_DASHBOARD);
      } else {
        navigate(APP_ROUTES.USER_HOME);
      }
      return; // stop further localStorage-based redirect below
    } catch {
      // ignore parse errors and proceed
    }
  }
    const token = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_user");
    if (token && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user?.isBlocked) {
          // Clean up if blocked
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
        // Ignore parse errors
      }
    }
  }, [navigate]);

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const res = await userService.login(email, password);
    const accessToken = res?.data?.accessToken;
    const user = res?.data?.user;

    if (!accessToken || !user) {
      toast.error(res?.message || "Unexpected response from server.");
      return;
    }
    if (user?.isBlocked) {
      toast.error("Account is blocked");
      return;
    }

    login(accessToken, user);
    toast.success("Login successful!");

    const role = user?.role;
    if (role === "admin") {
      navigate(APP_ROUTES.ADMIN_DASHBOARD);
    } else if (role === "doctor") {
      navigate(APP_ROUTES.DOCTOR_DASHBOARD);
    } else {
      navigate(APP_ROUTES.USER_HOME);
    }
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.response?.data?.error || "Login failed. Please check your credentials.";
    toast.error(msg);
  }
};
const handleGoogleLogin = () => {
  window.location.href = `${import.meta.env.VITE_API_BASE_URL}${AUTH_ROUTES.GOOGLE}`;
};

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#f8f9fa]">
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
          <h1 className="text-4xl font-bold mb-8 text-gray-900">
            Welcome Back!
          </h1>

          <form className="space-y-6" onSubmit={handleLogin}>
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
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@gmail.com"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
                  required
                />
              </div>
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
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Forgot Password?
            </button>

            <button
              type="submit"
              className="w-full bg-[#e4a574] hover:bg-[#d4956a] text-white font-medium py-3 rounded-full transition-colors duration-200"
            >
              Login
            </button>

            <div className="flex items-center justify-center my-6">
              <span className="text-gray-400 text-sm">— or —</span>
            </div>

            <div className="flex justify-center space-x-4">
      <button
  type="button"
  onClick={handleGoogleLogin}
  className="w-12 h-12 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
>
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
</button>

            </div>

            <p className="text-sm text-gray-600 text-center mt-6">
              Don't have an account?{" "}
              <Link to="/signup" className="text-[#e4a574] hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
