import axios from "axios";
import { AUTH_ROUTES, USER_ROUTES } from "../constants/apiRoutes";
import type { Role } from "@/types/user";

export interface SignupPayload {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: Role;
}

const userService = {
  login: (email: string, password: string) => {
    return axios.post(
      AUTH_ROUTES.LOGIN,
      { email, password },
      { withCredentials: true }
    );
  },
  signup: (payload: SignupPayload) => {
    return axios.post(
      AUTH_ROUTES.SIGNUP,
      payload,
      { withCredentials: true }
    );
  },

  logout: () => {
    return axios.post(
      AUTH_ROUTES.LOGOUT,
      {},
      { withCredentials: true }
    );
  },

  getProfile: () => {
    return axios.get(USER_ROUTES.PROFILE, { withCredentials: true });
  },

  updateProfile: (profileData: any) => {
    return axios.put(USER_ROUTES.UPDATE_PROFILE, profileData, { withCredentials: true });
  },
};

export default userService;
