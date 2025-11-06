import React, { useState, useEffect, useRef } from "react";
import { Bell, ChevronDown, LogOut, Menu, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { io, Socket } from "socket.io-client";
import httpClient from "@/services/httpClient";

interface NavbarProps {
  title?: string;
  onMobileMenuToggle?: () => void;
}

type NotificationItem = {
  id: string;
  message: string;
  createdAt: string;
  read: boolean;
};

const SOCKET_URL = "http://localhost:4000";

const AdminNavbar: React.FC<NavbarProps> = ({
  title = "Dashboard",
  onMobileMenuToggle,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const socketRef = useRef<Socket | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Fetch notification history + socket.io live
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (user?.role === "admin" && user?._id) {
        // Fetch persistent notification history
        try {
          const { data } = await httpClient.get<{ data: NotificationItem[] }>("/notifications?limit=30");
          if (mounted && Array.isArray(data?.data)) {
            setNotifications(
              data.data.map((n: any) => ({
                id: n._id || `${n.createdAt}`,
                message: n.message,
                createdAt: n.createdAt,
                read: n.read,
              }))
            );
          }
        } catch {
          // ignore (optional toast)
        }

        // SOCKET.IO real-time
        const socket = io(SOCKET_URL, {
          withCredentials: true,
          transports: ["websocket"],
        });
        socketRef.current = socket;

        socket.on("connect", () => {
          // Optionally identify as admin:
          // socket.emit("identify_as_admin", user._id);
          console.log("Socket.IO: Connected (admin)", socket.id);
        });

        socket.on("admin_notification", (data) => {
          toast.info(data.message || "You have a new notification!");
          setNotifications(prev => [
            {
              id: `${Date.now()}`,
              message: data.message,
              createdAt: data.time || new Date().toISOString(),
              read: false,
            },
            ...prev,
          ]);
        });

        return () => {
          mounted = false;
          socket.disconnect();
        };
      }
    })();

    return () => {
      mounted = false;
      socketRef.current?.disconnect();
    };
  }, [user]);

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleViewAllNotifications = () => {
    setShowAllNotifications(true);
    setIsNotificationOpen(true);
  };

  const renderNotifications = notifications.length === 0 ? (
    <div className="p-4 text-sm text-gray-500">
      No notifications yet.
    </div>
  ) : (
    notifications.map((notification) => (
      <div
        key={notification.id}
        className={`p-4 border-b border-gray-100 transition-colors ${
          !notification.read ? "bg-orange-50" : "hover:bg-gray-50"
        }`}
      >
        <p className="text-sm font-medium text-gray-900">
          {notification.message}
          {!notification.read && (
            <span className="ml-2 inline-block align-middle w-2 h-2 bg-orange-500 rounded-full"></span>
          )}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : ""}
        </p>
      </div>
    ))
  );

  // Profile/logout menu as before...
  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-500 hidden sm:block">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Center Section - Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patients, appointments..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2 lg:space-x-4">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            {(isNotificationOpen || showAllNotifications) && (
              <>
                <div
                  className="fixed inset-0 z-[9999]"
                  onClick={() => {
                    setIsNotificationOpen(false);
                    setShowAllNotifications(false);
                  }}
                />
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-[10000]">
                  <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    {notifications.length > 0 && (
                      <button
                        className="text-xs px-3 py-1 bg-orange-100 text-orange-600 rounded hover:bg-orange-200 transition-colors"
                        onClick={handleMarkAllAsRead}
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {renderNotifications}
                  </div>
                  <div className="p-2 border-t border-gray-200"></div>
                </div>
              </>
            )}
          </div>
          {/* Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium text-gray-900">{user?.username || 'User'}</p>
                <p className="text-xs text-gray-500">
                  Admin
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>

            {isProfileOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsProfileOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                  <div className="py-1">
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
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
