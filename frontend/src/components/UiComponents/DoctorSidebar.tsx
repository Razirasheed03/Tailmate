import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Layers,
    Calendar,
    DollarSign,
    Star,
    Settings,
} from "lucide-react";

type SidebarItem = {
    key: string;
    label: string;
    icon: React.FC<any>;
    to: string;
    requiresVerified?: boolean;
};

const items: SidebarItem[] = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, to: "/doctor" },
    { key: "sessions", label: "Sessions", icon: Layers, to: "/doctor/appointments", requiresVerified: true },
    { key: "bookings", label: "Bookings", icon: Calendar, to: "/doctor/sessions", requiresVerified: true },
    { key: "earnings", label: "Earnings", icon: DollarSign, to: "/doctor/earnings", requiresVerified: true },
    { key: "reviews", label: "Reviews", icon: Star, to: "/doctor/reviews", requiresVerified: true },
    { key: "profile", label: "Profile", icon: Settings, to: "/doctor/profile", requiresVerified: true },
];

export default function DoctorSidebar({ isVerified }: { isVerified: boolean }) {
    const location = useLocation();

    return (
        <aside className="hidden md:flex md:w-64 min-h-screen border-r border-[#EEF2F7] bg-white/80 backdrop-blur">
            <div className="w-full p-4 flex flex-col">
                {/* Brand */}
                <div className="px-2 py-3 mb-3">
                    <div className="text-lg font-extrabold">
                        <span className="text-black">tail</span>
                        <span className="text-orange-500">mate</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">Doctor portal</div>
                </div>

                {/* Nav */}
                <nav className="mt-2 space-y-1">
                    {items.map((item) => {
                        const Icon = item.icon;
                        const isActive =
                            location.pathname === item.to ||
                            (item.key === "dashboard" && location.pathname === "/doctor");
                        const disabled = item.requiresVerified && !isVerified;

                        const className =
                            "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors";
                        const stateClass = disabled
                            ? "text-gray-400 cursor-not-allowed"
                            : isActive
                                ? "bg-[#0EA5E9]/10 text-[#0EA5E9]"
                                : "text-gray-700 hover:bg-gray-100";

                        return disabled ? (
                            <div
                                key={item.key}
                                className={`${className} ${stateClass}`}
                                title="Available after verification"
                                aria-disabled
                            >
                                <Icon className="w-4 h-4" />
                                <span>{item.label}</span>
                            </div>
                        ) : (
                            <NavLink key={item.key} to={item.to} className={`${className} ${stateClass}`}>
                                <Icon className="w-4 h-4" />
                                <span>{item.label}</span>
                            </NavLink>
                        );
                    })}
                </nav>

                {!isVerified && (
                    <div className="mt-auto p-3 rounded-lg bg-amber-50 border border-amber-100 text-amber-800 text-xs">
                        Get Verified to unlock all features.
                    </div>
                )}
            </div>
        </aside>
    );
}
