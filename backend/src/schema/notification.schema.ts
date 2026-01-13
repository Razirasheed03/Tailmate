// /backend/src/schema/notification.schema.ts
import { Schema, model, Types } from "mongoose";

export type NotificationRole = "doctor" | "admin" | "user" | "superadmin";
export type NotificationType = "booking" | "system" | "message" | "alert" | "CONSULTATION_CANCELLED";

export interface NotificationAttrs {
  userId: Types.ObjectId;
  userRole: NotificationRole;
  type: NotificationType;
  message: string;
  meta?: any;
  read: boolean;
  createdAt?: Date;
}

const NotificationSchema = new Schema<NotificationAttrs>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    userRole: { type: String, enum: ["doctor", "admin", "user", "superadmin"], required: true },
    type: { type: String, enum: ["booking", "system", "message", "alert", "CONSULTATION_CANCELLED"], required: true, default: "system" },
    message: { type: String, required: true },
    meta: { type: Schema.Types.Mixed, default: {} },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const NotificationModel = model<NotificationAttrs>("Notification", NotificationSchema);
