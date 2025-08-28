export interface IDoctorRepository {
  createIfMissing(userId: string): Promise<any>;
  getVerification(userId: string): Promise<any>;
  submitCertificate(userId: string, certificateUrl: string): Promise<any>;
}
