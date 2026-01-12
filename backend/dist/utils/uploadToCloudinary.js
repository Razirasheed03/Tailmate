"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadPdfBufferToCloudinary = uploadPdfBufferToCloudinary;
exports.uploadImageBufferToCloudinary = uploadImageBufferToCloudinary;
exports.uploadPetImageBufferToCloudinary = uploadPetImageBufferToCloudinary;
exports.uploadMarketplaceImageBufferToCloudinary = uploadMarketplaceImageBufferToCloudinary;
exports.uploadChatBufferToCloudinary = uploadChatBufferToCloudinary;
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
function uploadPdfBufferToCloudinary(buffer, filename) {
    return __awaiter(this, void 0, void 0, function* () {
        // why: Cloudinary raw uploads accept data URI or buffer stream; here we use upload_stream
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.default.uploader.upload_stream({
                resource_type: "raw", // important for PDFs
                folder: "doctor-certificates", // why: organize in folder
                public_id: filename.replace(/\.[^/.]+$/, ""), // strip extension
                use_filename: true,
                unique_filename: true, // avoids collisions
            }, (error, result) => {
                if (error || !result)
                    return reject(error);
                resolve({ secure_url: result.secure_url, public_id: result.public_id });
            });
            uploadStream.end(buffer);
        });
    });
}
function uploadImageBufferToCloudinary(buffer, filename) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.default.uploader.upload_stream({
                resource_type: "image",
                folder: "doctor-avatars",
                use_filename: true,
                unique_filename: true,
                overwrite: false,
            }, (error, result) => {
                if (error || !result)
                    return reject(error);
                resolve({ secure_url: result.secure_url, public_id: result.public_id });
            });
            uploadStream.end(buffer);
        });
    });
}
function uploadPetImageBufferToCloudinary(buffer, filename) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.default.uploader.upload_stream({
                resource_type: "image",
                folder: "pets", // separate folder for pet photos
                use_filename: true,
                unique_filename: true,
                overwrite: false,
                public_id: filename.replace(/\.[^/.]+$/, ""), // optional: strip extension
            }, (error, result) => {
                if (error || !result)
                    return reject(error);
                resolve({ secure_url: result.secure_url, public_id: result.public_id });
            });
            uploadStream.end(buffer);
        });
    });
}
function uploadMarketplaceImageBufferToCloudinary(buffer, filename) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.default.uploader.upload_stream({
                resource_type: 'image',
                folder: 'marketplace-listings', // dedicated folder for listing photos
                use_filename: true,
                unique_filename: true,
                overwrite: false,
                public_id: filename.replace(/\.[^/.]+$/, ''),
            }, (error, result) => {
                if (error || !result)
                    return reject(error);
                resolve({ secure_url: result.secure_url, public_id: result.public_id });
            });
            uploadStream.end(buffer);
        });
    });
}
function uploadChatBufferToCloudinary(buffer, filename) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.default.uploader.upload_stream({
                resource_type: "auto",
                folder: "chat-attachments",
                use_filename: true,
                unique_filename: true,
                overwrite: false,
                public_id: filename.replace(/\.[^/.]+$/, ""),
            }, (error, result) => {
                if (error || !result)
                    return reject(error);
                resolve({ secure_url: result.secure_url, public_id: result.public_id });
            });
            uploadStream.end(buffer);
        });
    });
}
