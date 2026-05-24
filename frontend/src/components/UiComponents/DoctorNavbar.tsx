import { useState } from "react";
import { Bell } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/UiComponents/button";
import { useRealtimeOptional } from "@/context/RealtimeContext";
import { toast } from "sonner";

export type DoctorNotification = {
  id: string;
  message: string;
  createdAt?: string;
  read: boolean;
  bookingId?: string;
};

export default function DoctorNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const realtime = useRealtimeOptional();

  const [isOpen, setIsOpen] = useState(false);

  const notifications = realtime?.notifications ?? [];
  const unreadCount = realtime?.unreadNotificationCount ?? 0;

  const markAllAsRead = async () => {
    try {
      await realtime?.markAllNotificationsRead();
    } catch {
      toast.error("Failed to mark notifications as read");
    }
  };

  const handleNotificationClick = async (n: DoctorNotification) => {
    try {
      await realtime?.markNotificationRead(n.id);
    } catch {}

    if (n.bookingId) {
      setIsOpen(false);
      navigate(`/doctor/appointments?booking=${n.bookingId}`);
    }
  };

  const renderNotifications =
    notifications.length === 0 ? (
      <div className="p-4 text-sm text-gray-500">No notifications</div>
    ) : (
      notifications.map((n) => (
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
            {n.createdAt && new Date(n.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
          </p>
        </div>
      ))
    );

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-500">{user?.username ?? "doctor"}</span>

      <div className="relative">
        <Button variant="outline" className="relative" onClick={() => setIsOpen((p) => !p)}>
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-[9999]" onClick={() => setIsOpen(false)} />
            <div className="absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-[10000]">
              <div className="p-4 border-b flex justify-between">
                <h3 className="font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-xs text-orange-600">
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">{renderNotifications}</div>
            </div>
          </>
        )}
      </div>

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
