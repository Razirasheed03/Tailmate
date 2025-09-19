// src/pages/profile/ProfileLayout.tsx
import React, { useState } from "react";
import Navbar from "@/components/UiComponents/UserNavbar";
import { NavLink, Outlet } from "react-router-dom";
import { User, Shield, PawPrint, Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import clsx from "clsx";

const itemBase =
  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition";
const itemActive =
  "text-[#111827] bg-white/70 shadow-sm";
const itemInactive =
  "text-[#4B5563] hover:text-[#111827] hover:bg-white/60";

const SideNavItem = ({
  to,
  icon: Icon,
  label,
  end,
  onClick,
}: {
  to: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  end?: boolean;
  onClick?: () => void;
}) => (
  <NavLink
    to={to}
    end={end}
    onClick={onClick}
    className={({ isActive }) =>
      clsx(itemBase, isActive ? itemActive : itemInactive)
    }
  >
    <Icon className="w-4 h-4" />
    <span>{label}</span>
  </NavLink>
);

export default function ProfileLayout() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#F9FAFB] to-[#F3F6FA] text-[#1F2937]">
      {/* Top navbar (same as the one you shared) */}
      <Navbar />

      {/* Page header bar */}
      <div className="border-b border-[#EEF2F7] bg-white/60 backdrop-blur-md">
        <div className="container mx-auto px-6 h-14 flex items-center justify-between">
          <h1 className="text-base sm:text-lg font-semibold text-[#111827]">Profile</h1>

          {/* Mobile open button mirrors Navbar hamburger vibe */}
          <button
            className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-md hover:bg-white/60"
            onClick={() => setOpen(true)}
            aria-label="Open profile menu"
          >
            <Menu className="w-5 h-5 text-[#111827]" />
          </button>
        </div>
      </div>

      {/* Main two-column layout */}
      <div className="container mx-auto px-6 py-8 grid lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block">
          <div className="rounded-2xl bg-white/80 backdrop-blur shadow-[0_10px_25px_rgba(16,24,40,0.06)] ring-1 ring-black/5">
            {/* User summary */}
            <div className="p-5 border-b border-[#EEF2F7]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#FFF1E6] text-[#F97316] flex items-center justify-center font-semibold">
                  {user?.username?.[0]?.toUpperCase() ?? "U"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#111827] truncate">
                    {user?.username ?? "User"}
                  </p>
                  <p className="text-xs text-[#6B7280] truncate">
                    {user?.email ?? "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Section links */}
            <nav className="p-3 flex flex-col gap-1.5">
              <SideNavItem to="personal" icon={User} label="Personal" end />
              <SideNavItem to="security" icon={Shield} label="Security" />
              <SideNavItem to="pets" icon={PawPrint} label="Pet Profiles" />
            </nav>
          </div>
        </aside>

        {/* Content panel */}
        <section className="min-h-[60vh]">
          <div className="rounded-2xl bg-white/80 backdrop-blur shadow-[0_10px_25px_rgba(16,24,40,0.06)] ring-1 ring-black/5">
            <div className="p-5 sm:p-6">
              {/* Nested route content */}
              <Outlet />
            </div>
          </div>
        </section>
      </div>

      {/* Mobile drawer for sidebar */}
      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-80 max-w-[85%] bg-white/90 backdrop-blur shadow-xl ring-1 ring-black/5">
            {/* Drawer header */}
            <div className="px-5 py-4 border-b border-[#EEF2F7] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-[#FFF1E6] text-[#F97316] flex items-center justify-center font-semibold">
                  {user?.username?.[0]?.toUpperCase() ?? "U"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#111827] truncate">
                    {user?.username ?? "User"}
                  </p>
                  <p className="text-xs text-[#6B7280] truncate">
                    {user?.email ?? "—"}
                  </p>
                </div>
              </div>
              <button
                className="inline-flex items-center justify-center w-9 h-9 rounded-md hover:bg-white"
                onClick={() => setOpen(false)}
                aria-label="Close profile menu"
              >
                <X className="w-5 h-5 text-[#111827]" />
              </button>
            </div>

            {/* Drawer nav */}
            <nav className="p-3 flex flex-col gap-1.5">
              <SideNavItem
                to="personal"
                icon={User}
                label="Personal"
                end
                onClick={() => setOpen(false)}
              />
              <SideNavItem
                to="security"
                icon={Shield}
                label="Security"
                onClick={() => setOpen(false)}
              />
              <SideNavItem
                to="pets"
                icon={PawPrint}
                label="Pet Profiles"
                onClick={() => setOpen(false)}
              />
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
