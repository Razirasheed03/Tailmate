import httpClient from "./httpClient";

export const doctorService = {

  uploadCertificate: async (file: File) => {
    const form = new FormData();
    form.append("certificate", file);
    const { data } = await httpClient.post("/doctor/verification/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data as {
      certificateUrl: string;
      verification: { status: "pending" | "verified" | "rejected"; rejectionReasons?: string[] };
    };
  },
  getVerification: async () => {
    const { data } = await httpClient.get("/doctor/verification");
    return data.data as {
      status: "pending" | "verified" | "rejected";
      certificateUrl?: string;
      rejectionReasons?: string[];
    };
  },
  getProfile: async () => {
const { data } = await httpClient.get("/doctor/profile");
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
const { data } = await httpClient.put("/doctor/profile", payload);
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
const { data } = await httpClient.post("/doctor/profile/avatar", form, {
headers: { "Content-Type": "multipart/form-data" },
});
// expecting { success, data: { avatarUrl } }
return (data?.data?.avatarUrl as string) || "";
},
};
