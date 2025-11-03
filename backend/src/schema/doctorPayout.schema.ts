import { Schema, model } from "mongoose";

const doctorPayoutSchema = new Schema({
  doctorId: { type: Schema.Types.ObjectId, required: true, ref: "Doctor" },
  amount: { type: Number, required: true },
  status: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

export const DoctorPayoutModel = model("DoctorPayout", doctorPayoutSchema);
