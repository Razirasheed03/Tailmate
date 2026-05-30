import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import userService, { type SignupPayload } from "@/services/userService";
import { AuthField, getInputClassName } from "@/components/auth/AuthField";
import {
  AuthFooterLink,
  AuthHeading,
  AuthShell,
} from "@/components/auth/AuthShell";
import { authPrimaryBtn, authToggleBtn } from "@/components/auth/authStyles";

type Role = "admin" | "doctor" | "user";

interface SignupFormInputs {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: Role;
}

function PasswordToggle({
  show,
  onToggle,
}: {
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={authToggleBtn}
      aria-label={show ? "Hide password" : "Show password"}
    >
      {show ? (
        <EyeOff className="h-4 w-4 lg:h-[18px] lg:w-[18px]" />
      ) : (
        <Eye className="h-4 w-4 lg:h-[18px] lg:w-[18px]" />
      )}
    </button>
  );
}

const Signup = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormInputs>({
    defaultValues: { role: "user" },
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
      if (error?.code === "ECONNABORTED") {
        toast.loading("Waking up server, please wait…", { duration: 4000 });
        return;
      }

      toast.error(
        error?.response?.data?.message || "Signup failed. Please try again."
      );
    }
  };

  return (
    <AuthShell illustrationSide="right">
      <AuthHeading
        title="Create your account"
        subtitle="Join TailMate — adopt, connect with vets, and care for your pets."
      />

      <form
        className="space-y-3 lg:space-y-3.5"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <AuthField label="Username" type="user" error={errors.username?.message}>
          <input
            type="text"
            {...register("username", {
              required: "Username is required",
              minLength: { value: 3, message: "Username too short" },
            })}
            placeholder="John Doe"
            className={getInputClassName(!!errors.username)}
          />
        </AuthField>

        <AuthField label="Email" type="email" error={errors.email?.message}>
          <input
            type="email"
            {...register("email", {
              required: "Email is required",
              pattern: { value: /^\S+@\S+$/i, message: "Invalid email" },
            })}
            placeholder="you@email.com"
            className={getInputClassName(!!errors.email)}
            autoComplete="email"
          />
        </AuthField>

        <AuthField
          label="Password"
          type="password"
          error={errors.password?.message}
          withToggle
          toggleSlot={
            <PasswordToggle
              show={showPassword}
              onToggle={() => setShowPassword(!showPassword)}
            />
          }
        >
          <input
            type={showPassword ? "text" : "password"}
            {...register("password", {
              required: "Password is required",
              minLength: {
                value: 8,
                message: "Password must be at least 8 characters",
              },
              pattern: {
                value:
                  /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/,
                message:
                  "Include uppercase, lowercase, number, and special character",
              },
            })}
            placeholder="Create a strong password"
            className={getInputClassName(!!errors.password, true)}
            autoComplete="new-password"
          />
        </AuthField>

        <AuthField
          label="Confirm password"
          type="password"
          error={errors.confirmPassword?.message}
          withToggle
          toggleSlot={
            <PasswordToggle
              show={showConfirmPassword}
              onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
            />
          }
        >
          <input
            type={showConfirmPassword ? "text" : "password"}
            {...register("confirmPassword", {
              required: "Please confirm password",
              validate: (value) =>
                value === passwordValue || "Passwords do not match",
            })}
            placeholder="Confirm your password"
            className={getInputClassName(!!errors.confirmPassword, true)}
            autoComplete="new-password"
          />
        </AuthField>

        <label className="flex cursor-pointer items-start gap-2.5 rounded-2xl border border-[#e4a574]/15 bg-gradient-to-r from-[#f3e8d3]/35 to-[#fde8d3]/25 px-3 py-2.5 transition hover:from-[#f3e8d3]/50 hover:to-[#fde8d3]/35 lg:rounded-xl">
          <input
            id="asDoctor"
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-[#e4a574] focus:ring-[#e4a574]/30"
            {...register("role")}
            onChange={(e) => {
              const checked = e.target.checked;
              const roleField = document.getElementById(
                "role-hidden"
              ) as HTMLInputElement;
              roleField.value = checked ? "doctor" : "user";
              roleField.dispatchEvent(new Event("input", { bubbles: true }));
            }}
          />
          <span className="text-xs leading-snug text-gray-700 lg:text-sm">
            I want to work with TailMate as a veterinarian
          </span>
          <input id="role-hidden" type="hidden" {...register("role")} />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`${authPrimaryBtn} mt-0.5 ${isSubmitting ? "cursor-not-allowed" : ""}`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Creating account…
            </>
          ) : (
            "Create account"
          )}
        </button>

        <AuthFooterLink
          text="Already have an account?"
          linkText="Sign in"
          to="/login"
        />
      </form>
    </AuthShell>
  );
};

export default Signup;
