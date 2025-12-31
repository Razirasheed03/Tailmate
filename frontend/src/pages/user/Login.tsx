import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [backendReady, setBackendReady] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginStep, setLoginStep] = useState<0 | 1 | 2 | 3>(0);

  // Placeholder login function - replace with your actual auth context
  const login = (token: string, user: any) => {
    localStorage.setItem("auth_token", token);
    localStorage.setItem("auth_user", JSON.stringify(user));
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromGoogle = params.get("accessToken");
    const userFromGoogle = params.get("user");

    if (tokenFromGoogle && userFromGoogle) {
      try {
        const parsedUser = JSON.parse(userFromGoogle);

        if (parsedUser?.isBlocked) {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("auth_user");
          return;
        }

        login(tokenFromGoogle, parsedUser);

        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, "", cleanUrl);

        if (parsedUser.role === "admin") {
          navigate("/admin");
        } else if (parsedUser.role === "doctor") {
          navigate("/doctor");
        } else {
          navigate("/home");
        }
        return;
      } catch {
        // ignore parse errors
      }
    }
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
          navigate("/admin");
          return;
        }
        if (user?.role === "doctor") {
          navigate("/doctor");
          return;
        }
        navigate("/home");
      } catch {
        // Ignore parse errors
      }
    }
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;

    const pollHealth = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/health`
        );

        if (res.ok) {
          const data = await res.json();
          if (data.status === "ready" && !cancelled) {
            setBackendReady(true);
            return;
          }
        }
      } catch {
        // ignore
      }

      if (!cancelled) {
        setTimeout(pollHealth, 2000);
      }
    };

    pollHealth();

    return () => {
      cancelled = true;
    };
  }, []);

  const loginStepText = () => {
    switch (loginStep) {
      case 1:
        return "Verifying credentials…";
      case 2:
        return "Securing session…";
      case 3:
        return "Loading your workspace…";
      default:
        return "Logging in…";
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoggingIn(true);
    setLoginStep(1);
    setTimeout(() => setLoginStep(2), 1200);
    setTimeout(() => setLoginStep(3), 2400);

    try {
      while (!backendReady) {
        await new Promise(res => setTimeout(res, 300));
      }

      // Simulated login - replace with your actual userService.login call
      const res = { data: { accessToken: "demo", user: { role: "user" } }, message: "" };
      const accessToken = res?.data?.accessToken;
      const user = res?.data?.user;

      if (!accessToken || !user) {
        setIsLoggingIn(false);
        setLoginStep(0);
        toast.error(res?.message || "Unexpected response from server.");
        return;
      }

      login(accessToken, user);
      toast.success("Login successful!");

      const role = user?.role;
      if (role === "admin") {
        navigate("/admin");
      } else if (role === "doctor") {
        navigate("/doctor");
      } else {
        navigate("/home");
      }
    } catch (error: any) {
      setIsLoggingIn(false);
      setLoginStep(0);
      const msg = error?.response?.data?.message || error?.response?.data?.error || "Login failed. Please check your credentials.";
      toast.error(msg);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`;
  };

  return (
    <div className="min-h-screen w-full bg-[#f8f9fa] relative overflow-hidden">
      {/* Desktop Layout */}
      <div className="hidden md:flex min-h-screen w-full flex-row">
        {/* Left Side - Image */}
        <div className="md:w-1/2 w-full flex items-center justify-center relative">
          <div className="relative w-full h-full flex items-end justify-center py-12">
            <div className="absolute bottom-0 w-[500px] h-[780px] bg-[#f3e8d3] rounded-t-[250px]"></div>
            <img
              src="/loginp.png"
              alt="Login Character"
              className="relative z-10 w-[85%] max-w-[560px] object-contain pb-50"
            />
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="md:w-1/2 w-full flex items-center justify-center px-6 py-12">
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
                className="w-full bg-[#e4a574] hover:bg-[#d4956a] text-white font-medium py-3 rounded-full transition-colors flex items-center justify-center gap-2"
              >
                {isLoggingIn ? (
                  <>
                    <svg
                      className="w-5 h-5 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="white"
                        strokeWidth="4"
                        opacity="0.25"
                      />
                      <path
                        d="M22 12a10 10 0 0 1-10 10"
                        stroke="white"
                        strokeWidth="4"
                      />
                    </svg>
                    {loginStepText()}
                  </>
                ) : (
                  "Login"
                )}
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

      {/* Mobile Layout - Arch background with transparent form */}
      <div className="md:hidden min-h-screen w-full bg-[#f3e8d3] flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-6 text-gray-900 text-center">
            Welcome Back!
          </h1>

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@gmail.com"
                  className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#e4a574] focus:border-transparent bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-3 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#e4a574] focus:border-transparent bg-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-xs text-gray-600 hover:text-gray-800"
            >
              Forgot Password?
            </button>

            <button
              type="submit"
              className="w-full bg-[#e4a574] hover:bg-[#d4956a] text-white font-medium py-3 text-sm rounded-full transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              {isLoggingIn ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="white"
                      strokeWidth="4"
                      opacity="0.25"
                    />
                    <path
                      d="M22 12a10 10 0 0 1-10 10"
                      stroke="white"
                      strokeWidth="4"
                    />
                  </svg>
                  {loginStepText()}
                </>
              ) : (
                "Login"
              )}
            </button>

            <div className="flex items-center justify-center my-4">
              <span className="text-gray-500 text-xs">— or —</span>
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-11 h-11 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </button>
            </div>

            <p className="text-xs text-gray-700 text-center mt-5">
              Don't have an account?{" "}
              <Link to="/signup" className="text-[#d4956a] hover:underline font-semibold">
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
