import { Model, Types } from "mongoose";
import { ChatRoom } from "../../schema/chatRoom.schema";
import { IChatRepository } from "../interfaces/chat.repository.inteface";

export class ChatRepository implements IChatRepository {
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
    .findOneAndUpdate(
      {
        listingId: new Types.ObjectId(listingId),
        users,
      },
      {
        $setOnInsert: {
          listingId: new Types.ObjectId(listingId),
          users,
          createdAt: new Date(),
        },
      },
      {
        upsert: true,
        new: true,
      }
    )
    .populate("listingId", "title photos userId")
    .populate("users", "username avatar _id")
    .lean();

  return room;
}


  async findRoomById(roomId: string) {
    const room = await this.model
      .findById(new Types.ObjectId(roomId))
      .lean();
    return room;
  }

async listRoomsByUser(userId: string) {
  return this.model
    .find({ users: new Types.ObjectId(userId) })
    .populate('listingId', 'title photos userId')
    .populate('users', 'username avatar _id')
    .sort({
      lastMessageAt: -1,     // newest chat first
      createdAt: -1          // fallback for no messages
    })
    .lean();
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
