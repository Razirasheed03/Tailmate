import { Request, Response, NextFunction } from "express";
import { DoctorService } from "../../services/implements/doctor.service";
import { uploadPdfBufferToCloudinary } from "../../utils/uploadToCloudinary";

export class DoctorController {
  constructor(private readonly svc: DoctorService) {}

  getVerification = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString() || (req as any).user?.id;
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
      const data = await this.svc.getVerification(userId);
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  };

  uploadCertificate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString() || (req as any).user?.id;
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) return res.status(400).json({ success: false, message: "No file uploaded" });

      const { secure_url } = await uploadPdfBufferToCloudinary(file.buffer, file.originalname);

      const updated = await this.svc.submitCertificate(userId, secure_url);
      return res.status(200).json({
        success: true,
        data: { certificateUrl: secure_url, verification: updated.verification },
        message: "Certificate uploaded and submitted for review",
      });
    } catch (err) { next(err); }
  };
}
