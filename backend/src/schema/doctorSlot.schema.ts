// backend/src/schema/doctorSlot.schema.ts
import { Schema, model, Types, HydratedDocument } from "mongoose";

export type UIMode = "video" | "audio" | "inPerson";
export type SlotStatus = "available" | "booked";

export interface DoctorSlotAttrs {
  userId: Types.ObjectId;
  date: string;        // YYYY-MM-DD
  time: string;        // HH:mm
  durationMins: number;
  fee: number;
  modes: UIMode[];
  status: SlotStatus;
}

export type DoctorSlotDoc = HydratedDocument<DoctorSlotAttrs>;

const DoctorSlotSchema = new Schema<DoctorSlotAttrs>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    durationMins: { type: Number, min: 5, max: 120, required: true },
    fee: { type: Number, min: 0, default: 0 },
    modes: { type: [String], enum: ["video", "audio", "inPerson"], default: ["video"], required: true },
    status: { type: String, enum: ["available", "booked"], default: "available", required: true },
  },
  { timestamps: true }
);

// Unique start per user+date
DoctorSlotSchema.index({ userId: 1, date: 1, time: 1 }, { unique: true });

export const DoctorSlot = model<DoctorSlotAttrs>("DoctorSlot", DoctorSlotSchema);

export type DoctorSlotEntity = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  date: string;
  time: string;
  durationMins: number;
  fee: number;
  modes: UIMode[];
  status: SlotStatus;
  createdAt?: Date;
  updatedAt?: Date;
};
