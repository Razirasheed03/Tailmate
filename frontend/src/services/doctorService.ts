import { API_BASE_URL } from "@/constants/apiRoutes";
import axios from "axios";


const client = axios.create({ baseURL: API_BASE_URL, withCredentials: true });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});
let isRefreshing = false;
let queue: Array<() => void> = [];

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error?.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (isRefreshing) {
        await new Promise<void>((resolve) => queue.push(resolve));
      }

      try {
        isRefreshing = true;
        const refreshRes = await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );
        const newAccess = refreshRes?.data?.accessToken;
        if (newAccess) {
          localStorage.setItem("auth_token", newAccess);
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${newAccess}`;
          queue.forEach((fn) => fn());
          queue = [];
          return client.request(original);
        }
      } catch (e) {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export const doctorService = {

  uploadCertificate: async (file: File) => {
    const form = new FormData();
    form.append("certificate", file);
    const { data } = await client.post("/doctor/verification/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data as {
      certificateUrl: string;
      verification: { status: "pending" | "verified" | "rejected"; rejectionReasons?: string[] };
    };
  },
  getVerification: async () => {
    const { data } = await client.get("/doctor/verification");
    return data.data as {
      status: "pending" | "verified" | "rejected";
      certificateUrl?: string;
      rejectionReasons?: string[];
    };
  },
  getProfile: async () => {
const { data } = await client.get("/doctor/profile");
// server should return { success, data: profile }
return data.data as {
displayName?: string;
bio?: string;
specialties?: string[];
experienceYears?: number;
licenseNumber?: string;
avatarUrl?: string;
consultationFee?: number;
};
},
updateProfile: async (payload: {
displayName?: string;
bio?: string;
specialties?: string[];
experienceYears?: number;
licenseNumber?: string;
avatarUrl?: string;
consultationFee?: number;
}) => {
const { data } = await client.put("/doctor/profile", payload);
// server should return { success, data: updatedProfile }
return data.data as {
displayName?: string;
bio?: string;
specialties?: string[];
experienceYears?: number;
licenseNumber?: string;
avatarUrl?: string;
consultationFee?: number;
};
},
uploadAvatar: async (file: File) => {
const form = new FormData();
form.append("avatar", file);
const { data } = await client.post("/doctor/profile/avatar", form, {
headers: { "Content-Type": "multipart/form-data" },
});
// expecting { success, data: { avatarUrl } }
return (data?.data?.avatarUrl as string) || "";
},
};
