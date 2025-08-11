import { useAuth } from "@/context/AuthContext";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedDoctorRoute = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!user?.isDoctor) return <Navigate to="/" />;
  return <Outlet />;
};

export default ProtectedDoctorRoute;