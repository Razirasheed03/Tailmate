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
