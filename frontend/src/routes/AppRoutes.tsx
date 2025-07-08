import { createBrowserRouter } from "react-router-dom";

import LandingPage from "../pages/user/LandingPage";
import Signup from "../pages/auth/Index";
// import OtpVerify from "@/pages/auth/otpverify";

export const router=createBrowserRouter([
    {
        path:'/signup',element:<Signup/>
    },
    {
        path:'/',element:<LandingPage/>
    },
    // {
        // path:'/verifyotp',element:<OtpVerify/>
    // },
])