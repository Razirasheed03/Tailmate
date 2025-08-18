import { createBrowserRouter } from "react-router-dom";
import UserListing from "@/pages/admin/UserListings";
import DoctorListings from "@/pages/admin/DoctorListings";
import LandingPage from "@/pages/user/LandingPage";
import Signup from "@/pages/user/Signup";
import Login from "@/pages/user/Login";
import OtpVerify from "@/pages/user/VerifyOtp";
import ProfilePage from "@/pages/user/ProfilePage";
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
import EditUsername from "@/pages/user/Profile/EditUsername";
import ProfileLayout from "@/components/Layouts/ProfileLayout";

export const router = createBrowserRouter([
// Public
{ path: "/", element: <LandingPage /> },
{ path: "/signup", element: <Signup /> },
{ path: "/login", element: <Login /> },
{ path: "/verify-otp", element: <OtpVerify /> },

// Guest-only
{
path: "/forgot-password",
element: <GuestProtectedRoute />,
children: [{ index: true, element: <ForgotPassword /> }]
},
{
path: "/reset-password",
element: <GuestProtectedRoute />,
children: [{ index: true, element: <ResetPassword /> }]
},

// Protected User Routes (only role "user")
{
path: "/home",
element: <ProtectedRoute allowedRoles={["user"]} />,
children: [{ index: true, element: <HomePage /> }]
},
{
path: "/profile",
element: <ProtectedRoute allowedRoles={["user"]} />,
children: [{ index: true, element: <ProfilePage /> }]
},

// Protected Admin Routes
{
path: "/admin",
element: <ProtectedAdminRoute />,
children: [
{
path: "",
element: <AdminLandingPage />,
children: [
{ path: "users", element: <UserListing /> },
{ path: "doctors", element: <DoctorListings /> },
{ index: true, element: <div>Please select an option from above.</div> }
]
}
]
},

// Protected Doctor Routes
{
path: "/doctor",
element: <DoctorProtectedRoute />,
children: [{ index: true, element: <DoctorLandingPage /> }]
},

{
  path: "/profile",
  element: <ProtectedRoute allowedRoles={["user"]} />, // no children here
  children: [
    { element: <ProfileLayout />, children: [
        { index: true, element: <div className="text-sm text-gray-600">Select a section from the sidebar.</div> },
        { path: "personal", element: <Personal /> },
        { path: "security", element: <Security /> },
        { path: "pets", element: <PetProfiles /> },
    ]},
  ],
}


]);