import type { Request, Response, NextFunction } from "express";
import { ResponseHelper } from "../../http/ResponseHelper";
import { HttpResponse } from "../../constants/messageConstant";
import { uploadChatBufferToCloudinary } from "../../utils/uploadToCloudinary";

export class UploadController {
  uploadChat = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString();
      if (!userId) {
        return ResponseHelper.unauthorized(res, HttpResponse.UNAUTHORIZED);
      }

      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) {
        return ResponseHelper.badRequest(res, "file is required");
      }

      const uploaded = await uploadChatBufferToCloudinary(file.buffer, file.originalname);

      return ResponseHelper.created(
        res,
        {
          url: uploaded.secure_url,
          name: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
        },
        "Upload successful"
      );
    } catch (err) {
      next(err);
    }
  };
}

export const uploadController = new UploadController();
