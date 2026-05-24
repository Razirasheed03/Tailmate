import { UserModel } from "../models/implements/user.model";
import { Doctor } from "../schema/doctor.schema";
import { generateAccessToken } from "./jwt";
import { BlockedUserError } from "../http/errors";

/**
 * Build a fresh access token from the database (source of truth for role/doctorId).
 */
export async function createAccessTokenForUser(userId: string): Promise<string> {
  const user = await UserModel.findById(userId).select("-password");
  if (!user) {
    throw new Error("User not found");
  }
  if (user.isBlocked) {
    throw new BlockedUserError();
  }

  const role = user.role;
  let doctorId: string | undefined;

  if (role === "doctor") {
    const doctor = await Doctor.findOne({ userId: user._id }).select("_id").lean();
    doctorId = doctor?._id?.toString();
  }

  return generateAccessToken(userId, role, doctorId);
}
