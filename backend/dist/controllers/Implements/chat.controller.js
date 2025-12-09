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
exports.ChatController = void 0;
const chat_service_1 = require("../../services/implements/chat.service");
const ResponseHelper_1 = require("../../http/ResponseHelper");
const messageConstant_1 = require("../../constants/messageConstant");
const svc = new chat_service_1.ChatService();
class ChatController {
    constructor() {
        this.startChat = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const userId = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString();
                if (!userId)
                    return ResponseHelper_1.ResponseHelper.unauthorized(res, messageConstant_1.HttpResponse.UNAUTHORIZED);
                const { listingId, receiverId } = req.body;
                if (!listingId || !receiverId) {
                    return ResponseHelper_1.ResponseHelper.badRequest(res, "listingId and receiverId are required");
                }
                const room = yield svc.startChat(userId, listingId, receiverId);
                return ResponseHelper_1.ResponseHelper.ok(res, room, "Chat room created or retrieved");
            }
            catch (err) {
                next(err);
            }
        });
        this.listRooms = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const userId = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString();
                if (!userId)
                    return ResponseHelper_1.ResponseHelper.unauthorized(res, messageConstant_1.HttpResponse.UNAUTHORIZED);
                const rooms = yield svc.listRooms(userId);
                return ResponseHelper_1.ResponseHelper.ok(res, rooms, messageConstant_1.HttpResponse.RESOURCE_FOUND);
            }
            catch (err) {
                next(err);
            }
        });
        this.listMessages = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const userId = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString();
                if (!userId)
                    return ResponseHelper_1.ResponseHelper.unauthorized(res, messageConstant_1.HttpResponse.UNAUTHORIZED);
                const roomId = req.params.roomId;
                const page = Number(req.query.page) || 1;
                const limit = Number(req.query.limit) || 20;
                if (!roomId) {
                    return ResponseHelper_1.ResponseHelper.badRequest(res, "roomId is required");
                }
                const result = yield svc.listMessages(userId, roomId, page, limit);
                return ResponseHelper_1.ResponseHelper.ok(res, result, messageConstant_1.HttpResponse.RESOURCE_FOUND);
            }
            catch (err) {
                next(err);
            }
        });
        this.sendMessage = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const userId = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString();
                if (!userId)
                    return ResponseHelper_1.ResponseHelper.unauthorized(res, messageConstant_1.HttpResponse.UNAUTHORIZED);
                const { roomId, content } = req.body;
                if (!roomId || !content) {
                    return ResponseHelper_1.ResponseHelper.badRequest(res, "roomId and content are required");
                }
                const message = yield svc.sendMessage(userId, roomId, content);
                return ResponseHelper_1.ResponseHelper.created(res, message, "Message sent");
            }
            catch (err) {
                next(err);
            }
        });
        this.markDelivered = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const userId = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString();
                if (!userId)
                    return ResponseHelper_1.ResponseHelper.unauthorized(res, messageConstant_1.HttpResponse.UNAUTHORIZED);
                const roomId = req.params.roomId;
                if (!roomId) {
                    return ResponseHelper_1.ResponseHelper.badRequest(res, "roomId is required");
                }
                const result = yield svc.markDelivered(userId, roomId);
                return ResponseHelper_1.ResponseHelper.ok(res, result, "Messages marked as delivered");
            }
            catch (err) {
                next(err);
            }
        });
        this.markSeen = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const userId = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString();
                if (!userId)
                    return ResponseHelper_1.ResponseHelper.unauthorized(res, messageConstant_1.HttpResponse.UNAUTHORIZED);
                const roomId = req.params.roomId;
                if (!roomId) {
                    return ResponseHelper_1.ResponseHelper.badRequest(res, "roomId is required");
                }
                const result = yield svc.markSeen(userId, roomId);
                return ResponseHelper_1.ResponseHelper.ok(res, result, "Messages marked as seen");
            }
            catch (err) {
                next(err);
            }
        });
    }
}
exports.ChatController = ChatController;
