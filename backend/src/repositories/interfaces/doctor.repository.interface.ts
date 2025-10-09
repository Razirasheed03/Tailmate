// backend/src/repositories/interfaces/doctor.repository.interface.ts
export interface IDoctorRepository {
  createIfMissing(userId: string): Promise<any>; // unchanged [web:507]
  getVerification(userId: string): Promise<any>; // unchanged [web:507]
  submitCertificate(userId: string, certificateUrl: string): Promise<any>; // unchanged [web:507]
  getProfile(userId: string): Promise<any>; // unchanged [web:507]
  updateProfile(userId: string, profile: Partial<{
    displayName: string;
    bio: string;
    specialties: string[];
    experienceYears: number;
    licenseNumber: string;
    avatarUrl: string;
    consultationFee: number;
  }>): Promise<any>; // unchanged [web:507]

  // NEW: sessions list + detail for doctor dashboard [web:507]
  listSessions(doctorId: string, opts: {
    page: number;
    limit: number;
    scope: "upcoming" | "today" | "past";
    mode?: "video" | "audio" | "inPerson";
    q?: string;
  }): Promise<{ items: any[]; total: number }>; // aggregation with pagination [web:523]

  getSession(doctorId: string, bookingId: string): Promise<any | null>; // single booking detail [web:192]
}
