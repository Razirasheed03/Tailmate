"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = exports.uploadPdf = void 0;
//middlewares/upload.ts
const multer_1 = __importDefault(require("multer"));
const storage = multer_1.default.memoryStorage();
// why: no temp disk writes; stream buffer to Cloudinary
exports.uploadPdf = (0, multer_1.default)({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (_req, file, cb) => {
        if (file.mimetype !== "application/pdf") {
            return cb(new Error("Only PDF files are allowed"));
        }
        cb(null, true);
    },
}).single("certificate"); // frontend field name
exports.uploadImage = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (_req, file, cb) => {
        if (!/^image\/(png|jpe?g|gif|webp)$/i.test(file.mimetype)) {
            return cb(new Error("Only image files are allowed (png, jpg, jpeg, gif, webp)"));
        }
        cb(null, true);
    },
}).single("avatar");
