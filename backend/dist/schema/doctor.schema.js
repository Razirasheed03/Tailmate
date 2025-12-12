"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Doctor = void 0;
//doctor.schema.ts 
const mongoose_1 = require("mongoose");
const VerificationSchema = new mongoose_1.Schema({
    status: { type: String, enum: ["pending", "verified", "rejected", "not_submitted"], default: "pending", required: true },
    certificateUrl: { type: String },
    rejectionReasons: [{ type: String }],
    submittedAt: { type: Date },
    verifiedAt: { type: Date },
    reviewedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
}, { _id: false });
const ProfileSchema = new mongoose_1.Schema({
    displayName: { type: String },
    bio: { type: String, maxlength: 5000 },
    specialties: [{ type: String }],
    experienceYears: { type: Number, min: 0, max: 80 },
    licenseNumber: { type: String },
    consultationFee: { type: Number, min: 0 },
    avatarUrl: { type: String },
}, { _id: false });
const DoctorSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", index: true, unique: true, required: true },
    verification: { type: VerificationSchema, default: { status: "pending" } },
    profile: { type: ProfileSchema, default: {} },
    stripeAccountId: { type: String, default: null },
    stripeOnboardingStatus: { type: String, enum: ["pending", "completed"], default: "pending" }
}, { timestamps: true });
exports.Doctor = (0, mongoose_1.model)("Doctor", DoctorSchema);
