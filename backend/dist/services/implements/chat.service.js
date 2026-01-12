"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
//   ) {}
class ChatService {
    constructor(chatRepo, messageRepo, matchmakingRepo) {
        this.chatRepo = chatRepo;
        this.messageRepo = messageRepo;
        this.matchmakingRepo = matchmakingRepo;
    }
    startChat(currentUserId, listingId, receiverId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Verify listing exists and get owner
            const listing = yield this.matchmakingRepo.findById(listingId);
            if (!listing) {
                throw Object.assign(new Error("Listing not found"), { status: 404 });
            }
            const listingOwnerId = listing.userId.toString();
            // Ensure the two users are different
            if (currentUserId === receiverId) {
                throw Object.assign(new Error("Cannot chat with yourself"), { status: 400 });
            }
            // Create or get room (one user must be the listing owner)
            const room = yield this.chatRepo.findOrCreateRoom(listingId, listingOwnerId, currentUserId === listingOwnerId ? receiverId : currentUserId);
            return room;
        });
    }
    listRooms(currentUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            const rooms = yield this.chatRepo.listRoomsByUser(currentUserId);
            return rooms;
        });
    }
    listMessages(currentUserId_1, roomId_1) {
        return __awaiter(this, arguments, void 0, function* (currentUserId, roomId, page = 1, limit = 20) {
            // Verify user is part of this room
            const room = yield this.chatRepo.findRoomById(roomId);
            if (!room) {
                throw Object.assign(new Error("Room not found"), { status: 404 });
            }
            const userIds = room.users.map((u) => u.toString());
            if (!userIds.includes(currentUserId)) {
                throw Object.assign(new Error("Unauthorized"), { status: 403 });
            }
            const result = yield this.messageRepo.listByRoom(roomId, page, limit);
            return {
                messages: result.data,
                total: result.total,
                page: result.page,
                limit,
            };
        });
    }
    sendMessage(currentUserId_1, roomId_1, content_1) {
        return __awaiter(this, arguments, void 0, function* (currentUserId, roomId, content, type = "text", attachments) {
            if (!(content === null || content === void 0 ? void 0 : content.trim())) {
                throw Object.assign(new Error("Message content required"), {
                    status: 400,
                });
            }
            // Verify user is part of this room
            const room = yield this.chatRepo.findRoomById(roomId);
            if (!room) {
                throw Object.assign(new Error("Room not found"), { status: 404 });
            }
            const userIds = room.users.map((u) => u.toString());
            if (!userIds.includes(currentUserId)) {
                throw Object.assign(new Error("Unauthorized"), { status: 403 });
            }
            // Create message
            const message = yield this.messageRepo.create(roomId, currentUserId, content, type, attachments);
            // Update room's last message
            yield this.chatRepo.updateLastMessage(roomId, content);
            return message;
        });
    }
    markDelivered(currentUserId, roomId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Verify user is part of this room
            const room = yield this.chatRepo.findRoomById(roomId);
            if (!room) {
                throw Object.assign(new Error("Room not found"), { status: 404 });
            }
            const userIds = room.users.map((u) => u.toString());
            if (!userIds.includes(currentUserId)) {
                throw Object.assign(new Error("Unauthorized"), { status: 403 });
            }
            yield this.messageRepo.markDelivered(roomId, currentUserId);
            return { success: true };
        });
    }
    markSeen(currentUserId, roomId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Verify user is part of this room
            const room = yield this.chatRepo.findRoomById(roomId);
            if (!room) {
                throw Object.assign(new Error("Room not found"), { status: 404 });
            }
            const userIds = room.users.map((u) => u.toString());
            if (!userIds.includes(currentUserId)) {
                throw Object.assign(new Error("Unauthorized"), { status: 403 });
            }
            const result = yield this.messageRepo.markSeen(roomId, currentUserId);
            return {
                success: true,
                modifiedCount: result.modifiedCount || 0,
                matchedCount: result.matchedCount || 0,
            };
        });
    }
}
exports.ChatService = ChatService;
