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
}

