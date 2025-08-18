// src/components/layout/Navbar.tsx
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { PawPrint, ChevronDown, LogOut, User, Calendar, Users, Info, Home } from "lucide-react";
import { Button } from "@/components/UiComponents/button";
import { APP_ROUTES } from "@/constants/routes";
import { useAuth } from "@/context/AuthContext";
import clsx from "clsx";

const NavLink = ({
  to,
  label,
  isActive,
  onClick,
}: {
  to: string;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}) => (
  <Link
    to={to}
    onClick={onClick}
    className={clsx(
      "px-3 py-2 rounded-md text-sm font-medium transition",
      isActive
        ? "text-[#111827] bg-white/70 shadow-sm"
        : "text-[#4B5563] hover:text-[#111827] hover:bg-white/60"
    )}
  >
    {label}
  </Link>
);

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate(APP_ROUTES.LOGIN);
  };

  const gotoDashboard = () => {
    if (user?.role === "admin") return navigate(APP_ROUTES.ADMIN_DASHBOARD);
    if (user?.role === "doctor") return navigate(APP_ROUTES.DOCTOR_DASHBOARD);
    return navigate(APP_ROUTES.USER_HOME);
  };

  const gotoBookSession = () => navigate(APP_ROUTES.BOOK_SESSION);
  const gotoProfile = () => navigate(APP_ROUTES.PROFILE);

  return (
    <header className="sticky top-0 z-50 bg-white/60 backdrop-blur-md border-b border-[#EEF2F7]">
      <div className="relative">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-12 -left-12 w-40 h-40 rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#FDE8E2] via-[#F7F9FF]/60 to-transparent blur-2xl opacity-60" />
          <div className="absolute -bottom-10 -right-10 w-56 h-56 rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#E9F7FF] via-[#FDF6FF]/70 to-transparent blur-3xl opacity-50" />
        </div>

        <nav className="container mx-auto px-6 h-16 flex items-center justify-between relative z-10">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <Link to={APP_ROUTES.LANDING} className="flex items-center gap-2">
              <PawPrint className="w-6 h-6 text-[#F97316]" />
              <span className="text-xl font-bold text-[#111827]">TailMate</span>
            </Link>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-2">
            <NavLink
              to={APP_ROUTES.LANDING}
              label="Home"
              isActive={location.pathname === APP_ROUTES.LANDING}
            />
            <NavLink
              to={APP_ROUTES.COMMUNITY}
              label="Community"
              isActive={location.pathname.startsWith(APP_ROUTES.COMMUNITY)}
            />
            <NavLink
              to={APP_ROUTES.ABOUT}
              label="About Us"
              isActive={location.pathname === APP_ROUTES.ABOUT}
            />
            <NavLink
              to={APP_ROUTES.BOOK_SESSION}
              label="Book Session"
              isActive={location.pathname === APP_ROUTES.BOOK_SESSION}
            />
          </div>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={gotoBookSession}
                  className="border-[#E5E7EB] bg-white/80 hover:bg-white shadow-sm hover:shadow-md"
                >
                  <Calendar className="w-4 h-4 mr-1" />
                  Book Session
                </Button>
                <div className="relative">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setProfileOpen((s) => !s)}
                    className="flex items-center gap-2 text-[#374151]"
                  >
                    <User className="w-4 h-4" />
                    {user?.username ?? "Profile"}
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-44 rounded-xl bg-white shadow-lg ring-1 ring-black/5 py-2">
                      <button
                        onClick={gotoProfile}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-[#F9FAFB] flex items-center gap-2"
                      >
                        <User className="w-4 h-4" />
                        View Profile
                      </button>
                      <button
                        onClick={gotoDashboard}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-[#F9FAFB] flex items-center gap-2"
                      >
                        <Home className="w-4 h-4" />
                        Dashboard
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-[#F9FAFB] text-[#B91C1C] flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(APP_ROUTES.LOGIN)}
                  className="border-[#E5E7EB] bg-white/80 hover:bg-white shadow-sm hover:shadow-md"
                >
                  Login
                </Button>
                <Button
                  size="sm"
                  variant="hero"
                  onClick={() => navigate(APP_ROUTES.SIGNUP)}
                  className="bg-gradient-to-r from-[#FDE68A] via-[#FCA5A5] to-[#BFDBFE] text-[#1F2937] hover:brightness-105 shadow-md hover:shadow-lg"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-md hover:bg-white/60"
            onClick={() => setOpen((s) => !s)}
          >
            <span className="sr-only">Open menu</span>
            <div className="space-y-1.5">
              <span className="block w-6 h-0.5 bg-[#111827]" />
              <span className="block w-6 h-0.5 bg-[#111827]" />
              <span className="block w-6 h-0.5 bg-[#111827]" />
            </div>
          </button>
        </nav>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t border-[#EEF2F7] bg-white/90 backdrop-blur">
            <div className="px-6 py-3 flex flex-col gap-1">
              <NavLink
                to={APP_ROUTES.LANDING}
                label="Home"
                isActive={location.pathname === APP_ROUTES.LANDING}
                onClick={() => setOpen(false)}
              />
              <NavLink
                to={APP_ROUTES.COMMUNITY}
                label="Community"
                isActive={location.pathname.startsWith(APP_ROUTES.COMMUNITY)}
                onClick={() => setOpen(false)}
              />
              <NavLink
                to={APP_ROUTES.ABOUT}
                label="About Us"
                isActive={location.pathname === APP_ROUTES.ABOUT}
                onClick={() => setOpen(false)}
              />
              <NavLink
                to={APP_ROUTES.BOOK_SESSION}
                label="Book Session"
                isActive={location.pathname === APP_ROUTES.BOOK_SESSION}
                onClick={() => setOpen(false)}
              />

              <div className="h-px bg-[#EEF2F7] my-2" />

              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => {
                      setOpen(false);
                      gotoProfile();
                    }}
                    className="px-3 py-2 rounded-md text-left text-sm hover:bg-white/60"
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      setOpen(false);
                      gotoDashboard();
                    }}
                    className="px-3 py-2 rounded-md text-left text-sm hover:bg-white/60"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={async () => {
                      setOpen(false);
                      await handleLogout();
                    }}
                    className="px-3 py-2 rounded-md text-left text-sm text-[#B91C1C] hover:bg-white/60"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setOpen(false);
                      navigate(APP_ROUTES.LOGIN);
                    }}
                    className="w-full border-[#E5E7EB] bg-white/80 hover:bg-white mt-2"
                  >
                    Login
                  </Button>
                  <Button
                    size="sm"
                    variant="hero"
                    onClick={() => {
                      setOpen(false);
                      navigate(APP_ROUTES.SIGNUP);
                    }}
                    className="w-full bg-gradient-to-r from-[#FDE68A] via-[#FCA5A5] to-[#BFDBFE] text-[#1F2937] hover:brightness-105 mt-2"
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
