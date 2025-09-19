export const API_BASE_URL = "http://localhost:4000/api";

export const AUTH_ROUTES = {
  LOGIN: `${API_BASE_URL}/auth/login`,
  LOGOUT: `${API_BASE_URL}/auth/logout`,
  SIGNUP: `${API_BASE_URL}/auth/signup`,
  REFRESH: `${API_BASE_URL}/auth/refresh-token`,
  FORGOT_PASSWORD: `${API_BASE_URL}/auth/forgot-password`,
  RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password`,
  RESEND_OTP:`${API_BASE_URL}/auth/resend-otp`
};

export const USER_ROUTES = {
  PROFILE: `${API_BASE_URL}/user/profile`,
  UPDATE_PROFILE: `${API_BASE_URL}/user/update`,
};
