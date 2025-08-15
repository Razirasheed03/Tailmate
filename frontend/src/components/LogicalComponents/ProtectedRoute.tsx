import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useEffect } from "react";

type Role = "admin" | "doctor" | "user";

export default function ProtectedRoute({ allowedRoles }: { allowedRoles?: Role[] }) {
const { isAuthenticated, user, logout } = useAuth();

useEffect(() => {
if (user?.isBlocked) logout();
}, [user, logout]);

if (!isAuthenticated || !user || user.isBlocked) {
return <Navigate to="/login" replace />;
}

if (allowedRoles && !allowedRoles.includes(user.role as Role)) {
// Optionally redirect by role to the correct dashboard
if (user.role === "admin") return <Navigate to="/admin" replace />;
if (user.role === "doctor") return <Navigate to="/doctor" replace />;
return <Navigate to="/home" replace />;
}

return <Outlet />;
}