import { Schema, model, Types } from 'mongoose';

const HistorySchema = new Schema(
  {
    at: { type: Date, default: Date.now },
    action: { type: String, required: true }, // created|updated|status_changed|deleted
    by: { type: Types.ObjectId, ref: 'User', required: true },
    meta: { type: Schema.Types.Mixed, default: null }, // optional details snapshot
  },
  { _id: false }
);

const MarketplaceListingSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },

    // content
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
    description: { type: String, required: true, trim: true, minlength: 10, maxlength: 4000 },
    photos: {
      type: [String],
      default: [],
      validate: [(arr: string[]) => arr.length <= 6, 'Max 6 photos'],
    },

    // sell vs adopt
    price: { type: Number, default: null, min: 0 }, // null => adopt
    type: { type: String, enum: ['sell', 'adopt'], required: true }, // derived on create
    status: { type: String, enum: ['active', 'reserved', 'closed'], default: 'active', index: true },

    // extra
    ageText: { type: String, default: '', trim: true, maxlength: 60 },
    place: { type: String, required: true, trim: true, maxlength: 120, index: true },
    contact: { type: String, required: true, trim: true, maxlength: 60 },

    // housekeeping
    history: { type: [HistorySchema], default: [] },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

export const MarketplaceListing = model('MarketplaceListing', MarketplaceListingSchema);
