import { Schema, model, Types } from "mongoose";

const MessageSchema = new Schema(
  {
    roomId: {
      type: Types.ObjectId,
      ref: "ChatRoom",
      required: true,
      index: true,
    },
    senderId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: { type: String, required: true, trim: true },
    type: { type: String, enum: ["text"], default: "text" },
    deliveredTo: {
      type: [Types.ObjectId],
      ref: "User",
      default: [],
    },
    seenBy: {
      type: [Types.ObjectId],
      ref: "User",
      default: [],
    },
  },
  { timestamps: true }
);

export const Message = model("Message", MessageSchema);
