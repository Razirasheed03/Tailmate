import { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import userService from "@/services/userService";
import { APP_ROUTES } from "@/constants/routes";
import { AUTH_ROUTES } from "@/constants/apiRoutes";
import { AuthField, getInputClassName } from "@/components/auth/AuthField";
import {
  AuthDivider,
  AuthFooterLink,
  AuthGoogleButton,
  AuthHeading,
  AuthShell,
} from "@/components/auth/AuthShell";
import { authPrimaryBtn, authToggleBtn } from "@/components/auth/authStyles";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("blocked") === "true";
    const fromSession = sessionStorage.getItem("auth_blocked") === "1";

    if (!fromUrl && !fromSession) return;

    sessionStorage.removeItem("auth_blocked");
    toast.error("Your account has been blocked by admin.", { duration: 6000 });

    if (fromUrl) {
      params.delete("blocked");
      const qs = params.toString();
      window.history.replaceState(
        {},
        "",
        window.location.pathname + (qs ? `?${qs}` : "")
      );
    }
  }, []);

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
          navigate(APP_ROUTES.ADMIN_DASHBOARD);
        } else if (parsedUser.role === "doctor") {
          navigate(APP_ROUTES.DOCTOR_DASHBOARD);
        } else {
          navigate(APP_ROUTES.USER_HOME);
        }
        return;
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
  }, [navigate, login]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Email and password are required");
      return;
    }

    try {
      setIsLoggingIn(true);

      const res = await userService.login(email, password);
      const accessToken = res?.data?.accessToken;
      const user = res?.data?.user;

      if (!accessToken || !user) {
        toast.error(res?.message || "Login failed");
        return;
      }

      if (user.isBlocked) {
        toast.error("Your account has been blocked by admin.", { duration: 6000 });
        return;
      }

      login(accessToken, user);
      toast.success("Login successful!");

      if (user.role === "admin") {
        navigate(APP_ROUTES.ADMIN_DASHBOARD);
      } else if (user.role === "doctor") {
        navigate(APP_ROUTES.DOCTOR_DASHBOARD);
      } else {
        navigate(APP_ROUTES.USER_HOME);
      }
    } catch (error: any) {
      const data = error?.response?.data;
      if (data?.code === "USER_BLOCKED" || data?.message?.toLowerCase?.().includes("blocked")) {
        toast.error("Your account has been blocked by admin.", { duration: 6000 });
        return;
      }
      const msg = data?.message || data?.error || "Invalid email or password";
      toast.error(msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}${AUTH_ROUTES.GOOGLE}`;
  };

  return (
    <AuthShell illustrationSide="left">
      <AuthHeading
        title="Welcome back"
        subtitle="Sign in to continue caring for your pets with TailMate."
      />

      <form className="space-y-3.5 lg:space-y-5" onSubmit={handleLogin}>
        <AuthField label="Email" type="email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className={getInputClassName()}
            autoComplete="email"
            required
          />
        </AuthField>

        <AuthField
          label="Password"
          type="password"
          withToggle
          toggleSlot={
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className={authToggleBtn}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 lg:h-[18px] lg:w-[18px]" />
              ) : (
                <Eye className="h-4 w-4 lg:h-[18px] lg:w-[18px]" />
              )}
            </button>
          }
        >
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className={getInputClassName(false, true)}
            autoComplete="current-password"
            required
          />
        </AuthField>

        <div className="flex justify-end pt-0.5">
          <button
            type="button"
            onClick={() => navigate("/forgot-password")}
            className="text-xs font-medium text-[#e4a574] transition hover:text-[#d4956a] lg:text-sm"
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoggingIn}
          className={`${authPrimaryBtn} ${isLoggingIn ? "cursor-not-allowed" : ""}`}
        >
          {isLoggingIn ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </button>

        <AuthDivider />

        <AuthGoogleButton onClick={handleGoogleLogin} />

        <AuthFooterLink
          text="Don't have an account?"
          linkText="Create one"
          to="/signup"
        />
      </form>
    </AuthShell>
  );
};

export default Login;
