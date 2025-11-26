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
import Profile from "@/pages/doctor/Profile";
import PetCategory from "@/pages/admin/PetCategory";
import Marketplace from "@/pages/user/Marketplace";
import ListingDetail from "@/pages/user/ListingDetail";
import Listings from "@/pages/user/Profile/Listings";
import Appointments from "@/pages/doctor/Appointments";
import Vets from "@/pages/user/Vets";
import VetDetail from "@/pages/user/VetDetail";
import Checkout from "@/pages/user/Checkout";
import BookingConfirm from "@/pages/user/BookingConfirm";
import DoctorSessions from "@/pages/doctor/Sessions";
import Success from "@/pages/payments/Success";
import DoctorWallet from "@/pages/doctor/Wallet";
import SessionDetailPage from "@/pages/doctor/SessionDetail";
import VerifiedDoctorRoute from "@/components/LogicalComponents/VerifiedDoctorRoute";
import Bookings from "@/pages/user/Profile/Bookings";
import Wallet from "@/pages/user/Profile/Wallet";
import Earnings from "@/pages/admin/Earnings";
import DashboardPage from "@/pages/admin/DashboardPage";
import Matchmaking from "@/pages/user/Matchmaking";

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

  // User routes
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
          { path: "listings", element: <Listings /> },
          {path:"bookings",element:<Bookings/>},
          {path:"wallet",element:<Wallet/>}
        ],
      },
    ],
  },
  {
    path: "/vets",
    element: <Vets />
  },
  {
    path: "/vets/:id",
    element: <VetDetail />
  },
  {
    path: "/marketplace",
    element: <Marketplace />
  },
  {
    path: "/marketplace/:id",
    element: <ListingDetail />
  },
  {
    path: "/checkout",
    element: <Checkout />
  },
  {
    path: "/booking/confirm",
    element: <BookingConfirm />
  },
  { path: "/payments/Success", element: <Success /> },
  {path:"/matchmaking",element:<Matchmaking/>},

  // Admin area
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
          { path: "addpetcategory", element: <PetCategory /> },
          {path:"earnings",element:<Earnings/>},
          { index: true, element: <DashboardPage /> },

        ],
      },
    ],
  },

  // Doctor area - All routes under DoctorProtectedRoute
  {
    path: "/doctor",
    element: <DoctorProtectedRoute />,
    errorElement: <RouteErrorElement />,
    children: [
      // Always accessible (no verification required)
      { index: true, element: <DoctorLandingPage /> },
      { path: "profile", element: <Profile /> },

      // Verified-only routes
      {
        path: "appointments",
        element: (
          <VerifiedDoctorRoute>
            <Appointments />
          </VerifiedDoctorRoute>
        ),
      },
      {
        path: "sessions",
        element: (
          <VerifiedDoctorRoute>
            <DoctorSessions />
          </VerifiedDoctorRoute>
        ),
      },
      {
        path: "sessions/:id",
        element: (
          <VerifiedDoctorRoute>
            <SessionDetailPage />
          </VerifiedDoctorRoute>
        ),
      },
      {
        path: "wallet",
        element: (
          <VerifiedDoctorRoute>
            <DoctorWallet />
          </VerifiedDoctorRoute>
        ),
      },
    ],
  },
  

  // 404 (must be last)
  { path: "*", element: <NotFound />, errorElement: <RouteErrorElement /> },
]);