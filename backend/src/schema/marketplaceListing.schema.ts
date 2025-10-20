// backend/src/schema/marketplaceListing.schema.ts (augment to include petId and sellerId)
import { Schema, model, Types } from 'mongoose';

const HistorySchema = new Schema(
  {
    at: { type: Date, default: Date.now },
    action: { type: String, required: true },
    by: { type: Types.ObjectId, ref: 'User', required: true },
    meta: { type: Schema.Types.Mixed, default: null },
  },
  { _id: false }
);

const MarketplaceListingSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true, index: true }, // original seller field
    sellerId: { type: Types.ObjectId, ref: 'User', required: true, index: true }, // mirror of userId to be explicit
    petId: { type: Types.ObjectId, ref: 'Pet', required: true, index: true }, // REQUIRED
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
    description: { type: String, required: true, trim: true, minlength: 10, maxlength: 4000 },
    photos: { type: [String], default: [], validate: [(arr: string[]) => arr.length <= 6, 'Max 6 photos'] },
    price: { type: Number, default: null, min: 0 },
    type: { type: String, enum: ['sell', 'adopt'], required: true },
    status: { type: String, enum: ['active', 'reserved', 'closed'], default: 'active', index: true },
    ageText: { type: String, default: '', trim: true, maxlength: 60 },
    place: { type: String, required: true, trim: true, maxlength: 120, index: true },
    contact: { type: String, required: true, trim: true, maxlength: 60 },
    history: { type: [HistorySchema], default: [] },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

export const MarketplaceListing = model('MarketplaceListing', MarketplaceListingSchema);
