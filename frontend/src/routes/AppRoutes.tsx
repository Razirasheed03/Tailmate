import { createBrowserRouter } from "react-router-dom";

import LandingPage from "../pages/user/LandingPage";
import Signup from "../components/PageComponents/Signup";
import Login from "../components/PageComponents/Login";
import OtpVerify from "@/components/PageComponents/VerifyOtp";
import ProfilePage from "@/pages/user/ProfilePage";
import ProtectedRoute from "@/components/LogicalComponents/ProtectedRoute";
import ProtectedAdminRoute from "@/components/LogicalComponents/AdminProtectedRoute";
import AdminLandingPage from "@/pages/admin/LandingPage";

export const router = createBrowserRouter([
  {
    path: "/signup",
    element: <Signup />
  },
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/",
    element: <LandingPage />
  },
  {
    path: "/profile",
    element: <ProtectedRoute />,
    children: [
      {
        index: true,
        element: <ProfilePage />
      }
    ]
  },
  {
    path: "/verify-otp",
    element: <OtpVerify />,
  },
  {
    path: "/admin",
    element: <ProtectedAdminRoute />,
    children: [
      {
        index: true,
        element: <AdminLandingPage />
      }
    ]
  },
]);
