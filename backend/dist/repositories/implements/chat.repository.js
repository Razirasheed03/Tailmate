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
exports.ChatRepository = void 0;
const mongoose_1 = require("mongoose");
const chatRoom_schema_1 = require("../../schema/chatRoom.schema");
class ChatRepository {
    constructor(model = chatRoom_schema_1.ChatRoom) {
        this.model = model;
    }
    findOrCreateRoom(listingId, userId1, userId2) {
        return __awaiter(this, void 0, void 0, function* () {
            const users = [
                new mongoose_1.Types.ObjectId(userId1),
                new mongoose_1.Types.ObjectId(userId2),
            ].sort((a, b) => a.toString().localeCompare(b.toString()));
            const room = yield this.model
                .findOneAndUpdate({
                listingId: new mongoose_1.Types.ObjectId(listingId),
                users,
            }, {
                $setOnInsert: {
                    listingId: new mongoose_1.Types.ObjectId(listingId),
                    users,
                    createdAt: new Date(),
                },
            }, {
                upsert: true,
                new: true,
            })
                .populate("listingId", "title photos userId")
                .populate("users", "username avatar _id")
                .lean();
            return room;
        });
    }
    findRoomById(roomId) {
        return __awaiter(this, void 0, void 0, function* () {
            const room = yield this.model
                .findById(new mongoose_1.Types.ObjectId(roomId))
                .lean();
            return room;
        });
    }
    listRoomsByUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.model
                .find({ users: new mongoose_1.Types.ObjectId(userId) })
                .populate('listingId', 'title photos userId')
                .populate('users', 'username avatar _id')
                .sort({
                lastMessageAt: -1, // newest chat first
                createdAt: -1 // fallback for no messages
            })
                .lean();
        });
    }
    updateLastMessage(roomId, message) {
        return __awaiter(this, void 0, void 0, function* () {
            const updated = yield this.model
                .findByIdAndUpdate(new mongoose_1.Types.ObjectId(roomId), {
                $set: {
                    lastMessage: message,
                    lastMessageAt: new Date(),
                },
            }, { new: true })
                .lean();
            return updated;
        });
    }
}
exports.ChatRepository = ChatRepository;
