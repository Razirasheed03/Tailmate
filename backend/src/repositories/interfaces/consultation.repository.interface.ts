//repositories/interfaces/consultation.repository.interface.ts
export interface IConsultationRepository {
  create(userId: string, doctorProfileId: string, body: any): Promise<any>;

  findById(id: string): Promise<any | null>;

  findByIdAndUpdate(id: string, updates: any): Promise<any | null>;

  findByVideoRoomId(videoRoomId: string): Promise<any | null>;

  findByBookingId(bookingId: string): Promise<any | null>;

  deleteByBookingId(bookingId: string): Promise<void>;

  findOneAndUpsert(filter: any, updates: any, options: any): Promise<any>;

  listUserConsultations(userId: string, status?: string): Promise<any[]>;

  listDoctorConsultations(
    doctorProfileId: string,
    status?: string
  ): Promise<any[]>;

  findUpcomingConsultations(minutesBefore?: number): Promise<any[]>;

  findActiveConsultations(consultationId: string): Promise<any | null>;

  cancel(
    id: string,
    cancelledBy: string,
    reason: string
  ): Promise<any | null>;
}
