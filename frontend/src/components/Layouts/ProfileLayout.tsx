import React, { useState } from "react";
import Navbar from "@/components/UiComponents/AdminNavbar";
import { NavLink, Outlet } from "react-router-dom";
import { User, Shield, PawPrint } from "lucide-react";

const navItemClasses = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
    isActive
      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-sm"
      : "text-gray-700 hover:bg-gray-100"
  }`;

const ProfileLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 fixed h-screen z-40">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">My Profile</h2>
        </div>
        <nav className="flex flex-col gap-2 p-4">
          <NavLink to="personal" className={navItemClasses} end>
            <User className="w-4 h-4" />
            <span>Personal</span>
          </NavLink>

          <NavLink to="security" className={navItemClasses}>
            <Shield className="w-4 h-4" />
            <span>Security</span>
          </NavLink>

          <NavLink to="pets" className={navItemClasses}>
            <PawPrint className="w-4 h-4" />
            <span>Pet Profiles</span>
          </NavLink>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 lg:ml-64">
        {/* Navbar re-used from Dashboard */}
        <Navbar
          title="Profile"
          onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />
        <main className="flex-1 p-6">
          {/* Nested route content */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ProfileLayout;
