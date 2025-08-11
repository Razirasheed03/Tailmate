import { createBrowserRouter } from "react-router-dom";
import UserListing from "@/pages/admin/UserListings";
import DoctorListings from "@/pages/admin/DoctorListings";
import LandingPage from "../pages/user/LandingPage";
import Signup from "../components/PageComponents/Signup";
import Login from "../components/PageComponents/Login";
import OtpVerify from "@/components/PageComponents/VerifyOtp";
import ProfilePage from "@/pages/user/ProfilePage";
import ProtectedRoute from "@/components/LogicalComponents/ProtectedRoute";
import ProtectedAdminRoute from "@/components/LogicalComponents/AdminProtectedRoute";
import AdminLandingPage from "@/pages/admin/AdminLandingPage";
import DoctorLandingPage from "@/pages/doctor/LandingPage";
// import { User } from "lucide-react";

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
  element: <ProtectedAdminRoute />, // This renders <Outlet />
  children: [
    {
      path: "",
      element: <AdminLandingPage />, // This renders Navbar, greeting, and <Outlet />
      children: [
        { path: "users", element: <UserListing /> },
        { path: "doctors", element: <DoctorListings /> },
        { index: true, element: <div>Please select an option from above.</div> }
      ]
    }
  ]
},

  {
    path:"/doctor",
    element:<DoctorLandingPage/>
  }
]);
