import { Model } from "mongoose";
import { Doctor } from "../../schema/doctor.schema";

export const DoctorModel: Model<any> = Doctor;