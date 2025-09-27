// backend/src/services/interfaces/user.service.interface.ts

// Shared UI mode for availability
export type UIMode = "video" | "audio" | "inPerson";

// Public-facing doctor card used on list page
export type DoctorCard = {
  doctorId: string;
  displayName: string;
  avatarUrl?: string;
  experienceYears?: number;
  specialties?: string[];
  consultationFee?: number;
  isOnline?: boolean;
  nextSlot?: { date: string; time: string };
  modes?: UIMode[];
};

// Doctor detail for the vet detail page
export type DoctorDetail = {
  doctorId: string;
  displayName: string;
  avatarUrl?: string;
  experienceYears?: number;
  specialties?: string[];
  consultationFee?: number;
  bio?: string;
  languages?: string[];
  location?: string;
  modes?: UIMode[];
};

// Slot DTO returned to clients
export type DoctorSlotEntry = {
  _id: string;
  date: string;           // YYYY-MM-DD
  time: string;           // HH:mm
  durationMins: number;
  fee: number;
  modes: UIMode[];
  status: "available" | "booked";
};

// Pagination query for listing vets
export type ListDoctorsQuery = {
  page?: number;
  limit?: number;
  search?: string;
  specialty?: string;
};

// Pagination response for listing vets
export type ListDoctorsResult = {
  items: DoctorCard[];
  total: number;
  page: number;
  limit: number;
};

// Minimal public user shape for updateMyUsername return
export type PublicUser = {
  _id: string;
  username: string;
  email: string;
  role: "admin" | "doctor" | "user";
  isBlocked: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

// Contract for the user service
export interface IUserService {
  // Account
  updateMyUsername(userId: string, username: string): Promise<PublicUser>;

  // Vets directory
  listDoctorsWithNextSlot(params: ListDoctorsQuery): Promise<ListDoctorsResult>;
  getDoctorPublicById(id: string): Promise<DoctorDetail | null>;
  listDoctorSlotsBetween(
    id: string,
    opts: { from: string; to: string; status?: "available" | "booked" }
  ): Promise<DoctorSlotEntry[]>;
}
