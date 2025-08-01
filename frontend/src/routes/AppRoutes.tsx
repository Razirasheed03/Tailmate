import { createBrowserRouter } from "react-router-dom";

import LandingPage from "../pages/user/LandingPage";
import Signup from "../components/mainComp/Signup";
import Login from "../components/mainComp/Login";
import OtpVerify from "@/components/mainComp/VerifyOtp";

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
    path: "/verify-otp",
    element: <OtpVerify />,
  },
]);
