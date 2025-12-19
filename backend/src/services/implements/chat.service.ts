import { IChatRepository } from "../../repositories/interfaces/chat.repository.inteface";
import { IMatchmakingRepository } from "../../repositories/interfaces/matchmaking.repository.interface";
import { IMessageRepository } from "../../repositories/interfaces/message.repository.interface";
import { IChatService } from "../interfaces/chat.service.interface";

//   ) {}
export class ChatService implements IChatService {
  constructor(
    private readonly chatRepo: IChatRepository,
    private readonly messageRepo: IMessageRepository,
    private readonly matchmakingRepo: IMatchmakingRepository
  ) {}

  async startChat(currentUserId: string, listingId: string, receiverId: string) {
    // Verify listing exists and get owner
    const listing = await this.matchmakingRepo.findById(listingId);
    if (!listing) {
      throw Object.assign(new Error("Listing not found"), { status: 404 });
    }

    const listingOwnerId = (listing as any).userId.toString();

    // Ensure the two users are different
    if (currentUserId === receiverId) {
      throw Object.assign(new Error("Cannot chat with yourself"), { status: 400 });
    }

    // Create or get room (one user must be the listing owner)
    const room = await this.chatRepo.findOrCreateRoom(
      listingId,
      listingOwnerId,
      currentUserId === listingOwnerId ? receiverId : currentUserId
    );

    return room;
  }

  async listRooms(currentUserId: string) {
    const rooms = await this.chatRepo.listRoomsByUser(currentUserId);
    return rooms;
  }

  async listMessages(
    currentUserId: string,
    roomId: string,
    page: number = 1,
    limit: number = 20
  ) {
    // Verify user is part of this room
    const room = await this.chatRepo.findRoomById(roomId);
    if (!room) {
      throw Object.assign(new Error("Room not found"), { status: 404 });
    }

    const userIds = (room as any).users.map((u: any) => u.toString());
    if (!userIds.includes(currentUserId)) {
      throw Object.assign(new Error("Unauthorized"), { status: 403 });
    }

    const result = await this.messageRepo.listByRoom(roomId, page, limit);

return {
  messages: result.data,
  total: result.total,
  page: result.page,
  limit,
};

  }

  async sendMessage(currentUserId: string, roomId: string, content: string) {
    if (!content?.trim()) {
      throw Object.assign(new Error("Message content required"), {
        status: 400,
      });
    }

    // Verify user is part of this room
    const room = await this.chatRepo.findRoomById(roomId);
    if (!room) {
      throw Object.assign(new Error("Room not found"), { status: 404 });
    }

    const userIds = (room as any).users.map((u: any) => u.toString());
    if (!userIds.includes(currentUserId)) {
      throw Object.assign(new Error("Unauthorized"), { status: 403 });
    }

    // Create message
    const message = await this.messageRepo.create(
      roomId,
      currentUserId,
      content
    );

    // Update room's last message
    await this.chatRepo.updateLastMessage(roomId, content);

    return message;
  }

  async markDelivered(currentUserId: string, roomId: string) {
    // Verify user is part of this room
    const room = await this.chatRepo.findRoomById(roomId);
    if (!room) {
      throw Object.assign(new Error("Room not found"), { status: 404 });
    }

    const userIds = (room as any).users.map((u: any) => u.toString());
    if (!userIds.includes(currentUserId)) {
      throw Object.assign(new Error("Unauthorized"), { status: 403 });
    }

    await this.messageRepo.markDelivered(roomId, currentUserId);
    return { success: true };
  }

  async markSeen(currentUserId: string, roomId: string) {
    // Verify user is part of this room
    const room = await this.chatRepo.findRoomById(roomId);
    if (!room) {
      throw Object.assign(new Error("Room not found"), { status: 404 });
    }

    const userIds = (room as any).users.map((u: any) => u.toString());
    if (!userIds.includes(currentUserId)) {
      throw Object.assign(new Error("Unauthorized"), { status: 403 });
    }

    const result = await this.messageRepo.markSeen(roomId, currentUserId);
    return { 
      success: true,
      modifiedCount: result.modifiedCount || 0,
      matchedCount: result.matchedCount || 0,
    };
  }
}
