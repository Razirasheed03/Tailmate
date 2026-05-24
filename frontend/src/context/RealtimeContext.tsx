import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";
import httpClient from "@/services/httpClient";
import { useAuth } from "./AuthContext";

export type AppNotification = {
  id: string;
  message: string;
  createdAt?: string;
  read: boolean;
  bookingId?: string;
  type?: string;
};

type RealtimeContextValue = {
  notifications: AppNotification[];
  unreadNotificationCount: number;
  unreadChatCount: number;
  refreshNotifications: () => Promise<void>;
  refreshChatUnread: () => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  clearChatUnread: () => void;
};

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

function getSocketBaseUrl() {
  const base = import.meta.env.VITE_API_BASE_URL || "";
  return base.replace(/\/api$/, "");
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const shownToastRef = useRef<Set<string>>(new Set());
  const userIdRef = useRef<string | undefined>(user?._id);
  userIdRef.current = user?._id;

  const unreadNotificationCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated || !user?._id) return;
    try {
      const { data } = await httpClient.get<{ data: any[] }>("/notifications?limit=30", {
        suppressGlobalErrorToast: true,
      });
      if (!Array.isArray(data?.data)) return;
      setNotifications(
        data.data.map((n) => ({
          id: n._id,
          message: n.message,
          createdAt: n.createdAt,
          read: n.read,
          bookingId: n.meta?.bookingId,
          type: n.type,
        }))
      );
    } catch {
      // ignore when token invalid on public pages
    }
  }, [isAuthenticated, user?._id]);

  const refreshNotificationsRef = useRef(refreshNotifications);
  refreshNotificationsRef.current = refreshNotifications;

  const prependNotification = useCallback((payload: Partial<AppNotification> & { message: string }) => {
    const id = payload.id || `tmp-${Date.now()}`;
    setNotifications((prev) => {
      if (prev.some((n) => n.id === id)) return prev;
      return [
        {
          id,
          message: payload.message,
          createdAt: payload.createdAt || new Date().toISOString(),
          read: false,
          bookingId: payload.bookingId,
          type: payload.type,
        },
        ...prev,
      ];
    });
  }, []);

  const prependNotificationRef = useRef(prependNotification);
  prependNotificationRef.current = prependNotification;

  useEffect(() => {
    if (!isAuthenticated || !user?._id) {
      setNotifications([]);
      setUnreadChatCount(0);
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    void refreshNotificationsRef.current();

    const token = localStorage.getItem("auth_token");
    if (!token) return;

    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const socket = io(getSocketBaseUrl(), {
      auth: { token },
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    const notifyToast = (key: string, message: string) => {
      if (shownToastRef.current.has(key)) return;
      shownToastRef.current.add(key);
      toast.info(message);
      setTimeout(() => shownToastRef.current.delete(key), 5000);
    };

    socket.on("notification:new", (payload: any) => {
      const key = payload?._id ?? `${Date.now()}`;
      notifyToast(key, payload?.message || "New notification");
      prependNotificationRef.current({
        id: payload?._id,
        message: payload?.message || "New notification",
        createdAt: payload?.createdAt,
        bookingId: payload?.meta?.bookingId,
        type: payload?.type,
      });
      void refreshNotificationsRef.current();
    });

    socket.on("doctor_notification", (payload: any) => {
      const key = payload?.bookingId ?? payload?._id ?? `${Date.now()}`;
      notifyToast(key, payload?.message || "New booking");
      prependNotificationRef.current({
        id: key,
        message: payload?.message || "New booking",
        createdAt: payload?.createdAt,
        bookingId: payload?.bookingId,
        type: "booking",
      });
      void refreshNotificationsRef.current();
    });

    socket.on("chat:receive_message", (message: any) => {
      const senderId = message?.senderId?.toString?.() || message?.senderId;
      const uid = userIdRef.current;
      if (senderId && uid && String(senderId) !== String(uid)) {
        const onChatPage = window.location.pathname.startsWith("/chat");
        if (!onChatPage) {
          setUnreadChatCount((c) => c + 1);
        }
      }
    });

    socket.on("connect", () => {
      void refreshNotificationsRef.current();
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [isAuthenticated, user?._id, user?.role]);

  const markAllNotificationsRead = async () => {
    await httpClient.patch("/notifications/mark-all-read");
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markNotificationRead = async (id: string) => {
    await httpClient.patch(`/notifications/${id}/read`);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearChatUnread = () => setUnreadChatCount(0);

  const refreshChatUnread = async () => {
    return;
  };

  const value: RealtimeContextValue = {
    notifications,
    unreadNotificationCount,
    unreadChatCount,
    refreshNotifications,
    refreshChatUnread,
    markAllNotificationsRead,
    markNotificationRead,
    clearChatUnread,
  };

  return (
    <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) {
    throw new Error("useRealtime must be used within RealtimeProvider");
  }
  return ctx;
}

export function useRealtimeOptional() {
  return useContext(RealtimeContext);
}
