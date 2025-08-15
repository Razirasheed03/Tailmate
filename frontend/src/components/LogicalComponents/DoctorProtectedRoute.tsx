import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useEffect } from "react";

export default function DoctorProtectedRoute() {
  const { isAuthenticated, user, logout } = useAuth();

  useEffect(() => {
    if (user?.isBlocked) logout();
  }, [user, logout]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user || user.isBlocked) return <Navigate to="/login" replace />;
  if (user.role !== "doctor") return <Navigate to="/" replace />;

  return <Outlet />;
}
