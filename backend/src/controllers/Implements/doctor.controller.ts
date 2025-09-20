import { Request, Response, NextFunction } from "express";
import { DoctorService } from "../../services/implements/doctor.service";
import {
  uploadImageBufferToCloudinary,
  uploadPdfBufferToCloudinary,
} from "../../utils/uploadToCloudinary";
import { HttpStatus } from "../../constants/httpStatus";

export class DoctorController {
  constructor(private readonly svc: DoctorService) {}

  getVerification = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId =
        (req as any).user?._id?.toString() || (req as any).user?.id;
      if (!userId)
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .json({ success: false, message: "Unauthorized" });
      const data = await this.svc.getVerification(userId);
      res.status(HttpStatus.OK).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  uploadCertificate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId =
        (req as any).user?._id?.toString() || (req as any).user?.id;
      if (!userId)
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .json({ success: false, message: "Unauthorized" });

      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file)
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ success: false, message: "No file uploaded" });

      const { secure_url } = await uploadPdfBufferToCloudinary(
        file.buffer,
        file.originalname
      );

      const updated = await this.svc.submitCertificate(userId, secure_url);
      return res.status(HttpStatus.OK).json({
        success: true,
        data: {
          certificateUrl: secure_url,
          verification: updated.verification,
        },
        message: "Certificate uploaded and submitted for review",
      });
    } catch (err) {
      next(err);
    }
  };

  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId =
        (req as any).user?._id?.toString() || (req as any).user?.id;
      if (!userId)
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .json({ success: false, message: "Unauthorized" });
      const data = await this.svc.getProfile(userId);
      res.status(HttpStatus.OK).json({ success: true, data });
    } catch (err: any) {
      const status = (err && err.status) || HttpStatus.INTERNAL_SERVER_ERROR;
      res
        .status(status)
        .json({
          success: false,
          message: err?.message || "Failed to fetch profile",
        });
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId =
        (req as any).user?._id?.toString() || (req as any).user?.id;
      if (!userId)
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .json({ success: false, message: "Unauthorized" });
      const payload = req.body || {};
      const data = await this.svc.updateProfile(userId, payload);
      res.status(HttpStatus.OK).json({ success: true, data, message: "Profile updated" });
    } catch (err: any) {
      const status = (err && err.status) || HttpStatus.BAD_REQUEST;
      res
        .status(status)
        .json({
          success: false,
          message: err?.message || "Failed to update profile",
        });
    }
  };
  uploadAvatar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId =
        (req as any).user?._id?.toString() || (req as any).user?.id;
      if (!userId)
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .json({ success: false, message: "Unauthorized" });
      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file)
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ success: false, message: "No image uploaded" });

      const { secure_url } = await uploadImageBufferToCloudinary(
        file.buffer,
        file.originalname
      );

      // Option A: return URL and let client persist via PUT /doctor/profile
      return res
        .status(HttpStatus.OK)
        .json({ success: true, data: { avatarUrl: secure_url } });

    } catch (err) {
      next(err);
    }
  };
}
