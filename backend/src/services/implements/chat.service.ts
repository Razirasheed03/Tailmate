import { ChatRepository } from "../../repositories/implements/chat.repository";
import { MessageRepository } from "../../repositories/implements/message.repository";
import { MatchmakingRepository } from "../../repositories/implements/matchmaking.repository";

export class ChatService {
  constructor(
    private readonly chatRepo = new ChatRepository(),
    private readonly messageRepo = new MessageRepository(),
    private readonly matchmakingRepo = new MatchmakingRepository()
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
    return result;
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

    await this.messageRepo.markSeen(roomId, currentUserId);
    return { success: true };
  }
}
