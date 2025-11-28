import { Schema, model, Types } from "mongoose";

const MatchEventSchema = new Schema(
  {
    at: { type: Date, default: Date.now },
    action: { type: String, required: true },
    by: { type: Types.ObjectId, ref: "User", required: true },
    meta: { type: Schema.Types.Mixed, default: null },
  },
  { _id: false }
);

const MatchmakingListingSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    petId: { type: Types.ObjectId, ref: "Pet", required: true, index: true },

    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },

    photos: { type: [String], default: [] },

    place: { type: String, required: true, trim: true },

    contact: { type: String, required: true, trim: true },

    status: {
      type: String,
      enum: ["active", "matched", "closed"],
      default: "active",
    },

    deletedAt: { type: Date, default: null },

    history: { type: [MatchEventSchema], default: [] },
  },
  { timestamps: true }
);

MatchmakingListingSchema.index({ createdAt: -1 });
MatchmakingListingSchema.index({ place: 1 });

export const MatchmakingListing = model(
  "MatchmakingListing",
  MatchmakingListingSchema
);
