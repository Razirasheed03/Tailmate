import { createBrowserRouter } from "react-router-dom";
import UserListing from "@/pages/admin/UserListings";
import DoctorListings from "@/pages/admin/DoctorListings";
import LandingPage from "@/pages/user/LandingPage";
import Signup from "@/pages/user/Signup";
import Login from "@/pages/user/Login";
import OtpVerify from "@/pages/user/VerifyOtp";
import ProtectedRoute from "@/components/LogicalComponents/ProtectedRoute";
import ProtectedAdminRoute from "@/components/LogicalComponents/AdminProtectedRoute";
import AdminLandingPage from "@/pages/admin/AdminLandingPage";
import DoctorLandingPage from "@/pages/doctor/LandingPage";
import ResetPassword from "@/components/Modals/ResetPassword";
import ForgotPassword from "@/components/Modals/ForgotPassword";
import GuestProtectedRoute from "@/components/LogicalComponents/GuestProtectedRoute";
import HomePage from "@/pages/user/HomePage";
import DoctorProtectedRoute from "@/components/LogicalComponents/DoctorProtectedRoute";
import Personal from "@/pages/user/Profile/Personal";
import Security from "@/pages/user/Profile/Security";
import PetProfiles from "@/pages/user/Profile/PetProfile";
import ProfileLayout from "@/components/Layouts/ProfileLayout";
import NotFound from "@/pages/user/NotFound";
import { RouteErrorElement } from "@/components/common/ErrorBoundary";
import ComingSoon from "@/components/common/ComingSoon";

export const router = createBrowserRouter([
  // Public routes
  { path: "/", element: <LandingPage />, errorElement: <RouteErrorElement /> },
  { path: "/signup", element: <Signup />, errorElement: <RouteErrorElement /> },
  { path: "/login", element: <Login />, errorElement: <RouteErrorElement /> },
  { path: "/verify-otp", element: <OtpVerify />, errorElement: <RouteErrorElement /> },

  // Guest routes
  {
    path: "/forgot-password",
    element: <GuestProtectedRoute />,
    errorElement: <RouteErrorElement />,
    children: [{ index: true, element: <ForgotPassword /> }],
  },
  {
    path: "/reset-password",
    element: <GuestProtectedRoute />,
    errorElement: <RouteErrorElement />,
    children: [{ index: true, element: <ResetPassword /> }],
  },
  {
    path: "/home",
    element: <ProtectedRoute allowedRoles={["user"]} />,
    errorElement: <RouteErrorElement />,
    children: [{ index: true, element: <HomePage /> }],
  },
  ///user routes
  {
    path: "/profile",
    element: <ProtectedRoute allowedRoles={["user"]} />,
    errorElement: <RouteErrorElement />,
    children: [
      {
        element: <ProfileLayout />,
        errorElement: <RouteErrorElement />,
        children: [
          {
            index: true,
            element: (
              <div className="text-sm text-gray-600">
                Select a section from the sidebar.
              </div>
            ),
          },
          { path: "personal", element: <Personal /> },
          { path: "security", element: <Security /> },
          { path: "pets", element: <PetProfiles /> },
        ],
      },
    ],
  },
  {
    path: "/vets",
    element: <ComingSoon />
  },
  {
    path: "/marketplace",
    element: <ComingSoon />
  },
  ///admin areaa
  {
    path: "/admin",
    element: <ProtectedAdminRoute />,
    errorElement: <RouteErrorElement />,
    children: [
      {
        path: "",
        element: <AdminLandingPage />,
        errorElement: <RouteErrorElement />,
        children: [
          { path: "users", element: <UserListing /> },
          { path: "doctors", element: <DoctorListings /> },
          { index: true, element: <div>Please select an option from above.</div> },
        ],
      },
    ],
  },

  // Doctor area
  {
    path: "/doctor",
    element: <DoctorProtectedRoute />,
    errorElement: <RouteErrorElement />,
    children: [{ index: true, element: <DoctorLandingPage /> }],
  },
  // 404 (must be last)
  { path: "*", element: <NotFound />, errorElement: <RouteErrorElement /> },
]);
