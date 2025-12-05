import { Model, Types } from "mongoose";
import { ChatRoom } from "../../schema/chatRoom.schema";

export class ChatRepository {
  constructor(private readonly model: Model<any> = ChatRoom) {}

  async findOrCreateRoom(
    listingId: string,
    userId1: string,
    userId2: string
  ) {
    const users = [
      new Types.ObjectId(userId1),
      new Types.ObjectId(userId2),
    ].sort((a, b) => a.toString().localeCompare(b.toString()));

    const room = await this.model
      .findOne({
        listingId: new Types.ObjectId(listingId),
        users: { $all: users },
      })
      .populate('listingId', 'title photos userId')
      .populate('users', 'username avatar _id')
      .lean();

    if (room) {
      return room;
    }

    const newRoom = await this.model
      .create({
        listingId: new Types.ObjectId(listingId),
        users,
      });

    const populatedRoom = await this.model
      .findById(newRoom._id)
      .populate('listingId', 'title photos userId')
      .populate('users', 'username avatar _id')
      .lean();

    return populatedRoom;
  }

  async findRoomById(roomId: string) {
    const room = await this.model
      .findById(new Types.ObjectId(roomId))
      .lean();
    return room;
  }

  async listRoomsByUser(userId: string) {
    const rooms = await this.model
      .find({
        users: new Types.ObjectId(userId),
      })
      .populate('listingId', 'title photos userId')
      .populate('users', 'username avatar _id')
      .sort({ lastMessageAt: -1 })
      .lean();

    return rooms;
  }

  async updateLastMessage(roomId: string, message: string) {
    const updated = await this.model
      .findByIdAndUpdate(
        new Types.ObjectId(roomId),
        {
          $set: {
            lastMessage: message,
            lastMessageAt: new Date(),
          },
        },
        { new: true }
      )
      .lean();

    return updated;
  }
}
