import { Link } from "react-router-dom";
import { PawPrint } from "lucide-react";
import LoginImage from "/loginp.png";
import { authCard, authSecondaryBtn } from "./authStyles";

type AuthShellProps = {
  children: React.ReactNode;
  /** Desktop illustration column — login: left, signup: right */
  illustrationSide?: "left" | "right";
};

export function AuthBrand() {
  return (
    <Link
      to="/"
      className="group mb-3 flex flex-col items-center gap-1 lg:mb-7 lg:items-start"
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f3e8d3] to-[#fde8d3] shadow-sm ring-1 ring-[#e4a574]/15 transition group-hover:scale-[1.03] group-hover:shadow-md">
          <PawPrint className="h-5 w-5 text-[#e4a574]" strokeWidth={2.2} />
        </div>
        <span className="text-xl font-bold tracking-tight">
          <span className="text-gray-900">Tail</span>
          <span className="text-orange-500">Mate</span>
        </span>
      </div>
      <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-gray-400 lg:text-xs">
        Pet care made simple
      </span>
    </Link>
  );
}

function MobileBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 lg:hidden" aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-b from-[#f8f9fa] via-[#fafafa] to-[#f3e8d3]/25" />
      <div className="absolute -left-16 top-20 h-48 w-48 rounded-full bg-[#fde8d3]/40 blur-3xl" />
      <div className="absolute -right-10 bottom-32 h-40 w-40 rounded-full bg-[#e4a574]/10 blur-3xl" />
      <div className="absolute inset-x-0 bottom-0 flex h-[70%] justify-center opacity-[0.14]">
        <div className="relative h-full w-full max-w-[380px]">
          <div className="absolute inset-x-4 bottom-0 top-8 rounded-t-[150px] bg-[#f3e8d3] sm:rounded-t-[175px]" />
          <img
            src={LoginImage}
            alt=""
            className="absolute inset-x-0 bottom-0 h-full w-full object-contain object-bottom"
          />
        </div>
      </div>
    </div>
  );
}

function DesktopIllustration() {
  return (
    <div className="relative flex h-full min-h-[100dvh] w-full min-w-0 items-end justify-center overflow-hidden bg-gradient-to-br from-[#f8f9fa] via-[#faf8f5] to-[#f3e8d3]/40 py-8 xl:py-12">
      <div className="absolute bottom-0 h-[min(780px,88vh)] w-[min(500px,88%)] max-w-full rounded-t-[200px] bg-[#f3e8d3] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] xl:rounded-t-[250px]" />
      <img
        src={LoginImage}
        alt="TailMate pet care"
        className="relative z-10 w-[78%] max-w-[400px] object-contain object-bottom pb-6 xl:w-[85%] xl:max-w-[560px] xl:pb-50 drop-shadow-sm"
      />
    </div>
  );
}

export function AuthShell({ children, illustrationSide = "left" }: AuthShellProps) {
  const illusClass =
    illustrationSide === "left"
      ? "max-lg:hidden lg:flex lg:w-1/2 lg:min-w-0 lg:order-1"
      : "max-lg:hidden lg:flex lg:w-1/2 lg:min-w-0 lg:order-2";
  const panelClass = illustrationSide === "left" ? "lg:order-2" : "lg:order-1";

  return (
    <div className="relative min-h-[100dvh] w-full overflow-x-hidden bg-[#f8f9fa] lg:flex lg:flex-row">
      <MobileBackground />

      <div className={`relative ${illusClass}`}>
        <DesktopIllustration />
      </div>

      <div
        className={`relative z-10 flex w-full min-h-[100dvh] min-w-0 lg:min-h-0 lg:w-1/2 ${panelClass} items-start justify-center overflow-y-auto px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(0.875rem,env(safe-area-inset-top))] sm:px-5 lg:items-center lg:overflow-visible lg:px-8 lg:py-12 lg:pb-12 lg:pt-0 xl:px-10`}
      >
        <div className="mx-auto my-auto w-full max-w-[330px] sm:max-w-[350px] lg:max-w-md lg:my-0">
          <AuthBrand />
          <div className={authCard}>{children}</div>
        </div>
      </div>
    </div>
  );
}

export function AuthHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4 border-b border-gray-100 pb-4 text-center lg:mb-7 lg:border-0 lg:pb-0 lg:text-left">
      <h1 className="text-[1.35rem] font-bold leading-snug tracking-tight text-gray-900 sm:text-2xl lg:text-4xl lg:leading-tight">
        {title}
      </h1>
      {subtitle && (
        <p className="mx-auto mt-1.5 max-w-[280px] text-[13px] leading-relaxed text-gray-500 sm:max-w-none sm:text-sm lg:mt-2 lg:text-base">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function AuthDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="relative my-3.5 flex items-center lg:my-5">
      <div className="grow border-t border-gray-100" />
      <span className="mx-3 shrink-0 rounded-full bg-gray-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
        {label}
      </span>
      <div className="grow border-t border-gray-100" />
    </div>
  );
}

export function AuthFooterLink({
  text,
  linkText,
  to,
}: {
  text: string;
  linkText: string;
  to: string;
}) {
  return (
    <div className="mt-4 border-t border-gray-100 pt-4 text-center lg:mt-6 lg:border-0 lg:pt-0">
      <p className="text-xs text-gray-600 lg:text-sm">
        {text}{" "}
        <Link
          to={to}
          className="font-semibold text-[#e4a574] underline-offset-2 transition hover:text-[#d4956a] hover:underline"
        >
          {linkText}
        </Link>
      </p>
    </div>
  );
}

export function AuthGoogleButton({
  onClick,
  label = "Continue with Google",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button type="button" onClick={onClick} className={authSecondaryBtn}>
      <GoogleIcon className="h-[18px] w-[18px] shrink-0 lg:h-5 lg:w-5" />
      {label}
    </button>
  );
}

export function GoogleIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
