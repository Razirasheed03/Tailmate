"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationModel = void 0;
// /backend/src/schema/notification.schema.ts
const mongoose_1 = require("mongoose");
const NotificationSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    userRole: { type: String, enum: ["doctor", "admin", "user", "superadmin"], required: true },
    type: { type: String, enum: ["booking", "system", "message", "alert", "CONSULTATION_CANCELLED"], required: true, default: "system" },
    message: { type: String, required: true },
    meta: { type: mongoose_1.Schema.Types.Mixed, default: {} },
    read: { type: Boolean, default: false },
}, { timestamps: true });
exports.NotificationModel = (0, mongoose_1.model)("Notification", NotificationSchema);
