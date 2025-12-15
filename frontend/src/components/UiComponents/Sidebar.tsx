// src/components/UiComponents/Sidebar.tsx

import React from "react";
import {
  Home,
  Users,
  Stethoscope,
  BarChart3,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const menu = [
    { icon: Home, label: "Dashboard", path: "/admin" },
    { icon: Users, label: "Users", path: "/admin/users" },
    { icon: Stethoscope, label: "Doctors", path: "/admin/doctors" },
    { icon: BarChart3, label: "Pet Category", path: "/admin/addpetcategory" },
    { icon: FileText, label: "Earnings", path: "/admin/earnings" },
    { icon: Settings, label: "Settings", path: "/admin/settings" },
  ];

  const handleLogout = () => {
    logout();
    toast.success("Logged out");
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r shadow-lg z-50
        transform transition-transform duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full"} 
        lg:translate-x-0`}
      >
        {/* Brand */}
        <div className="p-5 border-b flex items-center space-x-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold">
            T
          </div>
          <p className="font-bold text-xl text-gray-800">TailMate</p>
        </div>

        {/* User */}
        <div className="p-5 border-b flex items-center space-x-3">
          <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold">{user?.username}</p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>
        </div>

        {/* Menu */}
        <nav className="p-4 space-y-2">
          {menu.map(({ icon: Icon, label, path }) => (
            <Link
              to={path}
              key={path}
              onClick={onClose}
              className={`flex p-3 rounded-lg items-center space-x-3 transition
              ${
                isActive(path)
                  ? "bg-orange-600 text-white"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 w-full p-4 border-t">
          <button
            onClick={handleLogout}
            className="flex p-3 w-full rounded-lg items-center space-x-3 text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
