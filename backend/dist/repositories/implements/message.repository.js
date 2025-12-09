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
exports.MessageRepository = void 0;
const mongoose_1 = require("mongoose");
const message_schema_1 = require("../../schema/message.schema");
class MessageRepository {
    constructor(model = message_schema_1.Message) {
        this.model = model;
    }
    create(roomId, senderId, content) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = yield this.model.create({
                roomId: new mongoose_1.Types.ObjectId(roomId),
                senderId: new mongoose_1.Types.ObjectId(senderId),
                content,
                type: "text",
                seenBy: [],
            });
            return doc.toObject();
        });
    }
    listByRoom(roomId, page, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            const skip = (page - 1) * limit;
            const [data, total] = yield Promise.all([
                this.model
                    .find({
                    roomId: new mongoose_1.Types.ObjectId(roomId),
                })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                this.model.countDocuments({
                    roomId: new mongoose_1.Types.ObjectId(roomId),
                }),
            ]);
            return {
                data: data.reverse(),
                total,
                page,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            };
        });
    }
    markDelivered(roomId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const updated = yield this.model.updateMany({
                roomId: new mongoose_1.Types.ObjectId(roomId),
                deliveredTo: { $ne: new mongoose_1.Types.ObjectId(userId) },
            }, {
                $addToSet: { deliveredTo: new mongoose_1.Types.ObjectId(userId) },
            });
            return updated;
        });
    }
    markSeen(roomId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const updated = yield this.model.updateMany({
                roomId: new mongoose_1.Types.ObjectId(roomId),
                seenBy: { $ne: new mongoose_1.Types.ObjectId(userId) },
            }, {
                $addToSet: { seenBy: new mongoose_1.Types.ObjectId(userId) },
            });
            return updated;
        });
    }
    findById(messageId) {
        return __awaiter(this, void 0, void 0, function* () {
            const msg = yield this.model
                .findById(new mongoose_1.Types.ObjectId(messageId))
                .lean();
            return msg;
        });
    }
    getMessagesByRoom(roomId) {
        return __awaiter(this, void 0, void 0, function* () {
            const messages = yield this.model
                .find({ roomId: new mongoose_1.Types.ObjectId(roomId) })
                .lean();
            return messages;
        });
    }
}
exports.MessageRepository = MessageRepository;
