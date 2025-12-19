// repositories/interface/doctorPublic.repository.interface.ts

export type UIMode = "video" | "audio" | "inPerson";

export interface DoctorListParams {
  page: number;
  limit: number;
  search?: string;
  specialty?: string;
}

export interface DoctorListResult {
  items: any[];
  total: number;
  page: number;
  limit: number;
}

export interface GeneratedAvailabilityOptions {
  from: string;
  to: string;
}

export interface GeneratedSlot {
  _id: string;
  date: string;
  time: string;
  durationMins: number;
  fee: number;
  modes: UIMode[];
  status: "available";
}

export interface IDoctorPublicRepository {
  listVerifiedWithNextSlot(params: DoctorListParams): Promise<DoctorListResult>;
  getDoctorPublicById(id: string): Promise<any | null>;
  listGeneratedAvailability(
    id: string,
    opts: GeneratedAvailabilityOptions
  ): Promise<GeneratedSlot[]>;
}