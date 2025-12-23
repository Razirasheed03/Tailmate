"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatController = void 0;
const chat_controller_1 = require("../controllers/Implements/chat.controller");
const chat_service_1 = require("../services/implements/chat.service");
const chat_repository_1 = require("../repositories/implements/chat.repository");
const message_repository_1 = require("../repositories/implements/message.repository");
const matchmaking_repository_1 = require("../repositories/implements/matchmaking.repository");
exports.chatController = new chat_controller_1.ChatController(new chat_service_1.ChatService(new chat_repository_1.ChatRepository(), new message_repository_1.MessageRepository(), new matchmaking_repository_1.MatchmakingRepository()));
