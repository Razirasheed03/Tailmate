//repositories/implements/marketplace.repository.ts
import { Model, Types } from 'mongoose';
import { MarketplaceListing } from '../../schema/marketplaceListing.schema';

export class MarketplaceRepository {
  constructor(private readonly model: Model<any> = MarketplaceListing) {}

  async create(userId: string, body: any) {
    if (!body.petId) throw Object.assign(new Error("petId is required"), { status: 400 });

    const doc = await this.model.create({
      ...body,
      userId: new Types.ObjectId(userId),
      sellerId: new Types.ObjectId(userId),
      petId: new Types.ObjectId(body.petId),
      type: body.price === null || body.price === undefined ? 'adopt' : 'sell',
      history: [
        {
          action: 'created',
          by: new Types.ObjectId(userId),
          meta: { price: body.price ?? null, place: body.place },
        },
      ],
    });
    return doc.toObject();
  }
 async listPublic(params: { 
  page: number; 
  limit: number; 
  type?: string; 
  q?: string; 
  place?: string;
  minPrice?: number;
  maxPrice?: number;
  excludeFree?: boolean;
  sortBy?: string;
}) {
  const { page, limit } = params;
  const filter: any = { deletedAt: null, status: 'active' };
  
  // Existing filters
  if (params.type === 'sell' || params.type === 'adopt') filter.type = params.type;
  if (params.place?.trim()) filter.place = { $regex: params.place.trim(), $options: 'i' };
  if (params.q?.trim()) {
    const q = params.q.trim();
    filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { place: { $regex: q, $options: 'i' } },
    ];
  }

  // ✅ NEW: Price filtering logic
  if (params.minPrice !== undefined || params.maxPrice !== undefined || params.excludeFree) {
    const priceFilter: any = {};
    
    if (params.excludeFree) {
      // Exclude free items (price = null or 0)
      priceFilter.$ne = null;
      priceFilter.$gt = 0;
    }
    
    if (params.minPrice !== undefined) {
      if (params.excludeFree) {
        priceFilter.$gte = params.minPrice;
      } else {
        // Include free items but filter paid items by minimum price
        filter.$or = [
          { price: null }, // Free items
          { price: { $gte: params.minPrice } }
        ];
      }
    }
    
    if (params.maxPrice !== undefined) {
      if (filter.$or) {
        // If we already have $or for free items, update it
        filter.$or = [
          { price: null },
          { 
            price: { 
              $gte: params.minPrice || 0, 
              $lte: params.maxPrice 
            } 
          }
        ];
      } else {
        priceFilter.$lte = params.maxPrice;
      }
    }
    
    if (!filter.$or && Object.keys(priceFilter).length > 0) {
      filter.price = priceFilter;
    }
  }

  // ✅ NEW: Sorting logic
  let sort: any = { createdAt: -1 }; // default: newest first
  
  switch (params.sortBy) {
    case 'oldest':
      sort = { createdAt: 1 };
      break;
    case 'price_low':
      sort = { price: 1, createdAt: -1 };
      break;
    case 'price_high':
      sort = { price: -1, createdAt: -1 };
      break;
    case 'title_az':
      sort = { title: 1, createdAt: -1 };
      break;
    case 'title_za':
      sort = { title: -1, createdAt: -1 };
      break;
    default:
      sort = { createdAt: -1 };
  }

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    this.model.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    this.model.countDocuments(filter),
  ]);
  
  return { data, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

  async listMine(userId: string, page: number, limit: number) {
    const filter = { userId: new Types.ObjectId(userId), deletedAt: null };
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.model.countDocuments(filter),
    ]);
    return { data, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }

  async update(userId: string, id: string, patch: any) {
    const _id = new Types.ObjectId(id);
    const owner = new Types.ObjectId(userId);
    const set: any = {};
    const allowed = ['title', 'description', 'price', 'ageText', 'place', 'contact', 'photos', 'status'];

    for (const k of allowed) {
      if (k in patch) set[k] = patch[k];
    }
    if ('price' in patch) set.type = patch.price === null || patch.price === undefined ? 'adopt' : 'sell';

    const updated = await this.model.findOneAndUpdate(
      { _id, userId: owner, deletedAt: null },
      {
        $set: set,
        $push: {
          history: {
            action: 'updated',
            by: owner,
            meta: { changed: Object.keys(set) },
          },
        },
      },
      { new: true, runValidators: true, context: 'query' }
    ).lean();
    return updated;
  }

  async changeStatus(userId: string, id: string, status: 'active' | 'reserved' | 'closed') {
    const _id = new Types.ObjectId(id);
    const owner = new Types.ObjectId(userId);
    const updated = await this.model.findOneAndUpdate(
      { _id, userId: owner, deletedAt: null },
      {
        $set: { status },
        $push: { history: { action: 'status_changed', by: owner, meta: { status } } },
      },
      { new: true }
    ).lean();
    return updated;
  }

  async remove(userId: string, id: string) {
    const _id = new Types.ObjectId(id);
    const owner = new Types.ObjectId(userId);
    const res = await this.model.findOneAndUpdate(
      { _id, userId: owner, deletedAt: null },
      {
        $set: { deletedAt: new Date(), status: 'closed' },
        $push: { history: { action: 'deleted', by: owner } },
      },
      { new: false }
    );
    return !!res;
  }
}
