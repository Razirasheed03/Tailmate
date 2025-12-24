import { useState, useEffect, useRef, useCallback } from "react";
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
  bookingId?: string;
};

const SOCKET_URL = "http://localhost:4000";

export default function DoctorNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<DoctorNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const shownToastRef = useRef<Set<string>>(new Set());

  const unreadCount = notifications.filter(n => !n.read).length;

  /* ----------------------------- API ----------------------------- */

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await httpClient.get<{ data: any[] }>("/notifications?limit=30");
      if (!Array.isArray(data?.data)) return;

      setNotifications(
        data.data.map(n => ({
          id: n._id,
          message: n.message,
          createdAt: n.createdAt,
          read: n.read,
          bookingId: n.meta?.bookingId,
        }))
      );
    } catch (err) {
      console.error("Fetch notifications failed", err);
    }
  }, []);

  const markAllAsRead = async () => {
    try {
      await httpClient.patch("/notifications/mark-all-read");
      fetchNotifications();
    } catch {
      toast.error("Failed to mark notifications as read");
    }
  };

  const handleNotificationClick = async (n: DoctorNotification) => {
    try {
      await httpClient.patch(`/notifications/${n.id}/read`);
      setNotifications(prev =>
        prev.map(x => (x.id === n.id ? { ...x, read: true } : x))
      );
    } catch {}

    if (n.bookingId) {
      setIsOpen(false);
      navigate(`/doctor/appointments?booking=${n.bookingId}`);
    }
  };

  /* ---------------------------- SOCKET ---------------------------- */

  useEffect(() => {
    if (user?.role !== "doctor" || !user?._id) return;

    fetchNotifications();

    if (socketRef.current) return;

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("identify_as_doctor", user._id);
    });

    socket.on("doctor_notification", async data => {
      const key = data.bookingId ?? `${Date.now()}`;

      if (!shownToastRef.current.has(key)) {
        toast.info(data.message || "New notification");
        shownToastRef.current.add(key);
        setTimeout(() => shownToastRef.current.delete(key), 5000);
      }

      fetchNotifications();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?._id, user?.role, fetchNotifications]);

  /* ---------------------------- UI ---------------------------- */

  const renderNotifications =
    notifications.length === 0 ? (
      <div className="p-4 text-sm text-gray-500">No notifications</div>
    ) : (
      notifications.map(n => (
        <div
          key={n.id}
          onClick={() => handleNotificationClick(n)}
          className={`p-4 border-b cursor-pointer ${
            !n.read ? "bg-orange-50" : "hover:bg-gray-50"
          }`}
        >
          <p className="text-sm font-medium">
            {n.message}
            {!n.read && (
              <span className="ml-2 w-2 h-2 bg-orange-500 rounded-full inline-block" />
            )}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {n.createdAt && new Date(n.createdAt).toLocaleString()}
          </p>
        </div>
      ))
    );

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-500">
        {user?.username ?? "doctor"}
      </span>

      {/* Notifications */}
      <div className="relative">
        <Button
          variant="outline"
          className="relative"
          onClick={() => setIsOpen(p => !p)}
        >
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-[9999]"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-[10000]">
              <div className="p-4 border-b flex justify-between">
                <h3 className="font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-orange-600"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {renderNotifications}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Logout */}
      <Button
        variant="outline"
        onClick={async () => {
          await logout();
          navigate("/login");
        }}
      >
        Logout
      </Button>
    </div>
  );
}
