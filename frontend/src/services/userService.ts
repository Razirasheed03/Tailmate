import axios from "axios";
import { AUTH_ROUTES, USER_ROUTES } from "../constants/apiRoutes";

const userService = {
  login: (email: string, password: string) => {
    return axios.post(
      AUTH_ROUTES.LOGIN,
      { email, password },
      { withCredentials: true }
    );
  },

  register: (userData: { email: string; password: string; name: string }) => {
    return axios.post(
      AUTH_ROUTES.SIGNUP,
      userData,
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
