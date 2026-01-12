//middlewares/upload.ts
import multer from "multer";

const storage = multer.memoryStorage(); 
// why: no temp disk writes; stream buffer to Cloudinary

export const uploadPdf = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed"));
    }
    cb(null, true);
  },
}).single("certificate"); // frontend field name

export const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(png|jpe?g|gif|webp)$/i.test(file.mimetype)) {
      return cb(new Error("Only image files are allowed (png, jpg, jpeg, gif, webp)"));
    }
    cb(null, true);
  },
}).single("avatar");

export const uploadChatFile = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
}).single("file");
