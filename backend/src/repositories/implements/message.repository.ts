import { Model, Types } from "mongoose";
import { Message } from "../../schema/message.schema";

export class MessageRepository {
  constructor(private readonly model: Model<any> = Message) {}

  async create(roomId: string, senderId: string, content: string) {
    const doc = await this.model.create({
      roomId: new Types.ObjectId(roomId),
      senderId: new Types.ObjectId(senderId),
      content,
      type: "text",
      seenBy: [],
    });

    return doc.toObject();
  }

  async listByRoom(roomId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.model
        .find({
          roomId: new Types.ObjectId(roomId),
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.model.countDocuments({
        roomId: new Types.ObjectId(roomId),
      }),
    ]);

    return {
      data: data.reverse(),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async markDelivered(roomId: string, userId: string) {
    const updated = await this.model.updateMany(
      {
        roomId: new Types.ObjectId(roomId),
        deliveredTo: { $ne: new Types.ObjectId(userId) },
      },
      {
        $addToSet: { deliveredTo: new Types.ObjectId(userId) },
      }
    );

    return updated;
  }

  async markSeen(roomId: string, userId: string) {
    const updated = await this.model.updateMany(
      {
        roomId: new Types.ObjectId(roomId),
        seenBy: { $ne: new Types.ObjectId(userId) },
      },
      {
        $addToSet: { seenBy: new Types.ObjectId(userId) },
      }
    );

    return updated;
  }

  async findById(messageId: string) {
    const msg = await this.model
      .findById(new Types.ObjectId(messageId))
      .lean();
    return msg;
  }

  async getMessagesByRoom(roomId: string) {
    const messages = await this.model
      .find({ roomId: new Types.ObjectId(roomId) })
      .lean();
    return messages;
  }
}
