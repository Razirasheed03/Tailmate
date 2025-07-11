import { createBrowserRouter } from "react-router-dom";

import LandingPage from "../pages/user/LandingPage";
import Signup from "../pages/auth/Index";
import VerifyOtp from "@/pages/auth/Otpverify";

export const router=createBrowserRouter([
    {
        path:'/signup',element:<Signup/>
    },
    {
        path:'/',element:<LandingPage/>
    },
    {
        path:'/verify-otp',element:<VerifyOtp/>
    },
])