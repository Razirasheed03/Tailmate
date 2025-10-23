// backend/src/repositories/interfaces/doctor.repository.interface.ts
export interface IDoctorRepository {
  createIfMissing(userId: string): Promise<any>;
  getVerification(userId: string): Promise<any>;
  submitCertificate(userId: string, certificateUrl: string): Promise<any>;
  getProfile(userId: string): Promise<any>;
  updateProfile(userId: string, profile: Partial<{
    displayName: string;
    bio: string;
    specialties: string[];
    experienceYears: number;
    licenseNumber: string;
    avatarUrl: string;
    consultationFee: number;
  }>): Promise<any>;
  saveCertificateUrl(userId: string, certificateUrl: string): Promise<any>;
  submitForReview(userId: string): Promise<any>;
  listSessions(doctorId: string, opts: {
    page: number;
    limit: number;
    scope: "upcoming" | "today" | "past";
    mode?: "video" | "audio" | "inPerson";
    q?: string;
  }): Promise<{ items: any[]; total: number }>; // aggregation with pagination [web:523]

  getSession(doctorId: string, bookingId: string): Promise<any | null>; // single booking detail [web:192]
}
