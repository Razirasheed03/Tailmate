import { Model, Types } from "mongoose";
import { MatchmakingListing } from "../../schema/matchmaking.schema";

export class MatchmakingRepository {
  constructor(private readonly model: Model<any> = MatchmakingListing) {}

  async create(userId: string, body: any) {
    const doc = await this.model.create({
      ...body,
      userId: new Types.ObjectId(userId),
      petId: new Types.ObjectId(body.petId),
      latitude: body.latitude,
  longitude: body.longitude,
  location: {
    type: "Point",
    coordinates: [body.longitude, body.latitude], // [lng, lat]
  },

      history: [
        {
          action: "created",
          by: new Types.ObjectId(userId),
          meta: { place: body.place },
        },
      ],
    });

    return doc.toObject();
  }

async listPublic(params: {
  page: number;
  limit: number;
  q?: string;
  place?: string;
  sortBy?: string;
  lat?: number;
  lng?: number;
  radius?: number;
}) {
  const { page, limit } = params;

  const filter: any = {
    deletedAt: null,
    status: "active",
  };

  // -----------------------------------------------------
  // TEXT SEARCH
  // -----------------------------------------------------
  if (params.q?.trim()) {
    const q = params.q.trim();
    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
      { place: { $regex: q, $options: "i" } },
    ];
  }

  // -----------------------------------------------------
  // GEO RADIUS FILTER
  // -----------------------------------------------------
  if (
    typeof params.lat === "number" &&
    typeof params.lng === "number" &&
    typeof params.radius === "number" &&
    params.radius > 0
  ) {
    const radiusInRadians = params.radius / 6371; // Earth radius km

    filter.location = {
      $geoWithin: {
        $centerSphere: [[params.lng, params.lat], radiusInRadians],
      },
    };
  }

  // -----------------------------------------------------
  // SORTING
  // -----------------------------------------------------
  let sort: any = { createdAt: -1 };

  switch (params.sortBy) {
    case "oldest":
      sort = { createdAt: 1 };
      break;
    case "title_az":
      sort = { title: 1 };
      break;
    case "title_za":
      sort = { title: -1 };
      break;
  }

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    this.model.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    this.model.countDocuments(filter),
  ]);

  return {
    data,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}




  async listMine(userId: string, page: number, limit: number) {
    const filter = {
      userId: new Types.ObjectId(userId),
      deletedAt: null,
    };

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.model.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async update(userId: string, id: string, patch: any) {
    const updated = await this.model
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(id),
          userId: new Types.ObjectId(userId),
          deletedAt: null,
        },
        {
          $set: patch,
          $push: {
            history: {
              action: "updated",
              by: new Types.ObjectId(userId),
              meta: { changed: Object.keys(patch) },
            },
          },
        },
        { new: true, runValidators: true }
      )
      .lean();

    return updated;
  }

  async changeStatus(
    userId: string,
    id: string,
    status: "active" | "matched" | "closed"
  ) {
    const updated = await this.model
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(id),
          userId: new Types.ObjectId(userId),
          deletedAt: null,
        },
        {
          $set: { status },
          $push: {
            history: {
              action: "status_changed",
              by: new Types.ObjectId(userId),
              meta: { status },
            },
          },
        },
        { new: true }
      )
      .lean();

    return updated;
  }

  async remove(userId: string, id: string) {
    const res = await this.model.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        userId: new Types.ObjectId(userId),
        deletedAt: null,
      },
      {
        $set: { deletedAt: new Date(), status: "closed" },
        $push: {
          history: {
            action: "deleted",
            by: new Types.ObjectId(userId),
          },
        },
      }
    );

    return !!res;
  }

  async findById(id: string) {
    const doc = await this.model
      .findOne({
        _id: new Types.ObjectId(id),
        deletedAt: null,
      })
      .lean();

    return doc;
  }
}
