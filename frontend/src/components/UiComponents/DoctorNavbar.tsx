import React, { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/UiComponents/button";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import httpClient from "@/services/httpClient";

export type DoctorNotification = {
  id: string;
  message: string;
  createdAt?: string;
  read: boolean;
};

const SOCKET_URL = "http://localhost:4000";

export default function DoctorNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<DoctorNotification[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (user?.role === "doctor" && user?._id) {
        try {
          const { data } = await httpClient.get<{ data: DoctorNotification[] }>("/notifications?limit=30");
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
        } catch {}

        const socket: Socket = io(SOCKET_URL, {
          withCredentials: true,
          transports: ["websocket"],
        });
        socketRef.current = socket;
        socket.emit("identify_as_doctor", user._id);

        socket.on("doctor_notification", (data) => {
          toast.info(data.message || "New booking received!");
          setNotifications(prev => [
            {
              id: `${Date.now()}`,
              message: data.message,
              createdAt: data.createdAt,
              read: false,
            },
            ...prev,
          ]);
        });
      }
    })();

    return () => {
      mounted = false;
      socketRef.current?.disconnect();
    };
  }, [user]);

  const handleMarkAllAsRead = () =>
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  
  const handleViewAllNotifications = () => {
    setShowAllNotifications(true); 
    setIsNotificationOpen(true);
  };

  const handleNotificationClick = (notification: DoctorNotification) => {
    setNotifications(prev =>
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
    // Optionally navigate based on meta here
  };

  const renderNotifications = notifications.length === 0 ? (
    <div className="p-4 text-sm text-gray-500">
      No notifications yet.
    </div>
  ) : (
    notifications.map((notification) => (
      <div
        key={notification.id}
        className={`p-4 border-b border-gray-100 transition-colors cursor-pointer ${!notification.read ? "bg-orange-50" : "hover:bg-gray-50"}`}
 onClick={() => handleNotificationClick(notification)}
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

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-[#6B7280]">
        {user?.username ?? "doctor"}
      </span>
      <Button
        variant="outline"
        className="border-[#E5E7EB] bg-white hover:bg-white/90"
        onClick={async () => {
          await logout();
          navigate("/login");
        }}
      >
        Logout
      </Button>
      <div className="relative inline-block">
        <Button
          variant="outline"
          className="relative border-[#E5E7EB] bg-white hover:bg-white/90"
          style={{ padding: 0, minWidth: '40px' }}
          onClick={() => setIsNotificationOpen(!isNotificationOpen)}
        >
          <Bell className="w-6 h-6 text-gray-700" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
        {(isNotificationOpen || showAllNotifications) && (
          <>
            {/* Backdrop */}
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
              <div className="p-2 border-t border-gray-200">
                <button
                  className="w-full text-center text-sm text-orange-600 hover:text-orange-700 py-2"
                  onClick={handleViewAllNotifications}
                >
                  View all notifications
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      <Button
        variant="outline"
        className="border-[#E5E7EB] bg-white hover:bg-white/90"
        onClick={() => navigate("/")}
      >
        Go to Site
      </Button>
    </div>
  );
}
