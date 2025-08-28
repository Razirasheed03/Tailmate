import { Model } from "mongoose";
import { Doctor } from "../../schema/doctor.schema";

export const DoctorModel: Model<any> = Doctor;
// why: keep typing loose at model boundary to avoid TS friction for now
