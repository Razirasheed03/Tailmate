// src/components/UiComponents/AdminNavbar.tsx

import React, { useState, useEffect } from "react";
import { Bell, ChevronDown, LogOut, Menu } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import httpClient from "@/services/httpClient";
import { io } from "socket.io-client";

interface NavbarProps {
  title?: string;
  onMobileMenuToggle?: () => void;
}

const SOCKET_URL = "http://localhost:4000";

const AdminNavbar: React.FC<NavbarProps> = ({ title, onMobileMenuToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = async () => {
    try {
      await httpClient.patch("/notifications/mark-all-read");
      fetchNotifications();
    } catch {
      toast.error("Failed to mark notifications as read");
    }
  };

  const handleNotificationClick = async (n: any) => {
    try {
      await httpClient.patch(`/notifications/${n.id}/read`);
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
      );
    } catch {
      toast.error("Failed to mark notification as read");
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const { data } = await httpClient.get("/notifications?limit=30");
      setNotifications(
        data.data.map((n: any) => ({
          id: n._id,
          message: n.message,
          createdAt: n.createdAt,
          read: n.read,
          doctorId: n.meta?.doctorId,
        }))
      );
    } catch {}
  };

  // Setup real-time
  useEffect(() => {
    (async () => {
      if (user?.role === "admin") {
        await fetchNotifications();

        const socket = io(SOCKET_URL, {
          transports: ["websocket"],
          withCredentials: true,
        });

        socket.on("admin_notification", async (data) => {
          toast.info(data.message);
          await fetchNotifications();
        });

        return () => socket.disconnect();
      }
    })();
  }, [user]);

  const handleLogout = () => {
    logout();
    toast.success("Logged out");
    navigate("/login");
  };

  return (
    <header className="fixed top-0 left-0 w-full bg-white border-b shadow-sm z-40">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">

        {/* LEFT */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>

          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-xs text-gray-500 hidden sm:block">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 relative"
            >
              <Bell className="w-5 h-5 text-gray-700" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white w-4 h-4 flex items-center justify-center rounded-full text-xs">
                  {unreadCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsNotifOpen(false)}
                />
                <div
                  className="absolute right-0 mt-2 w-80 bg-white border rounded-xl shadow-lg z-30"
                >
                  <div className="p-4 border-b font-semibold text-gray-700">
                    <div className="flex items-center justify-between">
                      <span>Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          className="text-xs text-orange-600 hover:underline"
                          onClick={markAllAsRead}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-gray-500 text-sm">No notifications.</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-4 border-b cursor-pointer ${
                            !n.read ? "bg-orange-50" : "hover:bg-gray-50"
                          }`}
                        >
                          <p className="text-sm text-gray-900">
                            {n.message}
                            {!n.read && (
                              <span className="ml-2 w-2 h-2 bg-orange-500 rounded-full inline-block" />
                            )}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(n.createdAt).toLocaleString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg"
            >
              <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <ChevronDown className="w-4 h-4 text-gray-600" />
            </button>

            {isProfileOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsProfileOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-44 bg-white border rounded-xl shadow-lg z-30">
                  <button
                    onClick={handleLogout}
                    className="flex items-center px-4 py-2 w-full hover:bg-red-50 text-red-600 text-sm"
                  >
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminNavbar;
