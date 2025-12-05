import { Schema, model, Types } from "mongoose";

const ChatRoomSchema = new Schema(
  {
    listingId: {
      type: Types.ObjectId,
      ref: "MatchmakingListing",
      required: true,
      index: true,
    },
    users: {
      type: [Types.ObjectId],
      ref: "User",
      required: true,
      validate: {
        validator: function (v: any) {
          return Array.isArray(v) && v.length === 2;
        },
        message: "Must have exactly 2 users",
      },
      index: true,
    },
    lastMessage: { type: String, default: null },
    lastMessageAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Compound index for unique room per listing + users
ChatRoomSchema.index({ listingId: 1, users: 1 }, { unique: true });

export const ChatRoom = model("ChatRoom", ChatRoomSchema);
